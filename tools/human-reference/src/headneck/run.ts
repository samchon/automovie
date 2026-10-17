import path from "node:path";
import { fileURLToPath } from "node:url";

import type { ReferenceManifest } from "../io/ReferenceManifest.ts";
import { readInput } from "../io/readInput.ts";
import { readManifest } from "../io/readManifest.ts";
import { writeArtifact } from "../io/writeArtifact.ts";
import type { FaceChart } from "./FaceChart.ts";
import { buildFaceChart } from "./buildFaceChart.ts";

/**
 * Writes an immutable face-chart observation from declared section inputs.
 *
 * The manifest supplies sections, headObservations and the explicitly observed
 * auxiliary-eyeball mean height metadata.eyeMeanY. That source-specific value
 * is not inferred from a clinical landmark or a corneal apex.
 *
 * @evidence contracts/common.md#principled-implementation Hash-verified manifests bind saved section and head observations; registered physical metadata supplies coverage before the shared chart producer runs.
 * @evidence contracts/common.md#clear-and-simple-design The CLI only admits declared inputs, invokes the chart operation and publishes one immutable artifact.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Source paths and reference identifiers are caller inputs; the consumer neither loads original mesh topology nor substitutes an existing surface.
 * @evidence contracts/common.md#meaningful-documentation Documents required input names, the auxiliary-eye metadata protocol and its distinction from corneal or clinical landmarks.
 * @evidence contracts/performance.md#efficient-algorithms Input hashing and JSON parsing are linear in declared input bytes, followed by the producer's linear observation traversal and one output serialization.
 * @evidence contracts/performance.md#reuse-equivalent-work Immutable publication reuses an existing byte-identical artifact and rejects different bytes instead of replacing a previous result.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Parsed inputs and the chart live for this synchronous CLI call; file reads complete synchronously and writeArtifact owns temporary-file cleanup.
 */
export function run(args: string[]): void {
  const option: (name: string) => string = (name: string): string => {
    const index: number = args.indexOf(name);
    if (index < 0 || !args[index + 1] || args[index + 1].startsWith("--"))
      throw new Error(`Required option: ${name}`);
    return path.resolve(args[index + 1]);
  };
  const manifest: ReferenceManifest = readManifest(option("--manifest"));
  if (manifest.pose !== "native-A")
    throw new Error("Face charts require a native-A manifest.");
  const sections: Pick<
    Parameters<typeof buildFaceChart>[0],
    "gate" | "units" | "frame" | "pose" | "sources" | "slices"
  > = readInput(manifest, "sections");
  const observations: {
    gate: string;
    units: string;
    frame: string;
    landmarks: { id: string; p: [number, number, number] }[];
  } = readInput(manifest, "headObservations");
  if (
    sections.gate !== manifest.gate ||
    observations.gate !== manifest.gate ||
    sections.frame !== manifest.frame ||
    observations.frame !== manifest.frame ||
    sections.units !== "mm" ||
    observations.units !== "mm"
  )
    throw new Error(
      "Reference observation registration differs from its manifest.",
    );
  const menton: { id: string; p: [number, number, number] } | undefined =
    observations.landmarks.find(
      (landmark: { id: string; p: [number, number, number] }): boolean =>
        landmark.id === "head.lm.menton",
    );
  const eyeMeanY: unknown = manifest.metadata?.eyeMeanY;
  if (!menton || typeof eyeMeanY !== "number" || !Number.isFinite(eyeMeanY))
    throw new Error(
      "The manifest requires an observed auxiliary-eyeball mean height and geometric menton.",
    );
  const sources: FaceChart["sources"] = sections.sources.concat(
    ["sections", "headObservations"].map(
      (id: string): FaceChart["sources"][number] => ({
        file: manifest.files[id].path,
        sha256: manifest.files[id].sha256,
        pose: manifest.pose,
      }),
    ),
  );
  const chart: FaceChart = buildFaceChart({
    ...sections,
    sources,
    eyeMeanY,
    mentonY: menton.p[1],
  });
  const artifact: ReturnType<typeof writeArtifact> = writeArtifact(
    option("--output"),
    "face-chart.json",
    chart,
  );
  console.log(
    JSON.stringify({
      ...artifact,
      gate: manifest.gate,
      rows: chart.rows.length,
      foldedRows: chart.rows.filter(
        (row: FaceChart["rows"][number]): boolean => !row.regularInX,
      ).length,
      coverage: chart.coverage,
    }),
  );
}

if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
)
  run(process.argv.slice(2));
