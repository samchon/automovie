import path from "node:path";
import { fileURLToPath } from "node:url";

import { loadHeadContext } from "../headneck/loadHeadContext.ts";
import { observeHeadFrame } from "../headneck/observeHeadFrame.ts";
import type { ReferenceManifest } from "../io/ReferenceManifest.ts";
import { readManifest } from "../io/readManifest.ts";
import { sha256 } from "../io/sha256.ts";
import { writeArtifact } from "../io/writeArtifact.ts";
import type { RegionFile } from "../schema/RegionFile.ts";
import { buildNose } from "./buildNose.ts";

/**
 * Writes nasal observations from declared body/head inputs into an immutable
 * private artifact. This source extraction is not engine surface generation
 * or acceptance of a reconstructed nose.
 *
 * @evidence contracts/common.md#principled-implementation Hash-admitted source geometry and the shared head-frame protocol feed one nasal observer before immutable publication.
 * @evidence contracts/common.md#clear-and-simple-design The entry wires manifest, context, shared frame, observer and writer without another geometry implementation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts There are no private paths, source identities, source coordinates or fallback surfaces in the executable.
 * @evidence contracts/common.md#meaningful-documentation States private output ownership and the distinction between observation and reconstructed-surface acceptance.
 * @evidence contracts/performance.md#efficient-algorithms One source context is loaded for the frame and nose observer; the complete result is serialized once.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A single invocation coordinates no cross-request cache.
 * @evidence contracts/performance.md#bound-retention-and-release-resources File readers and immutable writer own their short synchronous handles; the entry retains no context after return.
 */
export function runNose(args: string[]): void {
  const option: (name: string) => string = (name: string): string => {
    const index: number = args.indexOf(name);
    if (index < 0 || !args[index + 1] || args[index + 1].startsWith("--"))
      throw new Error(`Required argument: ${name}`);
    return args[index + 1];
  };
  const manifestPath: string = option("--manifest");
  const manifest: ReferenceManifest = readManifest(manifestPath);
  const context: ReturnType<typeof loadHeadContext> = loadHeadContext(manifest);
  const observations: RegionFile = buildNose(
    context,
    observeHeadFrame(context),
  );
  const sourceFiles: string[] = [
    "runNose.ts",
    "buildNose.ts",
    "observeNostrilRims.ts",
    "observeAlarGrooves.ts",
    "../headneck/observeHeadFrame.ts",
    "../headneck/farthest.ts",
    "../headneck/loadHeadContext.ts",
    "../headneck/isoContour.ts",
    "../headneck/createRegion.ts",
    "../headneck/createSection.ts",
    "../headneck/P.ts",
    "../headneck/polyLen.ts",
    "../headneck/locate.ts",
    "../headneck/walkFrom.ts",
    "../headneck/subArc.ts",
    "../geometry/cut.ts",
    "../geometry/buildSkin.ts",
    "../schema/joinCourse.ts",
    "../schema/orientLoop.ts",
    "../io/readManifest.ts",
    "../io/readInput.ts",
    "../io/loadGate.ts",
    "../io/loadMesh.ts",
    "../io/writeArtifact.ts",
  ];
  const provenance: object = {
    manifestSha256: sha256(manifestPath),
    tools: sourceFiles.map(
      (file: string): { file: string; sha256: string } => ({
        file,
        sha256: sha256(fileURLToPath(new URL(file, import.meta.url))),
      }),
    ),
  };
  const artifact: ReturnType<typeof writeArtifact> = writeArtifact(
    option("--output"),
    "face-nose.json",
    { ...observations, provenance },
  );
  console.log(
    JSON.stringify({
      gate: manifest.gate,
      sections: observations.sections.length,
      loops: observations.loops.length,
      courses: observations.courses.length,
      ...artifact,
    }),
  );
}

if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
)
  runNose(process.argv.slice(2));
