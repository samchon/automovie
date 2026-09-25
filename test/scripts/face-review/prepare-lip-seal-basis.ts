/**
 * Prepare the lip seal revision of the published face basis, from the test
 * CWD:
 *
 *   ttsx -P tsconfig.scripts.json --no-plugins scripts/face-review/prepare-lip-seal-basis.ts STUDY REVISION OUTPUT
 *
 * The units are the closed-lip ARKit units whose source endpoints carry the
 * lower lip through the upper one: the smile and press pairs, the pucker,
 * the lower lip roll and the mouth's sideways moves; the depressor is the
 * source's own `mouthLowerDown` pair, each side to its side and both to a
 * midline unit. `mouthShrugLower` also crosses but would need 1.20 of the
 * depressor, outside its envelope: the chin raiser lifts the lower lip into
 * the upper one, which then rises with it, and that is not a seal, so it is
 * left as the source authored it. `mouthFunnel` parts the lips and is not a
 * closed-lip unit. For scale, a posed smile moves the lips apart rather than
 * together (Banditsaowapak and Cheng 2025), so a sealed closed-lip unit is
 * the least it can do to the seam, not a fit to it.
 */
import type {
  IAutoMovieHumanFaceBasis,
  IAutoMovieHumanFaceBasisDocument,
  IAutoMovieHumanFaceControlMap,
} from "@automovie/human";
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { gunzipSync, gzipSync } from "node:zlib";

import { prepareLipSealBasis } from "./prepareLipSealBasis";

const [studyDirectory, revision, output] = process.argv.slice(2);
if (
  studyDirectory === undefined ||
  revision === undefined ||
  output === undefined ||
  fs.existsSync(output)
)
  throw new Error(
    "Supply the study directory, the new revision and a new output directory.",
  );
const read = (name: string): { bytes: Buffer; json: unknown } => {
  const bytes = fs.readFileSync(path.join(studyDirectory, name));
  return {
    bytes,
    json: JSON.parse(
      (name.endsWith(".gz") ? gunzipSync(bytes) : bytes).toString("utf8"),
    ),
  };
};
const basis = read("basis.json.gz");
const subjects = read("subjects.json");
const controls = read("simple-controls.json");
const prepared = prepareLipSealBasis({
  basis: basis.json as IAutoMovieHumanFaceBasis,
  documents: subjects.json as IAutoMovieHumanFaceBasisDocument[],
  controls: controls.json as IAutoMovieHumanFaceControlMap,
  revision,
  units: [
    ...["mouthSmile", "mouthPress"].map((unit) => ({
      channels: [`${unit}Left`, `${unit}Right`],
      depressors: ["mouthLowerDownLeft", "mouthLowerDownRight"],
    })),
    ...["mouthPucker", "mouthRollLower", "mouthLeft", "mouthRight"].map(
      (unit) => ({
        channels: [unit],
        depressors: ["mouthLowerDownLeft", "mouthLowerDownRight"],
      }),
    ),
  ],
  lips: (basis.json as IAutoMovieHumanFaceBasis).contact!.lips,
});
fs.mkdirSync(output, { recursive: true });
const basisBytes = gzipSync(JSON.stringify(prepared.basis) + "\n", {
  level: 9,
});
fs.writeFileSync(path.join(output, "basis.json.gz"), basisBytes);
fs.writeFileSync(
  path.join(output, "subjects.json"),
  JSON.stringify(prepared.documents, null, 2) + "\n",
);
fs.writeFileSync(
  path.join(output, "simple-controls.json"),
  JSON.stringify(prepared.controls, null, 2) + "\n",
);
const digest = (bytes: Buffer): string =>
  createHash("sha256").update(bytes).digest("hex");
const receipt = {
  ...prepared.receipt,
  recorded: new Date().toISOString(),
  citations: {
    posedSmile:
      "Banditsaowapak P, Cheng JHC. Effects of varying anteroposterior craniodentofacial morphologies on three-dimensional smile variables. J Dent Sci 2025;20(4):2219-2230: rest to posed smile in 41 skeletal Class I adults, inferior point of the upper lip +4.76 +- 2.69 mm (up), superior point of the lower lip -3.28 +- 2.02 mm (down), interlabial gap 1.83 to 10.47 mm.",
  },
  inputs: {
    basis: { sha256: digest(basis.bytes), bytes: basis.bytes.length },
    subjects: { sha256: digest(subjects.bytes), bytes: subjects.bytes.length },
    controls: { sha256: digest(controls.bytes), bytes: controls.bytes.length },
  },
  outputs: { basis: { sha256: digest(basisBytes), bytes: basisBytes.length } },
};
fs.writeFileSync(
  path.join(output, "lip-seal-receipt.json"),
  JSON.stringify(receipt, null, 2) + "\n",
);
console.log(JSON.stringify(prepared.receipt, null, 2));
