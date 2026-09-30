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
import fs from "node:fs";

import { parseFaceBasisRevisionArguments } from "./parseFaceBasisRevisionArguments";
import { prepareCrownLengthBasis } from "./prepareCrownLengthBasis";
import { readFaceBasisStudy } from "./readFaceBasisStudy";
import { writeFaceBasisRevision } from "./writeFaceBasisRevision";

const { studyDirectory, revision, output } = parseFaceBasisRevisionArguments(
  process.argv.slice(2),
  fs.existsSync,
);
const { basis, subjects, controls } = readFaceBasisStudy(fs, studyDirectory);
const prepared = prepareCrownLengthBasis({
  basis: basis.json,
  documents: subjects.json,
  controls: controls.json,
  revision,
  norms: [0.01169, 0.00934, 0.01083, 0.00933],
});
writeFaceBasisRevision({
  io: fs,
  output,
  receiptFile: "crown-length-receipt.json",
  prepared,
  inputs: { basis, subjects, controls },
  fields: {
    citations: {
      norms:
        "Magne P, Gallucci GO, Belser UC. Anatomic crown width/length ratios of unworn and worn maxillary teeth in white subjects. J Prosthet Dent 2003;89:453-61: 146 extracted maxillary teeth (44 central incisors, 41 lateral incisors, 38 canines, 23 first premolars); longest incisocervical length to the CEJ, unworn central incisors 11.69 mm, unworn canines 10.83 mm, lateral incisors 9.34 to 9.55 mm, first premolars (all unworn) 9.33 mm.",
    },
  },
  recorded: new Date(),
});
console.log(JSON.stringify(prepared.receipt, null, 2));
