/**
 * Compile material attachment registrations from an existing source face:
 * ttsx -P tsconfig.human-source.json scripts/human-source/compile-source-attachment-charts.ts FACE_GZIP NUMERICAL_DOCUMENT OUTPUT_DIRECTORY
 *
 * The input source is immutable. This normal asset-preparation stage emits
 * the exact source face plus its material charts and a byte receipt, not a
 * document, test fixture or admitted human model. Root geometry and its source
 * generation stay unchanged; receipt identity distinguishes this metadata
 * candidate until the complete source producer publishes its coherent pair.
 */
import type { IAutoMovieHumanFaceBasis } from "@automovie/human/face/structures/IAutoMovieHumanFaceBasis";
import type { IAutoMovieHumanFaceBasisDocument } from "@automovie/human/face/structures/IAutoMovieHumanFaceBasisDocument";
import type { IAutoMovieHumanPersonHeadView } from "@automovie/human/human/structures/IAutoMovieHumanPersonHeadView";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";

import { compileHumanSourceAttachmentRegistration } from "./compileHumanSourceAttachmentRegistration.ts";
import { publishHumanSourceFiles } from "./publishHumanSourceFiles.ts";
import { readHumanSourceProducerClosure } from "./readHumanSourceProducerClosure.ts";

const [inputFile, documentFile, outputDirectory] = process.argv.slice(2);
if (
  inputFile === undefined ||
  documentFile === undefined ||
  outputDirectory === undefined
)
  throw new Error(
    "Usage: compile-source-attachment-charts.ts FACE_GZIP NUMERICAL_DOCUMENT OUTPUT_DIRECTORY",
  );
const outputFile = path.resolve(outputDirectory, "basis.json.gz"),
  receiptFile = path.resolve(outputDirectory, "attachment-chart-receipt.json");
if (fs.existsSync(outputFile) || fs.existsSync(receiptFile))
  throw new Error("Attachment chart output already exists.");
const inputBytes = fs.readFileSync(inputFile);
const documentBytes = fs.readFileSync(documentFile);
const repository = path.resolve(__dirname, "../../..");
const producer = readHumanSourceProducerClosure(
  repository,
  "test/scripts/human-source/compile-source-attachment-charts.ts",
);
const source = JSON.parse(zlib.gunzipSync(inputBytes).toString("utf8")) as
  | IAutoMovieHumanFaceBasis
  | IAutoMovieHumanPersonHeadView;
// A finished host view owns the same face metadata; only the extracted face
// representation is parameterized here, and the normal lossless projector
// subsequently returns those registrations to its immutable host.
const basis = "face" in source ? source.face : source;
const document = JSON.parse(
  documentBytes.toString("utf8"),
) as IAutoMovieHumanFaceBasisDocument;
const sha = (value: Buffer): string =>
  crypto.createHash("sha256").update(value).digest("hex");
const registration = compileHumanSourceAttachmentRegistration({ basis, document });
const { counts, coverage } = registration;
if (sha(fs.readFileSync(inputFile)) !== sha(inputBytes))
  throw new Error("Attachment source changed during compilation.");
if (sha(fs.readFileSync(documentFile)) !== sha(documentBytes))
  throw new Error("Attachment numerical context changed during compilation.");
producer.verifyUnchanged();
const outputBytes = zlib.gzipSync(JSON.stringify(basis) + "\n", { level: 9 });
const receipt = {
  inputSha256: sha(inputBytes),
  numericalDocumentSha256: sha(documentBytes),
  outputSha256: sha(outputBytes),
  sourceFace: basis.id,
  preservedSourceGeometrySha256: registration.preservedSourceGeometrySha256,
  numericalContextSha256: registration.numericalContextSha256,
  facialHair: registration.facialHair,
  counts,
  coverage,
  producerInputs: producer.inputs,
  referenceConvention:
    "Explicit existing numerical source-neutral preparation context. Optical dimensions and persistent skin relief are authored inputs, not a fitted person or clinical defaults. Coverage is observed on that unchanged document; runtime rereads its own current metric and retains unsupported-state refusals.",
  method: "uniform-barycentric-convex-disk",
  qualification:
    "Unchanged source geometry/weights with actual root incidence and canonical samples; dimensionless material coordinates plus native triangle meridian support measured by the normal consumer's exact prepared reference and exterior. No texture UV merge or anatomical measurement. Metadata candidate is not a new full source generation or admitted model.",
};
publishHumanSourceFiles({
  directory: outputDirectory,
  generation: basis.periocular!.generation,
  completeGeneration: false,
  inspectionOnly: true,
  files: new Map<string, string | Uint8Array>([
    [path.basename(outputFile), outputBytes],
    [path.basename(receiptFile), JSON.stringify(receipt, null, 1) + "\n"],
  ]),
  verifyInputs: () => {
    if (
      sha(fs.readFileSync(inputFile)) !== receipt.inputSha256 ||
      sha(fs.readFileSync(documentFile)) !== receipt.numericalDocumentSha256
    )
      throw new Error("Attachment chart input changed during publication.");
    producer.verifyUnchanged();
  },
});
console.log("[human-source] attachment charts", JSON.stringify(receipt));
