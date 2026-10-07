/**
 * Compile material attachment registrations from an existing source face:
 * ttsx -P tsconfig.human-source.json --no-plugins scripts/human-source/compile-source-attachment-charts.ts FACE_GZIP NUMERICAL_DOCUMENT OUTPUT_DIRECTORY
 *
 * The input source is immutable. This normal asset-preparation stage emits
 * the exact source face plus its material charts and a byte receipt, not a
 * document, test fixture or admitted human model. Root geometry and its source
 * generation stay unchanged; receipt identity distinguishes this metadata
 * candidate until the complete source producer publishes its coherent pair.
 */
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";

import type { IAutoMovieHumanFaceBasis } from "@automovie/human/face/structures/IAutoMovieHumanFaceBasis";
import type { IAutoMovieHumanFaceBasisDocument } from "@automovie/human/face/structures/IAutoMovieHumanFaceBasisDocument";
import type { IAutoMovieHumanPersonHeadView } from "@automovie/human/human/structures/IAutoMovieHumanPersonHeadView";
import { humanFaceBasisWeights } from "@automovie/human/face/basis/humanFaceBasisWeights";
import { prepareHumanFaceReference } from "@automovie/human/face/basis/prepareHumanFaceReference";

import { extendHumanSourcePeriocularAttachmentCharts } from "./extendHumanSourcePeriocularAttachmentCharts.ts";
import { readHumanSourceProducerClosure } from "./readHumanSourceProducerClosure.ts";
import type { IHumanSourceAttachmentCoverage } from "./structures/IHumanSourceAttachmentCoverage.ts";
import { publishHumanSourceFiles } from "./publishHumanSourceFiles.ts";
import { compileHumanSourceMaterialPatch } from "./compileHumanSourceMaterialPatch.ts";

const [inputFile, documentFile, outputDirectory] = process.argv.slice(2);
if (inputFile === undefined || documentFile === undefined || outputDirectory === undefined)
  throw new Error("Usage: compile-source-attachment-charts.ts FACE_GZIP NUMERICAL_DOCUMENT OUTPUT_DIRECTORY");
const outputFile = path.resolve(outputDirectory, "basis.json.gz"), receiptFile = path.resolve(outputDirectory, "attachment-chart-receipt.json");
if (fs.existsSync(outputFile) || fs.existsSync(receiptFile)) throw new Error("Attachment chart output already exists.");
const inputBytes = fs.readFileSync(inputFile);
const documentBytes = fs.readFileSync(documentFile);
const repository = path.resolve(__dirname, "../../..");
const producer = readHumanSourceProducerClosure(repository, "test/scripts/human-source/compile-source-attachment-charts.ts");
const source = JSON.parse(zlib.gunzipSync(inputBytes).toString("utf8")) as IAutoMovieHumanFaceBasis | IAutoMovieHumanPersonHeadView;
// A finished host view owns the same face metadata; only the extracted face
// representation is parameterized here, and the normal lossless projector
// subsequently returns those registrations to its immutable host.
const basis = "face" in source ? source.face : source;
const document = JSON.parse(documentBytes.toString("utf8")) as IAutoMovieHumanFaceBasisDocument;
const sha = (value: Buffer): string => crypto.createHash("sha256").update(value).digest("hex");
const counts: Record<string, number> = {};
const coverage: Record<string, IHumanSourceAttachmentCoverage[]> = {};
// Native material clipping consumes immutable host geometry, not the full
// numerical reference. Discover its source-domain refusal before expensive
// independent relief preparation; successful publication still requires all.
for (const side of ["left", "right"] as const) {
  const cage = basis.periocular?.[side]?.cage;
  if (cage === undefined) continue;
  const host = basis.surfaces.find((surface) => surface.id === cage.surface);
  if (host?.sourcePartition === undefined || host.sourcePartition.generation !== cage.generation)
    throw new Error("Attachment chart requires same-generation actual host samples.");
  const bed = cage.medialBed;
  const margin = cage.stations.find((station) => station.role === "posteriorMargin");
  if (bed !== undefined && margin !== undefined) {
    const upper = cage.upperColumns.slice(0, bed.upperColumns).map((column) => margin.vertices[column]);
    const lower = cage.lowerColumns.slice(0, bed.lowerColumns).map((column) => margin.vertices[column]);
    const loop = [...upper, ...lower.slice(1).reverse()];
    bed.materialPatch = compileHumanSourceMaterialPatch(host.positions, host.indices, loop,
      loop[0], upper[upper.length - 1], lower[lower.length - 1], cage.generation, cage.surface);
    counts[`${side}:medial:points`] = bed.materialPatch.points.length;
    counts[`${side}:medial:triangles`] = bed.materialPatch.indices.length / 3;
    counts[`${side}:medial:plicaPoints`] = bed.materialPatch.plica.length;
  }
}
console.log("[human-source] native medial patches complete", JSON.stringify(counts));
console.log("[human-source] numerical reference preparation begins");
const prepared = prepareHumanFaceReference({ basis, state: humanFaceBasisWeights(basis, document), geometry: document });
const reference = prepared.complete();
if (reference === undefined || prepared.optics === undefined) throw new Error("Source continuation requires the actual numerical document's prepared reference and independent optics.");
console.log("[human-source] numerical reference preparation complete");
for (const side of ["left", "right"] as const) {
  const cage = basis.periocular?.[side]?.cage;
  if (cage === undefined) continue;
  const host = basis.surfaces.find((surface) => surface.id === cage.surface);
  if (host?.sourcePartition === undefined || host.sourcePartition.generation !== cage.generation)
    throw new Error("Attachment chart requires same-generation actual host samples.");
  const exterior = prepared.optics.find((eye) => eye.side === side)?.exterior.rest, positions = reference.get(cage.surface);
  if (exterior === undefined || positions === undefined) throw new Error("Source support lacks its actual reference exterior or skin.");
  const expanded = extendHumanSourcePeriocularAttachmentCharts({ host, cage, reference: positions, exterior });
  cage.attachmentCharts = expanded.charts;
  coverage[side] = expanded.coverage;
  counts[`${side}:outerDualDepth`] = expanded.outerDualDepth;
  for (const lid of ["upper", "lower"] as const) {
    const chart = cage.attachmentCharts[lid];
    counts[`${side}:${lid}:vertices`] = chart.vertices.length;
    counts[`${side}:${lid}:triangles`] = chart.sourceTriangles.length;
  }
}
if (Object.keys(counts).length === 0) throw new Error("Source face has no material attachment cage.");
if (sha(fs.readFileSync(inputFile)) !== sha(inputBytes)) throw new Error("Attachment source changed during compilation.");
if (sha(fs.readFileSync(documentFile)) !== sha(documentBytes)) throw new Error("Attachment numerical context changed during compilation.");
producer.verifyUnchanged();
const outputBytes = zlib.gzipSync(JSON.stringify(basis) + "\n", { level: 9 });
const receipt = { inputSha256: sha(inputBytes), numericalDocumentSha256: sha(documentBytes), outputSha256: sha(outputBytes), sourceFace: basis.id, counts, coverage, producerInputs: producer.inputs,
  referenceConvention: "Explicit existing numerical source-neutral preparation context. Optical dimensions and persistent skin relief are authored inputs, not a fitted person or clinical defaults. Coverage is observed on that unchanged document; runtime rereads its own current metric and retains unsupported-state refusals.",
  method: "uniform-barycentric-convex-disk", qualification: "Unchanged source geometry/weights with actual root incidence and canonical samples; dimensionless material coordinates plus native triangle meridian support measured by the normal consumer's exact prepared reference and exterior. No texture UV merge or anatomical measurement. Metadata candidate is not a new full source generation or admitted model." };
publishHumanSourceFiles({ directory: outputDirectory,
  generation: basis.periocular!.generation, completeGeneration: false, inspectionOnly: true,
  files: new Map<string, string | Uint8Array>([[path.basename(outputFile), outputBytes],
    [path.basename(receiptFile), JSON.stringify(receipt, null, 1) + "\n"]]),
  verifyInputs: () => {
    if (sha(fs.readFileSync(inputFile)) !== receipt.inputSha256 || sha(fs.readFileSync(documentFile)) !== receipt.numericalDocumentSha256)
      throw new Error("Attachment chart input changed during publication.");
    producer.verifyUnchanged();
  } });
console.log("[human-source] attachment charts", JSON.stringify(receipt));
