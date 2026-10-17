import path from "node:path";
import { fileURLToPath } from "node:url";

import { loadHeadContext } from "../headneck/loadHeadContext.ts";
import { readManifest } from "../io/readManifest.ts";
import { writeArtifact } from "../io/writeArtifact.ts";
import { observeEyes } from "./observeEyes.ts";

/**
 * Extracts native reference-eye observations from admitted body/head mesh bytes.
 * The immutable output contains observations and explicit geometric limits;
 * it neither admits Human runtime geometry nor executes a Human test.
 *
 * @evidence contracts/common.md#principled-implementation Uses manifest-bound geometry through the shared native head context and observeEyes source protocol, then publishes one immutable regional observation.
 * @evidence contracts/common.md#clear-and-simple-design One source manifest and one output root define the complete operation; annular fitting remains a separate consumer.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Contains no private path, provider, identity catalogue or generated product fixture.
 * @evidence contracts/common.md#meaningful-documentation Defines admitted inputs, immutable output and the limits of the observational operation.
 * @evidence contracts/performance.md#efficient-algorithms Context construction and observeEyes dominate one source operation; serialization takes output-linear time and memory.
 * @evidence contracts/performance.md#reuse-equivalent-work One admitted context and pair of auxiliary BVHs serve both eyes.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Shared synchronous IO owns file lifetime; no watcher, renderer or cross-run cache is retained by this command.
 */
export function runExtractEyes(
  manifestFile: string,
  outputDir: string,
): ReturnType<typeof writeArtifact> {
  return writeArtifact(
    outputDir,
    "face-eyes.json",
    observeEyes(loadHeadContext(readManifest(manifestFile))),
  );
}

if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  const manifestIndex: number = process.argv.indexOf("--manifest");
  const outputIndex: number = process.argv.indexOf("--output");
  if (
    manifestIndex < 0 ||
    outputIndex < 0 ||
    !process.argv[manifestIndex + 1] ||
    !process.argv[outputIndex + 1]
  )
    throw new Error(
      "Usage: runExtractEyes.ts --manifest <absolute JSON> --output <absolute immutable directory>",
    );
  console.log(
    JSON.stringify(
      runExtractEyes(
        process.argv[manifestIndex + 1],
        process.argv[outputIndex + 1],
      ),
    ),
  );
}
