/**
 * Register native displacement incidence on an immutable existing face:
 * ttsx -P tsconfig.human-source.json --no-plugins scripts/human-source/register-source-lid-displacement.ts FACE_GZIP OUTPUT_DIRECTORY
 *
 * This normal metadata stage preserves every existing geometry and chart
 * value. It does not fix a previously baked neutral or publish a generation;
 * the normal authored-skin producer separately regenerates that root pair.
 */
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";

import type { IAutoMovieHumanFaceBasis } from "@automovie/human/face/structures/IAutoMovieHumanFaceBasis";

import { compileHumanSourceLidDisplacementPatch } from "./compileHumanSourceLidDisplacementPatch.ts";
import { readHumanSourceProducerClosure } from "./readHumanSourceProducerClosure.ts";
import { publishHumanSourceFiles } from "./publishHumanSourceFiles.ts";

const [inputFile, outputDirectory] = process.argv.slice(2);
if (inputFile === undefined || outputDirectory === undefined) throw new Error("Usage: register-source-lid-displacement.ts FACE_GZIP OUTPUT_DIRECTORY");
if (fs.existsSync(outputDirectory)) throw new Error("Lid displacement registration needs a new output directory.");
const producer = readHumanSourceProducerClosure(path.resolve(__dirname, "../../.."), "test/scripts/human-source/register-source-lid-displacement.ts");
const inputBytes = fs.readFileSync(inputFile);
const basis = JSON.parse(zlib.gunzipSync(inputBytes).toString("utf8")) as IAutoMovieHumanFaceBasis;
const sha = (bytes: Buffer): string => crypto.createHash("sha256").update(bytes).digest("hex");
if (basis.periocular === undefined) throw new Error("Lid displacement registration needs both actual source cages.");
for (const side of ["left", "right"] as const) {
  const cage = basis.periocular[side].cage;
  if (cage === undefined) throw new Error("Lid displacement registration has an absent eye cage.");
  const host = basis.surfaces.find((surface) => surface.id === cage.surface);
  if (host?.sourcePartition?.generation !== cage.generation) throw new Error("Lid displacement registration needs matching actual host source identity.");
  const posterior = cage.stations.find((station) => station.role === "posteriorMargin");
  const preseptal = cage.stations.find((station) => station.role === "preseptal");
  if (posterior === undefined || preseptal === undefined) throw new Error("Lid displacement registration has no authored boundary rows.");
  cage.displacementPatch = compileHumanSourceLidDisplacementPatch({ generation: cage.generation, surface: cage.surface,
    indices: host.indices, samples: host.sourcePartition.samples, posteriorStations: posterior.vertices, preseptalStations: preseptal.vertices,
    interiorStations: cage.stations.filter((station) => ["anteriorMargin", "pretarsal", "crease", "hood"].includes(station.role)).flatMap((station) => station.vertices) });
}
if (sha(fs.readFileSync(inputFile)) !== sha(inputBytes)) throw new Error("Lid displacement input changed during registration.");
producer.verifyUnchanged();
const output = zlib.gzipSync(JSON.stringify(basis) + "\n", { level: 9 });
const receipt = { inputSha256: sha(inputBytes), outputSha256: sha(output), producerInputs: producer.inputs,
  left: basis.periocular.left.cage!.displacementPatch, right: basis.periocular.right.cage!.displacementPatch,
  qualification: "Actual source-incidence displacement metadata only; original neutral, weights, endpoints, charts and root generation unchanged. Source sparse-bake correction and whole model admission remain separate." };
publishHumanSourceFiles({ directory: outputDirectory, generation: basis.periocular.generation,
  completeGeneration: false, inspectionOnly: true,
  files: new Map<string, string | Uint8Array>([["basis.json.gz", output],
    ["lid-displacement-receipt.json", JSON.stringify(receipt, null, 1) + "\n"]]),
  verifyInputs: () => {
    if (sha(fs.readFileSync(inputFile)) !== receipt.inputSha256) throw new Error("Lid displacement input changed during publication.");
    producer.verifyUnchanged();
  } });
console.log("[human-source] native lid displacement registration", JSON.stringify(receipt));
