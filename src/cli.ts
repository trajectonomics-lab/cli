import type { Env, Group, Leaf } from "./command"
import { root as defaultRoot } from "./commands"
import { type AppError, fail, isAppError } from "./errors"
import { parseInput } from "./input"
import { parseNodeArgs } from "./parse"
import { type Format, renderError, renderResult, resolveFormat } from "./render"
import { findNode, unknownCommand, walk } from "./tree"

export interface Io {
	out: (line: string) => void
	err: (line: string) => void
}

type Invocation = { leaf: Leaf; input: unknown }

function builtIn(root: Group, name: string, input: unknown): Invocation | AppError {
	const leaf = findNode(root, [name])
	if (leaf?.kind !== "leaf") return fail("internal")
	return { leaf, input }
}

/** Decides what to run: `--version` and `--help` win, a bare group falls back to its usage. */
function route(argv: string[], root: Group): Invocation | AppError {
	// --version is answered before any command word is looked up, as it always was.
	if (argv.some((token) => token === "--version" || token === "-v")) {
		return builtIn(root, "version", {})
	}
	const landed = walk(root, argv)
	if (isAppError(landed)) return landed
	const { node, path, rest } = landed
	const parsed = parseNodeArgs(node.kind === "leaf" ? node.flags : [], rest)
	if (isAppError(parsed)) return parsed
	if (node.kind === "group") {
		// Only words after a bare `--` can still be left over under a group.
		const stray = parsed.positionals[0]
		return stray === undefined ? builtIn(root, "help", { path }) : unknownCommand(path, stray)
	}
	if (parsed.help) return builtIn(root, "help", { path })
	const input = parseInput(node, parsed, path)
	return isAppError(input) ? input : { leaf: node, input: input.input }
}

async function dispatch(
	argv: string[],
	env: Env,
	root: Group,
): Promise<{ data: unknown } | AppError> {
	const invocation = route(argv, root)
	if (isAppError(invocation)) return invocation
	const result = await invocation.leaf.run(invocation.input, { env, root })
	if (isAppError(result)) return result
	// A result that breaks its own output schema is a programming error: it throws, and the
	// top-level catch turns it into the fixed `internal` envelope.
	return { data: invocation.leaf.output.parse(result.data) }
}

function failureOf(error: AppError, format: Format, io: Io): number {
	io.err(renderError(error, format))
	return error.body.exitCode
}

function badFormat(requested: string, io: Io): number {
	const error = fail("unknown_format", {
		message: `Unknown format: ${requested}`,
		hint: "Set TRAJ_FORMAT to human or json, or pass --json.",
	})
	return failureOf(error, "human", io)
}

/** Runs the CLI and returns the exit code. Never calls process.exit, so tests can drive it. */
export async function run(
	argv: string[],
	io: Io,
	env: Env,
	root: Group = defaultRoot,
): Promise<number> {
	// The format is settled first, by a pre-scan that cannot fail, so even a malformed command
	// line is answered in the format the caller asked for.
	const choice = resolveFormat(argv, env)
	try {
		if (choice.invalid !== undefined) return badFormat(choice.invalid, io)
		const outcome = await dispatch(argv, env, root)
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
