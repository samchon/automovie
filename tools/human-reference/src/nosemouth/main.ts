import { fileURLToPath } from "node:url";

import { loadHeadContext } from "../headneck/loadHeadContext.ts";
import type { ReferenceManifest } from "../io/ReferenceManifest.ts";
import { readInput } from "../io/readInput.ts";
import { readManifest } from "../io/readManifest.ts";
import { sha256 } from "../io/sha256.ts";
import { writeArtifact } from "../io/writeArtifact.ts";
import type { MouthNetwork } from "./MouthNetwork.ts";
import type { MouthObservationScope } from "./MouthObservationScope.ts";
import type { MouthRibbonObservations } from "./MouthRibbonObservations.ts";
import { buildMouthNetwork } from "./buildMouthNetwork.ts";
import { observeMouth } from "./observeMouth.ts";

/**
 * Builds a cubic oral network from manifest-bound private source observations.
 * The observe operation first cuts declared body/head inputs under the explicit
 * metadata.mouthScope protocol. Outputs are immutable and remain separate from
 * product geometry; fit reads only the saved mouth-ribbons input.
 *
 * @evidence contracts/common.md#principled-implementation Manifest hash checks bind the complete observed curves before a deterministic fit and immutable artifact write.
 * @evidence contracts/common.md#clear-and-simple-design This CLI only admits arguments and wires the shared reader, mouth fitter and artifact writer.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No source directory, identity, vendor or geometry is embedded in the executable.
 * @evidence contracts/common.md#meaningful-documentation States the input role, explicit output ownership and source-only scope.
 * @evidence contracts/performance.md#efficient-algorithms Input JSON is parsed once; the mouth fitting operation owns geometric cost and the writer serializes one completed result.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A single CLI invocation coordinates no reusable requests or caches.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Shared readers and the atomic writer release file handles synchronously; this entry retains no state after return.
 */
export function main(arguments_: string[]): void {
  const required: (flag: string) => string = (flag: string): string => {
    const index: number = arguments_.indexOf(flag);
    if (index < 0 || !arguments_[index + 1])
      throw new Error(`Required argument: ${flag}`);
    return arguments_[index + 1];
  };
  const manifestPath: string = required("--manifest");
  const manifest: ReferenceManifest = readManifest(manifestPath);
  const operation: string = arguments_.includes("--operation")
    ? required("--operation")
    : "fit";
  if (operation !== "fit" && operation !== "observe")
    throw new Error("Mouth operation must be fit or observe");
  const scope: unknown = manifest.metadata?.mouthScope;
  if (operation === "observe" && (typeof scope !== "object" || scope === null))
    throw new Error(
      "Mouth source observation requires manifest metadata.mouthScope",
    );
  const input: MouthRibbonObservations =
    operation === "observe"
      ? observeMouth(loadHeadContext(manifest), scope as MouthObservationScope)
      : readInput<MouthRibbonObservations>(manifest, "mouth-ribbons");
  if (
    input.gate !== manifest.gate ||
    input.frame !== manifest.frame ||
    input.units !== manifest.units ||
    input.pose !== manifest.pose
  )
    throw new Error("Manifest and mouth observation registration differ");
  const toleranceMm: number = Number(required("--tolerance-mm"));
  const result: MouthNetwork = buildMouthNetwork(input, toleranceMm);
  const sourceFiles: string[] = [
    "main.ts",
    "buildMouthNetwork.ts",
    "MouthNetwork.ts",
    "MouthRibbonObservations.ts",
    "MouthObservationScope.ts",
    "observeMouth.ts",
    "../fit/fitCurve.ts",
    "../headneck/loadHeadContext.ts",
    "../headneck/P.ts",
    "../headneck/polyLen.ts",
    "../headneck/subArc.ts",
    "../headneck/arcLen.ts",
    "../geometry/cut.ts",
    "../geometry/buildSkin.ts",
    "../io/readManifest.ts",
    "../io/readInput.ts",
    "../io/loadGate.ts",
    "../io/loadMesh.ts",
    "../io/writeArtifact.ts",
    "../io/sha256.ts",
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
  if (operation === "observe")
    writeArtifact(required("--output"), "mouth-observations.json", {
      ...input,
      provenance,
    });
  const artifact: ReturnType<typeof writeArtifact> = writeArtifact(
    required("--output"),
    "mouth-network.json",
    { ...result, provenance },
  );
  console.log(
    JSON.stringify({
      gate: manifest.gate,
      ribbons: result.ribbons.length,
      ...artifact,
    }),
  );
}

main(process.argv.slice(2));
