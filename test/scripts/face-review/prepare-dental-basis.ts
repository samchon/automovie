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
import fs from "node:fs";

import { parseFaceBasisRevisionArguments } from "./parseFaceBasisRevisionArguments";
import { prepareDentalPosition } from "./prepareDentalPosition";
import { readFaceBasisStudy } from "./readFaceBasisStudy";
import { writeFaceBasisRevision } from "./writeFaceBasisRevision";

const { studyDirectory, revision, output } = parseFaceBasisRevisionArguments(
  process.argv.slice(2),
  fs.existsSync,
);
const { basis, subjects, controls } = readFaceBasisStudy(fs, studyDirectory);
const RESTING_INCISAL_DISPLAY_METRES = (0.00191 + 0.0034) / 2;
const NORMAL_OVERBITE_LIMIT_METRES = 0.0025 + 0.002;
const prepared = prepareDentalPosition({
  basis: basis.json,
  documents: subjects.json,
  controls: controls.json,
  displayMetres: RESTING_INCISAL_DISPLAY_METRES,
  maxOverbiteMetres: NORMAL_OVERBITE_LIMIT_METRES,
  revision,
});
const { receipt } = writeFaceBasisRevision({
  io: fs,
  output,
  receiptFile: "dental-receipt.json",
  prepared,
  inputs: { basis, subjects, controls },
  fields: {
    citations: {
      display:
        "Vig RG, Brundo GC. The kinetics of anterior tooth display. J Prosthet Dent 1978;39(5):502-4: maxillary incisor display at rest 1.91 mm (men), 3.40 mm (women).",
      displayReplication:
        "Misch 2011, 104 adults aged 30 to 59: 2.5 mm (men), 3.8 mm (women); as reported by the Oral Health Group clinical guideline for the vertical position of the maxillary incisal edge.",
      occlusion:
        "Ricketts RM, A foundation for cephalometric communication, Am J Orthod 1960;46:330-57, as tabulated by PMC10198690 (J Clin Exp Dent 2023) Table 1: normal overbite 2.5 +- 2 mm, normal overjet 2.5 +- 2.5 mm. Lowering the maxillary arch alone deepens the overbite by the shift and leaves the overjet.",
    },
  },
  recorded: new Date(),
});
console.log(JSON.stringify(receipt, null, 2));
