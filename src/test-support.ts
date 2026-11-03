import { run } from "./cli"
import type { Group } from "./command"

export type Captured = { code: number; out: string; err: string }

export async function capture(
	argv: string[],
	env: Record<string, string | undefined> = {},
	root?: Group,
): Promise<Captured> {
	const out: string[] = []
	const err: string[] = []
	const code = await run(argv, { out: (l) => out.push(l), err: (l) => err.push(l) }, env, root)
	return { code, out: out.join("\n"), err: err.join("\n") }
}
