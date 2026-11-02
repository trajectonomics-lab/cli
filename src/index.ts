#!/usr/bin/env bun
import { run } from "./cli"

const code = await run(
	Bun.argv.slice(2),
	{
		out: (line) => console.log(line),
		err: (line) => console.error(line),
	},
	process.env,
)
process.exit(code)
