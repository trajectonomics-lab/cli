import { describe, expect, it } from "bun:test"
import { capture } from "./test-support"
import { fixtureRoot } from "./test-tree"

const demo = (argv: string[]) => capture(argv, {}, fixtureRoot)

describe("usage", () => {
	it("lists groups next to commands at the root", async () => {
		const res = await demo([])
		expect(res.out).toContain("demo")
		expect(res.out).toContain("A fixture group")
	})

	it("explains a leaf from its schema for --help and for `help <path>`", async () => {
		for (const argv of [
			["demo", "echo", "--help"],
			["help", "demo", "echo"],
		]) {
			const res = await demo(argv)
			expect(res.code).toBe(0)
			expect(res.out).toContain("Usage: traj demo echo [options] <word>")
			expect(res.out).toContain("--times <number>")
			expect(res.out).toContain("How many times")
			expect(res.out).toContain("--tag <string>")
			expect(res.out).toContain("repeatable")
			expect(res.out).toContain("--from-date <string>")
			expect(res.out).toContain("--upper")
			expect(res.out).toContain("traj demo echo hi --upper")
		}
	})

	it("prints a group's usage for `help <group>` and `<group> --help`", async () => {
		for (const argv of [
			["help", "demo"],
			["demo", "--help"],
		]) {
			const res = await demo(argv)
			expect(res.out).toContain("Usage: traj demo <command>")
		}
	})

	it("rejects `help` for a path that does not exist", async () => {
		const res = await demo(["help", "demo", "nope", "--json"])
		expect(res.code).toBe(2)
		expect(JSON.parse(res.err).error.code).toBe("unknown_command")
	})

	it("answers --help in JSON when asked", async () => {
		const res = await demo(["demo", "echo", "--help", "--json"])
		expect(JSON.parse(res.out)).toContain("Usage: traj demo echo")
	})
})
