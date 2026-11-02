import { parseArgs } from "node:util"
import type { AnyCommand, Env } from "./command"
import { help } from "./commands/help"
import { init } from "./commands/init"
import { schema } from "./commands/schema"
import { version } from "./commands/version"
import { type AppError, fail, isAppError, registry } from "./errors"
import { type Format, renderError, renderResult, resolveFormat } from "./render"

export interface Io {
	out: (line: string) => void
	err: (line: string) => void
}

// Add a command here: one entry, one file under src/commands/.
const commands: readonly AnyCommand[] = [help, init, schema, version]

const HELP_HINT = 'Run "traj help" to list commands.'

type Parsed = {
	values: { json?: boolean; help?: boolean; version?: boolean }
	positionals: string[]
}

function parseFlags(argv: string[]): Parsed | AppError {
	try {
		return parseArgs({
			args: argv,
			options: {
				json: { type: "boolean" },
				help: { type: "boolean", short: "h" },
				version: { type: "boolean", short: "v" },
			},
			allowPositionals: true,
			strict: true,
		})
	} catch (error) {
		const message = error instanceof Error ? error.message : ""
		const unknown = /^Unknown option '([^']+)'/.exec(message)
		if (unknown) {
			return fail("unknown_flag", { message: `Unknown flag: ${unknown[1]}`, hint: HELP_HINT })
		}
		return fail("invalid_input", { message: message.split(". ")[0] ?? message, hint: HELP_HINT })
	}
}

/** Fills a command's input from positionals and validates it against the command's schema. */
function parseInput(command: AnyCommand, positionals: string[]): { input: unknown } | AppError {
	if (positionals.length > command.positionals.length) {
		return fail("invalid_input", {
			message: `Unexpected argument: ${positionals[command.positionals.length]}`,
			hint: `Run "traj schema ${command.name}" to see its input.`,
		})
	}
	const raw: Record<string, string> = {}
	command.positionals.forEach((name, index) => {
		const value = positionals[index]
		if (value !== undefined) raw[name] = value
	})
	const parsed = command.input.safeParse(raw)
	if (parsed.success) return { input: parsed.data }
	const issues = parsed.error.issues.map((issue) => ({
		path: issue.path.join("."),
		message: issue.message,
	}))
	const first = issues[0]
	return fail("invalid_input", {
		message: first?.message ?? registry.invalid_input.message,
		...(first?.path ? { path: first.path } : {}),
		details: issues,
	})
}

async function dispatch(argv: string[], env: Env): Promise<{ data: unknown } | AppError> {
	const parsed = parseFlags(argv)
	if (isAppError(parsed)) return parsed
	const { values, positionals } = parsed

	// --version and --help are checked before any command name is looked up.
	const [commandName, ...rest] = positionals
	const [name, args] = values.version
		? ["version", []]
		: !commandName || values.help
			? ["help", []]
			: [commandName, rest]

	const command = commands.find((candidate) => candidate.name === name)
	if (!command) {
		return fail("unknown_command", { message: `Unknown command: ${name}`, hint: HELP_HINT })
	}
	const input = parseInput(command, args)
	if (isAppError(input)) return input

	const result = await command.run(input.input, { env, commands })
	if (isAppError(result)) return result
	// A result that breaks its own output schema is a programming error: it throws, and the
	// top-level catch turns it into the fixed `internal` envelope.
	return { data: command.output.parse(result.data) }
}

function failureOf(error: AppError, format: Format, io: Io): number {
	io.err(renderError(error, format))
	return error.body.exitCode
}

/** Runs the CLI and returns the exit code. Never calls process.exit, so tests can drive it. */
export async function run(argv: string[], io: Io, env: Env): Promise<number> {
	// The format is settled first, by a pre-scan that cannot fail, so even a malformed command
	// line is answered in the format the caller asked for.
	const choice = resolveFormat(argv, env)
	try {
		if (choice.invalid !== undefined) {
			return failureOf(
				fail("unknown_format", {
					message: `Unknown format: ${choice.invalid}`,
					hint: "Set TRAJ_FORMAT to human or json, or pass --json.",
				}),
				"human",
				io,
			)
		}
		const outcome = await dispatch(argv, env)
		if (isAppError(outcome)) return failureOf(outcome, choice.format, io)
		io.out(renderResult(outcome.data, choice.format))
		return 0
	} catch (error) {
		// The message is fixed text; diagnostics go to stderr only when TRAJ_DEBUG asks for them.
		if (env["TRAJ_DEBUG"] === "1") {
			io.err(error instanceof Error ? (error.stack ?? error.message) : String(error))
		}
		return failureOf(fail("internal"), choice.format, io)
	}
}
