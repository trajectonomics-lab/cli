import type { Group, Leaf, Node } from "./command"
import type { FlagSpec } from "./flags"
import { sortedByName } from "./tree"

function table(rows: readonly (readonly [string, string])[]): string[] {
	const width = Math.max(0, ...rows.map(([left]) => left.length))
	return rows.map(([left, right]) => `  ${left.padEnd(width)}  ${right}`.trimEnd())
}

function flagLabel(spec: FlagSpec): string {
	return spec.kind === "boolean" ? `--${spec.flag}` : `--${spec.flag} <${spec.kind}>`
}

function flagNote(spec: FlagSpec): string {
	const notes = [spec.description, spec.multiple ? "repeatable" : undefined]
	if (spec.required) notes.push("required")
	return notes.filter(Boolean).join("; ")
}

const GLOBAL_OPTIONS: readonly (readonly [string, string])[] = [
	["--json", "Print JSON; errors become a JSON envelope on stderr"],
	["-h, --help", "Show usage"],
	["-v, --version", "Print the version"],
]

const ENVIRONMENT: readonly (readonly [string, string])[] = [
	["TRAJ_FORMAT", "human (default) or json; --json takes precedence"],
	["TRAJ_HOME", "Data directory (default ~/.traj)"],
	["TRAJ_DEBUG", "Set to 1 to print diagnostics for unexpected errors"],
]

function groupUsage(group: Group, path: readonly string[]): string {
	const rows = sortedByName(group.children).map((child) => [child.name, child.summary] as const)
	const isRoot = path.length === 0
	return [
		`Usage: traj ${[...path, "<command>"].join(" ")} [options]`,
		...(isRoot ? [] : ["", group.summary]),
		"",
		"Commands:",
		...table(rows),
		...(isRoot
			? ["", "Options:", ...table(GLOBAL_OPTIONS), "", "Environment:", ...table(ENVIRONMENT)]
			: []),
	].join("\n")
}

function leafUsage(leaf: Leaf, path: readonly string[]): string {
	const words = leaf.positionals.map((name) => `<${name}>`)
	const flags = leaf.flags.length > 0 ? ["[options]"] : []
	const own = leaf.flags.map((spec) => [flagLabel(spec), flagNote(spec)] as const)
	const examples = leaf.examples.map((example) => [example.command, example.description] as const)
	return [
		`Usage: traj ${[...path, ...flags, ...words].join(" ")}`,
		"",
		leaf.summary,
		...(own.length > 0 ? ["", "Options:", ...table(own)] : []),
		"",
		"Global options:",
		...table(GLOBAL_OPTIONS),
		...(examples.length > 0 ? ["", "Examples:", ...table(examples)] : []),
	].join("\n")
}

/** The usage text of a node, built from its schemas so it cannot drift from what is accepted. */
export function usageOf(node: Node, path: readonly string[]): string {
	return node.kind === "group" ? groupUsage(node, path) : leafUsage(node, path)
}
