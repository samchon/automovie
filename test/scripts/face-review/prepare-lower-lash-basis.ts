/**
 * Prepare the lower lash revision of the published face basis, from the
 * test CWD:
 *
 *   ttsx -P tsconfig.scripts.json --no-plugins scripts/face-review/prepare-lower-lash-basis.ts STUDY REVISION OUTPUT
 *
 * STUDY is the published global-face study directory; OUTPUT a new
 * directory receiving the basis whose lower lashes carry their own
 * material covering the upper lashes' area times the lower lid's share of
 * the lash count at the lengths the card draws, the restamped subjects and
 * controls, and lower-lash-receipt.json. The count ratio is the middle of
 * each lid's range: 77.5 of 75 to 80 lower lashes over 125 of 90 to 160
 * upper ones (Aumond and Bitton, J Optom 2018;11:211-222).
 */
import fs from "node:fs";

import { parseFaceBasisRevisionArguments } from "./parseFaceBasisRevisionArguments";
import { prepareLowerLashBasis } from "./prepareLowerLashBasis";
import { readFaceBasisStudy } from "./readFaceBasisStudy";
import { writeFaceBasisRevision } from "./writeFaceBasisRevision";

const { studyDirectory, revision, output } = parseFaceBasisRevisionArguments(
  process.argv.slice(2),
  fs.existsSync,
);
const { basis, subjects, controls } = readFaceBasisStudy(fs, studyDirectory);
const prepared = prepareLowerLashBasis({
  basis: basis.json,
  documents: subjects.json,
  controls: controls.json,
  revision,
  lashes: "Human.eyelashes01",
  eyes: "Human.low-poly",
  count: 77.5 / 125,
});
writeFaceBasisRevision({
  io: fs,
  output,
  receiptFile: "lower-lash-receipt.json",
  prepared,
  inputs: { basis, subjects, controls },
  fields: {
    citation:
      "Aumond S, Bitton E. The eyelash follicle features and anomalies: a review. J Optom 2018;11(4):211-222: the lower lid carries 75-80 lashes in three to four rows, the upper 90-160 in five to six.",
  },
  recorded: new Date(),
});
console.log(JSON.stringify(prepared.receipt, null, 2));
