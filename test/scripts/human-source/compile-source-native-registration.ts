/**
 * Compile actual source-native material registrations, from the test CWD:
 * ttsx -P tsconfig.human-source.json --no-plugins scripts/human-source/compile-source-native-registration.ts FACE_OR_HEAD_GZIP OUTPUT_DIRECTORY
 *
 * This component stage publishes geometry-preserving metadata before numerical
 * reference preparation. Its authority cannot admit a complete generation or
 * claim runtime reference, tissue, model, GLB or GPU acceptance. The expensive
 * full attachment stage and complete source producer retain every later gate.
 */
import type { IAutoMovieHumanFaceBasis } from "@automovie/human/face/structures/IAutoMovieHumanFaceBasis";
import type { IAutoMovieHumanPersonHeadView } from "@automovie/human/human/structures/IAutoMovieHumanPersonHeadView";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";

import { compileHumanSourceNativeRegistration } from "./compileHumanSourceNativeRegistration.ts";
import { publishHumanSourceFiles } from "./publishHumanSourceFiles.ts";
import { readHumanSourceProducerClosure } from "./readHumanSourceProducerClosure.ts";

const [inputFile, outputDirectory] = process.argv.slice(2);
if (inputFile === undefined || outputDirectory === undefined)
  throw new Error("Usage: compile-source-native-registration.ts FACE_OR_HEAD_GZIP OUTPUT_DIRECTORY");
const inputBytes = fs.readFileSync(inputFile);
const producer = readHumanSourceProducerClosure(
  path.resolve(__dirname, "../../.."),
  "test/scripts/human-source/compile-source-native-registration.ts",
);
const input = JSON.parse(zlib.gunzipSync(inputBytes).toString("utf8")) as
  IAutoMovieHumanFaceBasis | IAutoMovieHumanPersonHeadView;
const basis = "face" in input ? input.face : input;
const sha = (bytes: Uint8Array | string): string =>
  crypto.createHash("sha256").update(bytes).digest("hex");
const preserved = (face: IAutoMovieHumanFaceBasis): string => JSON.stringify({
  ...face,
  surfaces: face.surfaces.map((surface) => ({ ...surface, materialCharts: undefined })),
  periocular: face.periocular === undefined ? undefined : {
    ...face.periocular,
    ...Object.fromEntries((["left", "right"] as const).map((side) => [side, {
      ...face.periocular![side],
      cage: face.periocular![side].cage === undefined ? undefined : {
        ...face.periocular![side].cage,
        medialBed: face.periocular![side].cage?.medialBed === undefined ? undefined : {
          ...face.periocular![side].cage!.medialBed, materialPatch: undefined,
        },
      },
    }])),
  },
});
const original = preserved(basis);
console.log("[human-source] native material registration begins");
const counts = compileHumanSourceNativeRegistration(basis);
if (preserved(basis) !== original)
  throw new Error("Native registration changed non-registration source content.");
const generations = [...new Set(basis.surfaces.flatMap((surface) =>
  Object.values(surface.materialCharts ?? {}).map((chart) => chart.generation),
))];
if (generations.length !== 1)
  throw new Error("Native registration needs one actual source generation.");
const outputBytes = zlib.gzipSync(JSON.stringify(basis) + "\n", { level: 9 });
const receipt = {
  inputSha256: sha(inputBytes), outputSha256: sha(outputBytes),
  preservedSourceContentSha256: sha(original), sourceFace: basis.id,
  generation: generations[0], counts, producerInputs: producer.inputs,
  stage: "source-native-material-registration",
  sourceRegistrations: (["left", "right"] as const).flatMap((side) => {
    const cage = basis.periocular?.[side]?.cage;
    return cage === undefined ? [] : [{
      side, sourceId: cage.sourceId, sourceSha256: cage.sourceSha256,
      generation: cage.generation, frame: cage.frame,
    }];
  }),
  rights: "The supplied source's existing rights remain authoritative; this registration changes no geometry and grants no new rights. Native source identities and original source-byte witnesses are retained beside the exact input SHA and producer closure.",
  qualification: "Source-native registration component only. Geometry, weights, traits, endpoints, station order, materials and other source registrations remain unchanged; materialCharts and medial materialPatch are recompiled from that source. Positive material disks and native medial boundary incidence are compiled; numerical reference, complete generation, tissue, model, GLB and GPU acceptance remain unverified.",
};
const verifyInputs = (): void => {
  if (sha(fs.readFileSync(inputFile)) !== receipt.inputSha256)
    throw new Error("Native registration source changed during production.");
  producer.verifyUnchanged();
};
publishHumanSourceFiles({
  directory: outputDirectory, generation: generations[0],
  completeGeneration: false, inspectionOnly: false,
  files: new Map<string, string | Uint8Array>([
    ["basis.json.gz", outputBytes],
    ["native-registration-receipt.json", JSON.stringify(receipt, null, 1) + "\n"],
  ]), verifyInputs,
});
console.log("[human-source] native material registration complete", JSON.stringify(counts));
