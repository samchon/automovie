/**
 * Prepare the arch width revision of the published face basis, from the
 * test CWD:
 *
 *   ttsx -P tsconfig.scripts.json --no-plugins scripts/face-review/prepare-arch-width-basis.ts STUDY REVISION OUTPUT
 *
 * The elasticity of the intercanine distance on the intercommissural width
 * is the total sample's regression slope in relative terms: Wang, Li, Yang
 * and Li, Heliyon 2024;10:e27642 (409 Chinese adults, 20 to 59 years,
 * standardized photographs): intercanine distance 39.84 +- 2.08 mm,
 * intercommissural width 49.31 +- 3.63 mm, r = 0.389; the slope r * 2.08 /
 * 3.63 mm per mm, times 49.31 / 39.84 (`prepareArchWidthBasis`).
 */
import fs from "node:fs";

import { parseFaceBasisRevisionArguments } from "./parseFaceBasisRevisionArguments";
import { prepareArchWidthBasis } from "./prepareArchWidthBasis";
import { readFaceBasisStudy } from "./readFaceBasisStudy";
import { writeFaceBasisRevision } from "./writeFaceBasisRevision";

const ARCH = { mean: 39.84, sd: 2.08 };
const MOUTH = { mean: 49.31, sd: 3.63 };
const CORRELATION = 0.389;

const { studyDirectory, revision, output } = parseFaceBasisRevisionArguments(
  process.argv.slice(2),
  fs.existsSync,
);
const { basis, subjects, controls } = readFaceBasisStudy(fs, studyDirectory);
const elasticity =
  ((CORRELATION * ARCH.sd) / MOUTH.sd) * (MOUTH.mean / ARCH.mean);
const prepared = prepareArchWidthBasis({
  basis: basis.json,
  documents: subjects.json,
  controls: controls.json,
  revision,
  channel: "mouthWidth",
  skin: "Human",
  lips: "Human/lips",
  dentition: "Human.teeth_base",
  tongue: "Human.tongue01",
  elasticity,
});
writeFaceBasisRevision({
  io: fs,
  output,
  receiptFile: "arch-width-receipt.json",
  prepared,
  inputs: { basis, subjects, controls },
  fields: {
    citation:
      "Wang J, Li F-L, Yang H-X, Li L-M. Heliyon 2024;10:e27642 (Table 1 total sample, Table 3 total r).",
  },
  recorded: new Date(),
});
console.log(
  `elasticity ${elasticity.toFixed(4)}\n` +
    prepared.receipt.endpoints
      .map(
        (one) =>
          `${one.endpoint}: mouth ${(one.mouth[0] * 1000).toFixed(1)} -> ${(one.mouth[1] * 1000).toFixed(1)} mm, arch ${(one.arch[0] * 1000).toFixed(1)} -> ${(one.arch[1] * 1000).toFixed(1)} -> ${(one.after * 1000).toFixed(1)} mm (scale ${one.scale.toFixed(4)})`,
      )
      .join("\n"),
);
