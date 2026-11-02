import type { Leaf } from "./command"
import { type AppError, fail, isAppError, registry } from "./errors"
import { isVariadic } from "./flags"
import type { Parsed } from "./parse"

/** Maps positional words onto the leaf's positional fields; the last may take all the rest. */
function fillPositionals(
	leaf: Leaf,
	words: readonly string[],
	path: readonly string[],
): Record<string, unknown> | AppError {
	const last = leaf.positionals.at(-1)
	const variadic = last !== undefined && isVariadic(leaf.input, last)
	if (!variadic && words.length > leaf.positionals.length) {
		return fail("invalid_input", {
			message: `Unexpected argument: ${words[leaf.positionals.length]}`,
			hint: `Run "traj help ${path.join(" ")}" to see its input.`,
		})
	}
	const fields: Record<string, unknown> = {}
	for (const [index, name] of leaf.positionals.entries()) {
		const rest = variadic && name === last
		const value = rest ? words.slice(index) : words[index]
		if (value !== undefined && value.length > 0) fields[name] = value
	}
	return fields
}

function validate(leaf: Leaf, raw: Record<string, unknown>): { input: unknown } | AppError {
	const result = leaf.input.safeParse(raw)
	if (result.success) return { input: result.data }
	const issues = result.error.issues.map((issue) => ({
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

/** Fills the positional fields from words, merges the flags, and validates the whole input. */
export function parseInput(
	leaf: Leaf,
	parsed: Parsed,
	path: readonly string[],
): { input: unknown } | AppError {
	const positional = fillPositionals(leaf, parsed.positionals, path)
	if (isAppError(positional)) return positional
	return validate(leaf, { ...parsed.fields, ...positional })
}
