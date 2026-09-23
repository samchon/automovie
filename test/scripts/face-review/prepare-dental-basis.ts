/**
 * Prepare the dental-position revision of the published contact face basis,
 * from the test CWD:
 *
 *   ttsx -P tsconfig.scripts.json --no-plugins scripts/face-review/prepare-dental-basis.ts STUDY REVISION OUTPUT
 *
 * STUDY is the published global-face study directory (basis.json.gz,
 * subjects.json, simple-controls.json), REVISION the new basis identity and
 * OUTPUT a new directory that receives basis.json.gz, restamped subjects and
 * controls, and dental-receipt.json.
 *
 * The inputs are two population norms. The resting incisal display, the
 * maxillary central incisor's edge below the upper lip with the lips at
 * rest, is 1.91 mm in men and 3.40 mm in women (Vig & Brundo 1978), 2.5 and
 * 3.8 mm in a later sample (Misch 2011); the basis neutral carries no sex, so
 * it asks for the midpoint of the first, more conservative study, 2.655 mm,
 * and leaves a sex, age or lip-length difference to the lip's own shape
 * channels, which move the lip over a fixed dentition as tissue does over
 * bone. Only the maxillary arch can move, so the overbite deepens with it,
 * and the normal overbite is 2.5 +- 2 mm (Ricketts 1960): the shift stops at
 * 4.5 mm of overbite if that comes first, and the receipt says which did.
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

import { prepareDentalPosition } from "./prepareDentalPosition";

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
const RESTING_INCISAL_DISPLAY_METRES = (0.00191 + 0.0034) / 2;
const NORMAL_OVERBITE_LIMIT_METRES = 0.0025 + 0.002;
const prepared = prepareDentalPosition({
  basis: basis.json as IAutoMovieHumanFaceBasis,
  documents: subjects.json as IAutoMovieHumanFaceBasisDocument[],
  controls: controls.json as IAutoMovieHumanFaceControlMap,
  displayMetres: RESTING_INCISAL_DISPLAY_METRES,
  maxOverbiteMetres: NORMAL_OVERBITE_LIMIT_METRES,
  revision,
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
    display:
      "Vig RG, Brundo GC. The kinetics of anterior tooth display. J Prosthet Dent 1978;39(5):502-4: maxillary incisor display at rest 1.91 mm (men), 3.40 mm (women).",
    displayReplication:
      "Misch 2011, 104 adults aged 30 to 59: 2.5 mm (men), 3.8 mm (women); as reported by the Oral Health Group clinical guideline for the vertical position of the maxillary incisal edge.",
    occlusion:
      "Ricketts RM, A foundation for cephalometric communication, Am J Orthod 1960;46:330-57, as tabulated by PMC10198690 (J Clin Exp Dent 2023) Table 1: normal overbite 2.5 +- 2 mm, normal overjet 2.5 +- 2.5 mm. Lowering the maxillary arch alone deepens the overbite by the shift and leaves the overjet.",
  },
  inputs: {
    basis: { sha256: digest(basis.bytes), bytes: basis.bytes.length },
    subjects: { sha256: digest(subjects.bytes), bytes: subjects.bytes.length },
    controls: { sha256: digest(controls.bytes), bytes: controls.bytes.length },
  },
  outputs: { basis: { sha256: digest(basisBytes), bytes: basisBytes.length } },
};
fs.writeFileSync(
  path.join(output, "dental-receipt.json"),
  JSON.stringify(receipt, null, 2) + "\n",
);
console.log(JSON.stringify(receipt, null, 2));
