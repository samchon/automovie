/**
 * Register native displacement and anterior courses on an immutable face:
 * ttsx -P tsconfig.human-source.json scripts/human-source/register-source-lid-displacement.ts FACE_GZIP OUTPUT_DIRECTORY
 *
 * This normal metadata stage preserves every existing geometry and chart
 * value. Input, producer and output hashes identify this metadata derivative;
 * it does not regenerate or correct the physical root. The actual model and
 * rendered acceptance remain separate from this registration.
 */
import type { IAutoMovieHumanFaceBasis } from "@automovie/human/face/structures/IAutoMovieHumanFaceBasis";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";

import { publishHumanSourceFiles } from "./publishHumanSourceFiles.ts";
import { readHumanSourceProducerClosure } from "./readHumanSourceProducerClosure.ts";
import { registerHumanSourcePeriocularBoundaryCourses } from "./registerHumanSourcePeriocularBoundaryCourses.ts";

const [inputFile, outputDirectory] = process.argv.slice(2);
if (inputFile === undefined || outputDirectory === undefined)
  throw new Error(
    "Usage: register-source-lid-displacement.ts FACE_GZIP OUTPUT_DIRECTORY",
  );
if (fs.existsSync(outputDirectory))
  throw new Error(
    "Lid displacement registration needs a new output directory.",
  );
const producer = readHumanSourceProducerClosure(
  path.resolve(__dirname, "../../.."),
  "test/scripts/human-source/register-source-lid-displacement.ts",
);
const inputBytes = fs.readFileSync(inputFile);
const basis = JSON.parse(
  zlib.gunzipSync(inputBytes).toString("utf8"),
) as IAutoMovieHumanFaceBasis;
const sha = (bytes: Buffer): string =>
  crypto.createHash("sha256").update(bytes).digest("hex");
if (basis.periocular === undefined ||
    basis.periocular.left.cage === undefined || basis.periocular.right.cage === undefined)
  throw new Error(
    "Lid displacement registration needs both actual source cages.",
  );
const preserve = (): string => JSON.stringify({
  ...basis,
  periocular: {
    ...basis.periocular,
    ...Object.fromEntries((["left", "right"] as const).map((side) => {
      const source = basis.periocular![side];
      return [side, {
        ...source,
        cage: source.cage === undefined ? undefined : {
          ...source.cage,
          displacementPatch: undefined,
          stations: source.cage.stations.map((station) => station.role === "anteriorMargin"
            ? { ...station, boundary: undefined } : station),
        },
      }];
    })),
  },
});
const original = preserve();
const courses = registerHumanSourcePeriocularBoundaryCourses(basis);
if (original !== preserve())
  throw new Error("Native lid metadata changed geometry, targets, anchors, charts or extent values.");
if (sha(fs.readFileSync(inputFile)) !== sha(inputBytes))
  throw new Error("Lid displacement input changed during registration.");
producer.verifyUnchanged();
const output = zlib.gzipSync(JSON.stringify(basis) + "\n", { level: 9 });
const receipt = {
  inputSha256: sha(inputBytes),
  outputSha256: sha(output),
  producerInputs: producer.inputs,
  preservedSourceContentSha256: sha(Buffer.from(original)),
  courses,
  boundaries: Object.fromEntries((["left", "right"] as const).map((side) => [
    side,
    basis.periocular![side].cage!.stations.find((station) => station.role === "anteriorMargin")!.boundary,
  ])),
  left: basis.periocular.left.cage!.displacementPatch,
  right: basis.periocular.right.cage!.displacementPatch,
  qualification:
    "Actual source-incidence displacement and authored anterior native-course metadata only; original neutral, weights, endpoints, anchors, charts, posterior-origin extents and physical root generation unchanged. The recipe/input/output hashes identify this metadata derivative. Clinical boundaries and whole-model/rendered acceptance remain separate.",
};
publishHumanSourceFiles({
  directory: outputDirectory,
  generation: basis.periocular.generation,
  completeGeneration: false,
  inspectionOnly: true,
  files: new Map<string, string | Uint8Array>([
    ["basis.json.gz", output],
    ["lid-displacement-receipt.json", JSON.stringify(receipt, null, 1) + "\n"],
  ]),
  verifyInputs: () => {
    if (sha(fs.readFileSync(inputFile)) !== receipt.inputSha256)
      throw new Error("Lid displacement input changed during publication.");
    producer.verifyUnchanged();
  },
});
console.log(
  "[human-source] native lid displacement registration",
  JSON.stringify({ inputSha256: receipt.inputSha256, outputSha256: receipt.outputSha256, courses }),
);
