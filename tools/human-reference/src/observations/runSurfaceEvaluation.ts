import { parseArgs } from "node:util";

import { SurfaceIndex } from "../geometry/SurfaceIndex.ts";
import type { ReferenceManifest } from "../io/ReferenceManifest.ts";
import { readManifest } from "../io/readManifest.ts";
import { sha256 } from "../io/sha256.ts";
import { writeArtifact } from "../io/writeArtifact.ts";
import type { EvaluationMesh } from "./EvaluationMesh.ts";
import { measureSurfaceDistance } from "./measureSurfaceDistance.ts";
import { readEvaluationMesh } from "./readEvaluationMesh.ts";
import { surfaceTopology } from "./surfaceTopology.ts";

/**
 * Measures independent fixed reference and actual engine artifacts; generating inputs never include this evaluation manifest.
 *
 * @evidence contracts/common.md#principled-implementation Hash-admitted surfaces share physical units before separate omission and addition measurements.
 * @evidence contracts/common.md#clear-and-simple-design Admission, closest queries, sampling and immutable reporting retain separate owners.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No acceptance threshold, Human assertion, fallback mesh or full-surface guarantee is introduced.
 * @evidence contracts/common.md#meaningful-documentation States the evaluator-only source boundary and committed evaluator identity requirement.
 * @evidence contracts/performance.md#efficient-algorithms Builds one BVH per surface and reuses it for each direction's fixed sample budget; topology is measured once per surface.
 * @evidence contracts/performance.md#reuse-equivalent-work Shared verified-byte IO and immutable publication are reused without live mutable result caches.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Surfaces and indices belong to this CLI call and can release on completion or failure.
 */
export function runSurfaceEvaluation(): void {
  const args: ReturnType<typeof parseArgs> = parseArgs({
    options: {
      manifest: { type: "string" },
      output: { type: "string" },
      "source-commit": { type: "string" },
    },
  });
  const file: unknown = args.values.manifest,
    output: unknown = args.values.output,
    commit: unknown = args.values["source-commit"];
  if (
    typeof file !== "string" ||
    typeof output !== "string" ||
    typeof commit !== "string" ||
    !/^[a-f0-9]{40}$/i.test(commit)
  )
    throw new Error(
      "Use --manifest ABSOLUTE_PATH --output ABSOLUTE_DIRECTORY --source-commit EVALUATOR_COMMIT",
    );
  const manifest: ReferenceManifest = readManifest(file);
  if (
    manifest.pose !== "native-A" ||
    manifest.frame !==
      "+X subject-left, +Y up, +Z front, native root origin, mm"
  )
    throw new Error(
      "Common native-root millimetre frame and native-A posture are required",
    );
  const sourceInput: ReturnType<typeof readEvaluationMesh> = readEvaluationMesh(
      manifest,
      "source",
      "source",
    ),
    generatedInput: ReturnType<typeof readEvaluationMesh> = readEvaluationMesh(
      manifest,
      "reconstruction",
      "engine",
    );
  const source: EvaluationMesh = sourceInput.mesh,
    generated: EvaluationMesh = generatedInput.mesh;
  const sourceIndex: SurfaceIndex = new SurfaceIndex(
      source.vertices,
      source.triangles,
    ),
    generatedIndex: SurfaceIndex = new SurfaceIndex(
      generated.vertices,
      generated.triangles,
    );
  const omission: object = measureSurfaceDistance(source, generatedIndex),
    addition: object = measureSurfaceDistance(generated, sourceIndex);
  console.log(
    JSON.stringify(
      writeArtifact(output, "surface-evaluation.json", {
        gate: manifest.gate,
        evaluatedAt: new Date().toISOString(),
        units: "mm",
        frame: manifest.frame,
        pose: manifest.pose,
        evaluator: {
          sourceCommit: commit,
          manifest: { path: file, sha256: sha256(file) },
          inputs: manifest.files,
        },
        generatingConsumer: generatedInput.producer,
        sourceToGeneratedOmission: omission,
        generatedToSourceAddition: addition,
        sourceTopology: surfaceTopology(source),
        generatedTopology: surfaceTopology(generated),
        limits: [
          "Observed sample maxima are not full-surface bounds; finite sampling may miss thin or small-area defects.",
          "Triangle-order sampling provides no confidence interval. Height bins are geometric localization, not anatomical labels.",
          "Edge incidence does not certify self-intersection freedom, anatomical correctness or visual acceptance.",
          "Display normals are not read. Source is evaluation-only; generating input provenance is independent.",
        ],
      }),
    ),
  );
}
runSurfaceEvaluation();
