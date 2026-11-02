import { parseArgs } from "node:util"
import type { AnyCommand } from "./command"
import { type AppError, fail, registry } from "./errors"

export const HELP_HINT = 'Run "traj help" to list commands.'

type Parsed = {
	values: { json?: boolean; help?: boolean; version?: boolean }
	positionals: string[]
}

export function parseFlags(argv: string[]): Parsed | AppError {
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
export function parseInput(
	command: AnyCommand,
	positionals: string[],
): { input: unknown } | AppError {
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
