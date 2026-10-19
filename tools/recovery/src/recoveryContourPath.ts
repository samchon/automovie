import { runAutoMovieRecoveryCommand } from "@automovie/recovery/node";
import path from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Compatibility command forwarding to the installed recovery package.
 * The environment epoch is accepted only at this deprecated research entry point.
 *
 * @evidence contracts/common.md#principled-implementation The public dispatcher owns command admission and numerical execution.
 * @evidence contracts/common.md#clear-and-simple-design A thin compatibility consumer keeps existing command names without duplicate algorithms.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No source geometry or additional policy is supplied by this forwarding entry point.
 * @evidence contracts/common.md#meaningful-documentation Documents migration and the legacy environment provenance bridge.
 * @evidence contracts/performance.md#efficient-algorithms Argument forwarding adds constant work before the delegated operation.
 * @evidence contracts/performance.md#reuse-equivalent-work The package performs the operation once; the shim has no cache.
 * @evidence contracts/performance.md#bound-retention-and-release-resources No handle is acquired; the dispatcher owns command resources.
 */
export async function recoveryContourPath(args: string[]): Promise<number> {
  const sourceEpoch: string = process.env.RUN_SOURCE_EPOCH ?? "";
  return runAutoMovieRecoveryCommand([
    "recoveryContourPath",
    "--source-epoch",
    sourceEpoch,
    ...args,
  ]);
}

if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
)
  void recoveryContourPath(process.argv.slice(2)).then((code: number): void => {
    process.exitCode = code;
  });
