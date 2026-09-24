/**
 * Prepare the lip seal revision of the published face basis, from the test
 * CWD:
 *
 *   ttsx -P tsconfig.scripts.json --no-plugins scripts/face-review/prepare-lip-seal-basis.ts STUDY REVISION OUTPUT
 *
 * The unit is the smile pair and the depressor the source's own
 * `mouthLowerDown` pair; the seam is the contact's vermilion seam vertices.
 * For scale, a posed smile moves the lips apart rather than together: the
 * upper lip's lower edge rises 4.76 +- 2.69 mm and the lower lip's upper
 * edge falls 3.28 +- 2.02 mm (Banditsaowapak and Cheng 2025), so a sealed
 * closed-lip smile unit is the least a smile can do to the seam, not a fit
 * to it.
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
  unit: "mouthSmile",
  depressor: "mouthLowerDown",
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
