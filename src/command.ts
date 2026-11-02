import type { z } from "zod"
import type { AppError, ErrorCode } from "./errors"

export type Env = Readonly<Record<string, string | undefined>>

/** What a command returns on success: structure only. The envelope layer renders it. */
export type Result<T = unknown> = { readonly ok: true; readonly data: T }

export function ok<T>(data: T): Result<T> {
	return { ok: true, data }
}

export type Example = { command: string; description: string }

/** What a running command may read from the outside world. */
export type Context = {
	env: Env
	commands: readonly AnyCommand[]
}

/**
 * A command carries its summary, the schema that validates its input, the schema its result must
 * satisfy, and the function that produces that result. It never formats and never exits.
 */
export type Command<I extends z.ZodType, O extends z.ZodType> = {
	name: string
	summary: string
	/** Names of the input fields filled from positional arguments, in order. */
	positionals: readonly string[]
	input: I
	output: O
	examples: readonly Example[]
	/** Codes this command raises itself. Global codes such as `unknown_flag` are not listed. */
	errorCodes: readonly ErrorCode[]
	run: (
		input: z.output<I>,
		ctx: Context,
	) => Result<z.input<O>> | AppError | Promise<Result<z.input<O>> | AppError>
}

/** A command with its schema types erased, for the command table. */
export type AnyCommand = {
	name: string
	summary: string
	positionals: readonly string[]
	input: z.ZodType
	output: z.ZodType
	examples: readonly Example[]
	errorCodes: readonly ErrorCode[]
	run: (input: unknown, ctx: Context) => Result | AppError | Promise<Result | AppError>
}

/** Keeps the schema types checked against `run` while storing the command in a uniform table. */
export function defineCommand<I extends z.ZodType, O extends z.ZodType>(
	command: Command<I, O>,
): AnyCommand {
	return command as unknown as AnyCommand
}

/** Commands in a stable order, so every listing is deterministic. */
export function sortedByName(commands: readonly AnyCommand[]): AnyCommand[] {
	return [...commands].sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0))
}
