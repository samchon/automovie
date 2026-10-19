import { recovery } from "./internal/recovery";
import { recoveryAtlas } from "./internal/recoveryAtlas";
import { recoveryContourPath } from "./internal/recoveryContourPath";
import { recoveryLocal } from "./internal/recoveryLocal";
import { recoveryOpen } from "./internal/recoveryOpen";

/**
 * Run an installed recovery command with explicit generating-source provenance.
 * Returns zero on completed execution, two for command admission and one for an
 * execution failure. A completed command can publish partial geometry; its artifact
 * coverage and diagnostics remain authoritative. This host alone writes console
 * records; importing the memory package performs no command or filesystem work.
 *
 * @evidence contracts/common.md#principled-implementation An explicit command table dispatches existing source observation or source-free reconstruction owners after validating a supplied source epoch.
 * @evidence contracts/common.md#clear-and-simple-design Installed and compatibility entry points share one dispatcher with explicit arguments; no environment variable supplies package behavior.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The dispatcher does not infer paths, change numeric policy, retry failed geometry, spawn workers or overwrite existing artifacts.
 * @evidence contracts/common.md#meaningful-documentation States exit meanings, explicit provenance and the separate meaning of partial geometry.
 * @evidence contracts/performance.md#efficient-algorithms Argument admission is O(A) in argument count before one delegated operation; generating and serialization costs remain with their owners.
 * @evidence contracts/performance.md#reuse-equivalent-work One command executes once with the supplied epoch and arguments; there is no result or effect cache.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The dispatcher acquires no handle and awaits the asynchronous local writer before returning; delegated hosts own their declared files and staging.
 */
export async function runAutoMovieRecoveryCommand(args: readonly string[]): Promise<number> {
  if (args.length === 0 || args[0] === "--help") {
    console.log(
      "automovie-recovery <recovery|recoveryOpen|recoveryLocal|recoveryAtlas|recoveryContourPath> --source-epoch <git-or-source-sha> <arguments>\n" +
        "recovery: extract|extract-prefix|reconstruct input.json output.json [prefixSections]\n" +
        "recoveryOpen: observe spec.json curves.json graph.json | reconstruct curves.json graph.json model.json\n" +
        "recoveryLocal: curves.json graph.json model.json ruled|quadratic [final-only|final-only-gzip] [analytic.json]\n" +
        "recoveryAtlas: observe|compile input.json new-output-directory\n" +
        "recoveryContourPath: input.json new-output-directory\n" +
        "Outputs can be partial. Inspect coverage and diagnostics; completion does not certify source fidelity or smoothness.",
    );
    return 0;
  }
  if (args.length === 1 && args[0] === "--version") {
    const metadata: { version: string } = require("../../package.json") as { version: string };
    console.log(`@automovie/recovery ${metadata.version}; operation schema automovie-recovery-operation-v1; legacy-contour-v1`);
    return 0;
  }
  const [command, flag, sourceEpoch, ...parameters]: readonly string[] = args;
  if (
    flag !== "--source-epoch" ||
    !sourceEpoch ||
    !/^[a-f0-9]{40,64}$/i.test(sourceEpoch) ||
    !["recovery", "recoveryOpen", "recoveryLocal", "recoveryAtlas", "recoveryContourPath"].includes(command ?? "")
  ) {
    console.error(JSON.stringify({ status: "refused", reason: "Use --help for commands; an explicit 40 to 64 digit hexadecimal source epoch is required" }));
    return 2;
  }
  try {
    switch (command) {
      case "recovery": recovery(parameters, sourceEpoch); break;
      case "recoveryOpen": recoveryOpen(parameters, sourceEpoch); break;
      case "recoveryLocal": await recoveryLocal(parameters, sourceEpoch); break;
      case "recoveryAtlas": recoveryAtlas(parameters, sourceEpoch); break;
      case "recoveryContourPath": recoveryContourPath(parameters, sourceEpoch); break;
    }
    return 0;
  } catch (failure: unknown) {
    console.error(JSON.stringify({ status: "failed", reason: failure instanceof Error ? failure.message : String(failure) }));
    return 1;
  }
}
