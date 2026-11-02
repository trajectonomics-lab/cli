import { describe, expect, it } from "bun:test"
import pkg from "../package.json"

async function traj(args: string[], env: Record<string, string> = {}) {
	const proc = Bun.spawn(["bun", "src/index.ts", ...args], {
		env: { PATH: process.env["PATH"] ?? "", ...env },
		stdout: "pipe",
		stderr: "pipe",
	})
	const [out, err, code] = await Promise.all([
		new Response(proc.stdout).text(),
		new Response(proc.stderr).text(),
		proc.exited,
	])
	return { code, out, err }
}

describe("process", () => {
	it("exits 0 and prints the bare version", async () => {
		const res = await traj(["--version"])
		expect(res.code).toBe(0)
		expect(res.out).toBe(`${pkg.version}\n`)
	})

	it("exits with the registry's class and writes the envelope to stderr", async () => {
		const res = await traj(["--nope", "--json"])
		expect(res.code).toBe(2)
		expect(res.out).toBe("")
		expect(JSON.parse(res.err).error.code).toBe("unknown_flag")
	})
})
