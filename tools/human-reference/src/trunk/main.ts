import { readManifest } from "../io/readManifest.ts";
import { runTrunk } from "./runTrunk.ts";

/**
 * Runs native trunk observation extraction with explicit private manifest and output paths.
 *
 * @evidence contracts/common.md#principled-implementation Requires both named paths and rejects unsupported arguments before invoking the hash-bound source producer. Native compilation cache ownership belongs to the invoking runner.
 * @evidence contracts/common.md#clear-and-simple-design This entry owns command-line parsing and reports the immutable artifact identity; geometry remains in named producer modules.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts There is no fallback private directory, selected identity or implicit reference input.
 * @evidence contracts/common.md#meaningful-documentation Names the two mandatory options and distinguishes runtime invocation from compiler-cache ownership.
 * @evidence contracts/performance.md#efficient-algorithms Parses the argument list once with constant auxiliary state; geometric extraction owns the dominant work.
 * @evidence contracts/performance.md#reuse-equivalent-work Loads the manifest once and delegates a single producer transaction; no independent cache or duplicate source load is introduced by the entry.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Owns no open handles or background jobs; producer errors propagate without publishing a partial artifact.
 */
export function main(): void {
  let manifest: string | undefined;
  let output: string | undefined;
  const args: string[] = process.argv.slice(2);
  for (let k: number = 0; k < args.length; k += 2) {
    const option: string = args[k];
    const value: string | undefined = args[k + 1];
    if (!value) throw new Error(`Missing value for ${option}`);
    if (option === "--manifest") manifest = value;
    else if (option === "--output") output = value;
    else throw new Error(`Unsupported trunk argument: ${option}`);
  }
  if (!manifest || !output)
    throw new Error(
      "Required: --manifest <absolute file> --output <absolute private directory>",
    );
  console.log(JSON.stringify(runTrunk(readManifest(manifest), output)));
}

main();
