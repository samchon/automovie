/**
 * Prepare the brow binding revision of the published face basis, from the
 * test CWD:
 *
 *   ttsx -P tsconfig.scripts.json --no-plugins scripts/face-review/prepare-brow-binding-basis.ts STUDY REVISION OUTPUT
 *
 * STUDY is the published global-face study directory; OUTPUT a new
 * directory receiving the basis with the brow card's rows rebound to the
 * skin under it, the restamped subjects and controls, and
 * brow-binding-receipt.json.
 */
import fs from "node:fs";

import { parseFaceBasisRevisionArguments } from "./parseFaceBasisRevisionArguments";
import { prepareBrowBindingBasis } from "./prepareBrowBindingBasis";
import { readFaceBasisStudy } from "./readFaceBasisStudy";
import { writeFaceBasisRevision } from "./writeFaceBasisRevision";

const { studyDirectory, revision, output } = parseFaceBasisRevisionArguments(
  process.argv.slice(2),
  fs.existsSync,
);
const { basis, subjects, controls } = readFaceBasisStudy(fs, studyDirectory);
const prepared = prepareBrowBindingBasis({
  basis: basis.json,
  documents: subjects.json,
  controls: controls.json,
  revision,
  skin: "Human",
  card: "Human.eyebrow001",
});
writeFaceBasisRevision({
  io: fs,
  output,
  receiptFile: "brow-binding-receipt.json",
  prepared,
  inputs: { basis, subjects, controls },
  fields: {
    rule: "Each brow-card vertex attaches to the front-most skin triangle at its own x and y; every skin target is written to the card as the barycentric blend of that triangle's rows, as MPFB's proxy fitting binds a card to the body.",
  },
  recorded: new Date(),
});
console.log(JSON.stringify(prepared.receipt, null, 2));
