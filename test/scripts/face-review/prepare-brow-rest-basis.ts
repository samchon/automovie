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
import fs from "node:fs";

import { parseFaceBasisRevisionArguments } from "./parseFaceBasisRevisionArguments";
import { prepareBrowRestBasis } from "./prepareBrowRestBasis";
import { readFaceBasisStudy } from "./readFaceBasisStudy";
import { writeFaceBasisRevision } from "./writeFaceBasisRevision";

const { studyDirectory, revision, output } = parseFaceBasisRevisionArguments(
  process.argv.slice(2),
  fs.existsSync,
);
const { basis, subjects, controls } = readFaceBasisStudy(fs, studyDirectory);
const prepared = prepareBrowRestBasis({
  basis: basis.json,
  documents: subjects.json,
  controls: controls.json,
  revision,
  targetMetres: (0.0194 + 0.0197) / 2,
  skin: "Human",
  eyes: "Human.low-poly",
  brows: "Human.eyebrow001",
  limbus: 0.0117 / 2,
  band: 0.002,
});
writeFaceBasisRevision({
  io: fs,
  output,
  receiptFile: "brow-rest-receipt.json",
  prepared,
  inputs: { basis, subjects, controls },
  fields: {
    citations: {
      target:
        "Cole EA, Winn BJ, Putterman AM. Measurement of eyebrow position from inferior corneal limbus to brow: a new technique. Ophthalmic Plast Reconstr Surg 2010;26(6):443-447 (PMID 20724865): central inferior corneal limbus to the first row of mature brow hairs, primary gaze, 213 subjects; mean 19.4 mm (men), 19.7 mm (women).",
      limbus: "Horizontal visible iris diameter 11.7 mm, the basis's iris rule.",
      seat: "The brow overlies the supraorbital rim; on the source the card sat on the upper lid sulcus, 7 to 9 mm above the pupil, below the skin's brow prominence at 16 to 18 mm.",
    },
  },
  recorded: new Date(),
});
console.log(JSON.stringify(prepared.receipt, null, 2));
