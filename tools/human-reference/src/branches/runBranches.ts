import { parseArgs } from "node:util";

import type { Skin } from "../geometry/Skin.ts";
import { buildSkin } from "../geometry/buildSkin.ts";
import type { ReferenceManifest } from "../io/ReferenceManifest.ts";
import { loadGate } from "../io/loadGate.ts";
import { readManifest } from "../io/readManifest.ts";
import { sha256 } from "../io/sha256.ts";
import { writeArtifact } from "../io/writeArtifact.ts";
import type { BranchDefinition } from "./BranchDefinition.ts";
import type { BranchObservation } from "./BranchObservation.ts";
import { defineBranch } from "./defineBranch.ts";
import { observeBranch } from "./observeBranch.ts";

/**
 * Emits immutable private branch observations from a hash-bound input manifest.
 * Invoke with --manifest <absolute file> --output <new absolute directory>.
 * This operation retains exact private source observations and emits no Human mesh.
 *
 * @evidence contracts/common.md#principled-implementation Admits the manifest's millimetres, posture and source-axis protocol, verifies declared input bytes through loadGate, then writes the five named branch observations atomically with their input manifest identity.
 * @evidence contracts/common.md#clear-and-simple-design Owns the command boundary only; manifest admission, mesh construction, branch measurements and immutable publication remain with their respective producers.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Contains no fixed input path, provider name, embedded geometry or case-specific fit. Diagnostic arm rotations are rejected because they do not supply corrected shoulder anatomy.
 * @evidence contracts/common.md#meaningful-documentation States required arguments, private-output responsibility, native-pose and frame requirements and the lack of reconstructed-surface acceptance.
 * @evidence contracts/performance.md#efficient-algorithms Loads each declared mesh once, constructs one skin and processes five branch families sequentially. Dominant section and event costs are documented by the observation producers; publication adds a linear serialization pass per artifact.
 * @evidence contracts/performance.md#reuse-equivalent-work Shares the single immutable loaded skin across regions and binds each artifact to the admitted input manifest. Existing identical output bytes are reused by writeArtifact; differing bytes never replace a prior artifact.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Holds one skin for the command lifetime and one region's observations through its synchronous publication; IO helpers release their own resources and the command retains no global state.
 */
export function runBranches(argv: string[]): void {
  const options: ReturnType<typeof parseArgs> = parseArgs({
    args: argv,
    options: { manifest: { type: "string" }, output: { type: "string" } },
    strict: true,
  });
  const manifestFile: string | boolean | (string | boolean)[] | undefined =
    options.values.manifest;
  const output: string | boolean | (string | boolean)[] | undefined =
    options.values.output;
  if (typeof manifestFile !== "string" || typeof output !== "string")
    throw new Error(
      "Required: --manifest <absolute file> --output <absolute directory>",
    );
  const identity: string = sha256(manifestFile);
  const manifest: ReferenceManifest = readManifest(manifestFile);
  if (
    manifest.pose !== "native-A" ||
    !manifest.frame.startsWith("+X subject-left, +Y up, +Z front")
  )
    throw new Error(
      "Branch protocol requires the native source pose and +X subject-left, +Y up, +Z front frame",
    );
  const source: ReturnType<typeof loadGate> = loadGate(manifest);
  const skin: Skin = buildSkin(source.body, source.head, "native-A");
  const names: BranchDefinition["name"][] = [
    "shoulder-l",
    "shoulder-r",
    "thigh-l",
    "thigh-r",
    "groin",
  ];
  for (const name of names) {
    const observation: BranchObservation = observeBranch(
      skin,
      defineBranch(skin, name),
    );
    if (sha256(manifestFile) !== identity)
      throw new Error("Input manifest changed during branch observation");
    const artifact: ReturnType<typeof writeArtifact> = writeArtifact(
      output,
      `${name}.json`,
      {
        ...observation,
        gate: manifest.gate,
        units: manifest.units,
        frame: manifest.frame,
        inputManifestSha256: identity,
        inputFiles: manifest.files,
        observationOnly: true,
      },
    );
    console.log(
      JSON.stringify({
        region: name,
        ...artifact,
        sections: observation.sections.length,
        events: observation.events.length,
        unresolved:
          observation.limits.length - observation.definition.limits.length - 2,
      }),
    );
  }
}

runBranches(process.argv.slice(2));
