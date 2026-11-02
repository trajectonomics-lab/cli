import type { z } from "zod"
import type { AppError, ErrorCode } from "./errors"
import { checkPositionals, deriveFlags, type FlagSpec } from "./flags"

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
	root: Group
}

type Outcome<T> = Result<T> | AppError | Promise<Result<T> | AppError>

/**
 * A leaf command carries its summary, the schema that validates its input, the schema its result
 * must satisfy, and the function that produces that result. It never formats and never exits.
 * Flags are derived from the input schema: every field that is not a positional is a flag.
 */
export type Command<I extends z.ZodObject, O extends z.ZodType> = {
	name: string
	summary: string
	/** Input fields filled from positional words, in order. The last may be an array. */
	positionals: readonly string[]
	input: I
	output: O
	examples: readonly Example[]
	/** Codes this command raises itself. Global codes such as `unknown_flag` are not listed. */
	errorCodes: readonly ErrorCode[]
	run: (input: z.output<I>, ctx: Context) => Outcome<z.input<O>>
}

/** A leaf with its schema types erased and its flags derived, for the command tree. */
export type Leaf = {
	kind: "leaf"
	name: string
	summary: string
	positionals: readonly string[]
	input: z.ZodObject
	output: z.ZodType
	flags: readonly FlagSpec[]
	examples: readonly Example[]
	errorCodes: readonly ErrorCode[]
	run: (input: unknown, ctx: Context) => Outcome<unknown>
}

/** A named set of subcommands. It has no `run` of its own: bare `traj tx` prints its usage. */
export type Group = {
	kind: "group"
	name: string
	summary: string
	children: readonly Node[]
}

export type Node = Leaf | Group

/** Keeps the schema types checked against `run`, then erases them for the tree. */
export function defineCommand<I extends z.ZodObject, O extends z.ZodType>(
	command: Command<I, O>,
): Leaf {
	checkPositionals(command.input, command.positionals)
	const flags = deriveFlags(command.input, command.positionals)
	return { kind: "leaf", ...command, flags } as unknown as Leaf
}

export function defineGroup(group: Omit<Group, "kind">): Group {
	const names = group.children.map((child) => child.name)
	const duplicate = names.find((name, index) => names.indexOf(name) !== index)
	if (duplicate) throw new Error(`Group "${group.name}" has two children named "${duplicate}".`)
	return { kind: "group", ...group }
}
