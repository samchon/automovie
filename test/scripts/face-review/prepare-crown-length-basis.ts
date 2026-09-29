/**
 * Prepare the crown-length revision of the published face basis, from the
 * test CWD:
 *
 *   ttsx -P tsconfig.scripts.json --no-plugins scripts/face-review/prepare-crown-length-basis.ts STUDY REVISION OUTPUT
 *
 * The norms are unworn maxillary central incisors 11.69 mm, canines 10.83 mm
 * and first premolars 9.33 mm, incisal edge or buccal cusp to CEJ, of 146
 * extracted maxillary teeth (Magne, Gallucci and Belser, J Prosthet Dent
 * 2003;89:453-61); the lateral incisors take 9.34 mm, the lower end of the
 * paper's 9.34 to 9.55 mm for worn and unworn laterals (the text does not
 * say which is which; its length table is an image).
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

import { prepareCrownLengthBasis } from "./prepareCrownLengthBasis";

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
const prepared = prepareCrownLengthBasis({
  basis: basis.json as IAutoMovieHumanFaceBasis,
  documents: subjects.json as IAutoMovieHumanFaceBasisDocument[],
  controls: controls.json as IAutoMovieHumanFaceControlMap,
  revision,
  norms: [0.01169, 0.00934, 0.01083, 0.00933],
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
    norms:
      "Magne P, Gallucci GO, Belser UC. Anatomic crown width/length ratios of unworn and worn maxillary teeth in white subjects. J Prosthet Dent 2003;89:453-61: 146 extracted maxillary teeth (44 central incisors, 41 lateral incisors, 38 canines, 23 first premolars); longest incisocervical length to the CEJ, unworn central incisors 11.69 mm, unworn canines 10.83 mm, lateral incisors 9.34 to 9.55 mm, first premolars (all unworn) 9.33 mm.",
  },
  inputs: {
    basis: { sha256: digest(basis.bytes), bytes: basis.bytes.length },
    subjects: { sha256: digest(subjects.bytes), bytes: subjects.bytes.length },
    controls: { sha256: digest(controls.bytes), bytes: controls.bytes.length },
  },
  outputs: { basis: { sha256: digest(basisBytes), bytes: basisBytes.length } },
};
fs.writeFileSync(
  path.join(output, "crown-length-receipt.json"),
  JSON.stringify(receipt, null, 2) + "\n",
);
console.log(JSON.stringify(prepared.receipt, null, 2));
