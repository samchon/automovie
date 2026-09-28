/**
 * Prepare the resting-brow revision of the published face basis, from the
 * test CWD:
 *
 *   ttsx -P tsconfig.scripts.json --no-plugins scripts/face-review/prepare-brow-rest-basis.ts STUDY REVISION OUTPUT
 *
 * STUDY is the published global-face study directory (basis.json.gz,
 * subjects.json, simple-controls.json); OUTPUT a new directory receiving the
 * raised basis, restamped subjects and controls, and brow-rest-receipt.json.
 * The target is the mean of Cole, Winn and Putterman's (2010) resting brow
 * heights, 19.4 mm (men) and 19.7 mm (women); the horizontal visible iris
 * diameter that places the inferior limbus is 11.7 mm; the brow's first hair
 * row is read within 2 mm of the corneal centre's vertical; only the brow card
 * moves, sliding up the skin it lies on.
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

import { prepareBrowRestBasis } from "./prepareBrowRestBasis";

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
const prepared = prepareBrowRestBasis({
  basis: basis.json as IAutoMovieHumanFaceBasis,
  documents: subjects.json as IAutoMovieHumanFaceBasisDocument[],
  controls: controls.json as IAutoMovieHumanFaceControlMap,
  revision,
  targetMetres: (0.0194 + 0.0197) / 2,
  skin: "Human",
  eyes: "Human.low-poly",
  brows: "Human.eyebrow001",
  limbus: 0.0117 / 2,
  band: 0.002,
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
    target:
      "Cole EA, Winn BJ, Putterman AM. Measurement of eyebrow position from inferior corneal limbus to brow: a new technique. Ophthalmic Plast Reconstr Surg 2010;26(6):443-447 (PMID 20724865): central inferior corneal limbus to the first row of mature brow hairs, primary gaze, 213 subjects; mean 19.4 mm (men), 19.7 mm (women).",
    limbus: "Horizontal visible iris diameter 11.7 mm, the basis's iris rule.",
    seat: "The brow overlies the supraorbital rim; on the source the card sat on the upper lid sulcus, 7 to 9 mm above the pupil, below the skin's brow prominence at 16 to 18 mm.",
  },
  inputs: {
    basis: { sha256: digest(basis.bytes), bytes: basis.bytes.length },
    subjects: { sha256: digest(subjects.bytes), bytes: subjects.bytes.length },
    controls: { sha256: digest(controls.bytes), bytes: controls.bytes.length },
  },
  outputs: { basis: { sha256: digest(basisBytes), bytes: basisBytes.length } },
};
fs.writeFileSync(
  path.join(output, "brow-rest-receipt.json"),
  JSON.stringify(receipt, null, 2) + "\n",
);
console.log(JSON.stringify(prepared.receipt, null, 2));
