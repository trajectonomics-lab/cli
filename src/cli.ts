import type { AnyCommand, Env } from "./command"
import { help } from "./commands/help"
import { init } from "./commands/init"
import { schema } from "./commands/schema"
import { version } from "./commands/version"
import { type AppError, fail, isAppError } from "./errors"
import { HELP_HINT, parseFlags, parseInput } from "./parse"
import { type Format, renderError, renderResult, resolveFormat } from "./render"

export interface Io {
	out: (line: string) => void
	err: (line: string) => void
}

// Add a command here: one entry, one file under src/commands/.
const commands: readonly AnyCommand[] = [help, init, schema, version]

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
