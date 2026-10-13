import { createAutoMovieReferenceProvider } from "./createAutoMovieReferenceProvider";
import { createAutoMovieReferenceReader } from "./createAutoMovieReferenceReader";
import { ReferenceError } from "./internal/ReferenceError";
import type { IAutoMovieReferenceReader } from "./structures/IAutoMovieReference";
import type { IAutoMovieReferenceCommandRuntime } from "./IAutoMovieReferenceCommandRuntime";


/** Run one local JSON reference request and return its process exit status.
 *
 * @evidence contracts/common.md#principled-implementation The command requires one root and one JSON request, binds the reader before dispatch and writes one result envelope with a status determined by ok.
 * @evidence contracts/common.md#clear-and-simple-design Reader binding and stdout/stderr effects are explicit ports; portable provider semantics remain transport-independent.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Invalid JSON and startup failures use sanitized messages; no external exception text is copied into output.
 * @evidence contracts/common.md#meaningful-documentation The runtime member comments state read binding and output ownership; usage/startup errors return one and successful results return zero.
 * @evidence contracts/performance.md#efficient-algorithms Parsing and serializing one envelope adds O(request and output length) work to provider costs; no process or server is launched.
 * @evidence contracts/performance.md#reuse-equivalent-work One bound reader serves the single request; effectful writes and binding are not cached.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The runtime owns output streams and reader lifetime; this invocation retains only its current request and result until completion.
 */
export async function runAutoMovieReferenceCommand(
  argv: readonly string[],
  runtime: IAutoMovieReferenceCommandRuntime = {
    reader: createAutoMovieReferenceReader,
    stdout: (value: string) : void => {
      process.stdout.write(value);
    },
    stderr: (value: string) : void => {
      process.stderr.write(value);
    },
  },
): Promise<number> {
  if (argv.length !== 4 || argv[0] !== "--root" || argv[2] !== "--request") {
    runtime.stderr(
      "usage: automovie-reference --root <absolute-production-root> --request <JSON>\n",
    );
    return 1;
  }
  let input: unknown;
  try {
    input = JSON.parse(argv[3]);
  } catch {
    runtime.stdout(
      `${JSON.stringify({ ok: false, error: { code: "INVALID_JSON", message: "Request must be one JSON object." } })}\n`,
    );
    return 1;
  }
  let reader: IAutoMovieReferenceReader;
  try {
    reader = await runtime.reader(argv[1]);
  } catch (error) {
    runtime.stderr(
      `${error instanceof ReferenceError ? `${error.code}: ${error.message}` : "IO_ERROR: Unable to bind the production root."}\n`,
    );
    return 1;
  }
  const result: Awaited<ReturnType<ReturnType<typeof createAutoMovieReferenceProvider>>> = await createAutoMovieReferenceProvider(reader)(input);
  runtime.stdout(`${JSON.stringify(result)}\n`);
  return result.ok ? 0 : 1;
}
