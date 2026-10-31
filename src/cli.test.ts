import { describe, expect, it } from "bun:test"
import pkg from "../package.json"
import { run } from "./cli"

async function capture(argv: string[]) {
	const out: string[] = []
	const err: string[] = []
	const code = await run(argv, { out: (l) => out.push(l), err: (l) => err.push(l) })
	return { code, out: out.join("\n"), err: err.join("\n") }
}

describe("cli", () => {
	it("prints usage with no arguments", async () => {
		const res = await capture([])
		expect(res.code).toBe(0)
		expect(res.out).toContain("Usage: trajectonomics")
	})

	it("prints the version for --version and the version command", async () => {
		expect((await capture(["--version"])).out).toBe(pkg.version)
		expect((await capture(["version"])).out).toBe(pkg.version)
	})

	it("fails on an unknown command", async () => {
		const res = await capture(["nope"])
		expect(res.code).toBe(1)
		expect(res.err).toContain("Unknown command: nope")
	})
})
