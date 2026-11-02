/** The coarse class of a finished run. Closed: nothing outside this union can be constructed. */
export type ExitCode = 0 | 1 | 2 | 3 | 4 | 5

/** Every registered failure name. snake_case, never reused. */
export type ErrorCode =
	| "internal"
	| "invalid_input"
	| "unknown_command"
	| "unknown_flag"
	| "unknown_format"

export type ErrorSpec = { exit: ExitCode; message: string }

/**
 * The single source of truth for failures. The envelope's `exitCode`, `run()`'s return value,
 * `traj schema` and the tests all read this table. A code carries exactly one class; a case that
 * seems to need two classes is two codes.
 */
export const registry: Record<ErrorCode, ErrorSpec> = {
	internal: { exit: 1, message: "Unexpected internal error." },
	invalid_input: { exit: 2, message: "The input is invalid." },
	unknown_command: { exit: 2, message: "Unknown command." },
	unknown_flag: { exit: 2, message: "Unknown flag." },
	unknown_format: { exit: 2, message: "Unknown output format." },
}

export type FailOptions = {
	/** Replaces the registry message with a more specific one. */
	message?: string
	/** The input field the failure points at, dot-separated. */
	path?: string
	hint?: string
	details?: unknown
}

/** The `error` object of the JSON envelope. */
export type ErrorBody = {
	code: ErrorCode
	exitCode: ExitCode
	message: string
	path?: string
	hint?: string
	details?: unknown
}

// Not exported as a value: `fail()` is the only way to obtain an AppError, and the private field
// makes the type nominal, so a hand-written `{ code, exitCode }` is not assignable to it.
class AppErrorImpl {
	readonly #body: ErrorBody
	constructor(body: ErrorBody) {
		this.#body = body
	}
	get body(): ErrorBody {
		return this.#body
	}
}

/** A failed command. Produced only by `fail()`. */
export type AppError = AppErrorImpl

/** Builds the only value a command may return on failure. */
export function fail(code: ErrorCode, options: FailOptions = {}): AppError {
	const spec = registry[code]
	const body: ErrorBody = {
		code,
		exitCode: spec.exit,
		message: options.message ?? spec.message,
	}
	if (options.path !== undefined) body.path = options.path
	if (options.hint !== undefined) body.hint = options.hint
	if (options.details !== undefined) body.details = options.details
	return new AppErrorImpl(body)
}

export function isAppError(value: unknown): value is AppError {
	return value instanceof AppErrorImpl
}
