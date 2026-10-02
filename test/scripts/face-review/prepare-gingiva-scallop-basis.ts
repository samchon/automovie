/**
 * Prepare the scalloped-gingiva revision of the published face basis, from
 * the test CWD:
 *
 *   ttsx -P tsconfig.scripts.json --no-plugins scripts/face-review/prepare-gingiva-scallop-basis.ts STUDY REVISION OUTPUT
 *
 * The norms are the gingiva revision's: maxillary central, lateral and
 * canine clinical crown heights, gingival zenith to incisal edge, on casts
 * of 384 young adults, 9.35, 7.75 and 8.68 mm (Melo M, Ata-Ali F, Huertas J,
 * et al. Sci Rep 2019;9:730); the front raster's pixel is 0.05 mm.
 */
import fs from "node:fs";

import { parseFaceBasisRevisionArguments } from "./parseFaceBasisRevisionArguments";
import { prepareGingivaScallopBasis } from "./prepareGingivaScallopBasis";
import { readFaceBasisStudy } from "./readFaceBasisStudy";
import { writeFaceBasisRevision } from "./writeFaceBasisRevision";

const { studyDirectory, revision, output } = parseFaceBasisRevisionArguments(
  process.argv.slice(2),
  fs.existsSync,
);
const { basis, subjects, controls } = readFaceBasisStudy(fs, studyDirectory);
const prepared = prepareGingivaScallopBasis({
  basis: basis.json,
  documents: subjects.json,
  controls: controls.json,
  revision,
  norms: [0.00935, 0.00775, 0.00868],
  resolution: 0.00005,
});
writeFaceBasisRevision({
  io: fs,
  output,
  receiptFile: "gingiva-scallop-receipt.json",
  prepared,
  inputs: { basis, subjects, controls },
  fields: {
    citations: {
      norms:
        "Melo M, Ata-Ali F, Huertas J, Cobo T, Shibli JA, Galindo-Moreno P, Ata-Ali J, et al. Revisiting the maxillary teeth in 384 subjects reveals a deviation from the classical aesthetic dimensions. Sci Rep 2019;9:730, doi:10.1038/s41598-018-36770-w: clinical crown height from the gingival zenith to the incisal margin, central 9.35, lateral 7.75, canine 8.68 mm.",
    },
  },
  recorded: new Date(),
});
console.log(JSON.stringify(prepared.receipt, null, 2));
