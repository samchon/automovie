/**
 * Prepare the gingiva colour revision of the published face basis, from the
 * test CWD:
 *
 *   ttsx -P tsconfig.scripts.json --no-plugins scripts/face-review/prepare-gingiva-colour-basis.ts STUDY REVISION OUTPUT
 *
 * The norm is healthy keratinized gingiva 2-3 mm apical to the mid-facial
 * margin of a maxillary central incisor, L* 52.9, a* 23.3, b* 14.9, in 238
 * adults (Ho DK, Ghinea R, Herrera LJ, Angelov N, Paravina RD. Sci Rep
 * 2015;5:18498); four rings of island padding follow the gum.
 */
import fs from "node:fs";

import { parseFaceBasisRevisionArguments } from "./parseFaceBasisRevisionArguments";
import { prepareGingivaColourBasis } from "./prepareGingivaColourBasis";
import { readFaceBasisStudy } from "./readFaceBasisStudy";
import { writeFaceBasisRevision } from "./writeFaceBasisRevision";

const { studyDirectory, revision, output } = parseFaceBasisRevisionArguments(
  process.argv.slice(2),
  fs.existsSync,
);
const { basis, subjects, controls } = readFaceBasisStudy(fs, studyDirectory);
const prepared = prepareGingivaColourBasis({
  basis: basis.json,
  documents: subjects.json,
  controls: controls.json,
  revision,
  norm: [52.9, 23.3, 14.9],
  band: [0.002, 0.003],
  rings: 4,
});
writeFaceBasisRevision({
  io: fs,
  output,
  receiptFile: "gingiva-colour-receipt.json",
  prepared,
  inputs: { basis, subjects, controls },
  fields: {
    citations: {
      norm: "Ho DK, Ghinea R, Herrera LJ, Angelov N, Paravina RD. Color range and color distribution of healthy human gingiva: a prospective clinical study. Sci Rep 2015;5:18498, doi:10.1038/srep18498: keratinized gingiva 2-3 mm apical to the mid-facial gingival margin of a maxillary central incisor, 238 adults, L* 52.9 (SD 5.2), a* 23.3 (3.4), b* 14.9 (2.0).",
    },
  },
  recorded: new Date(),
});
console.log(JSON.stringify(prepared.receipt, null, 2));
