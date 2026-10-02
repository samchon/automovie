/**
 * Prepare the canthal tilt revision of the published face basis, from the
 * test CWD:
 *
 *   ttsx -P tsconfig.scripts.json --no-plugins scripts/face-review/prepare-canthal-tilt-basis.ts STUDY REVISION OUTPUT
 *
 * Read on the source (a 0.1 mm frontal depth buffer 22 mm either side of
 * each eye's centre and 14 mm above and below, each corner the centroid of
 * the fissure's last millimetre), women's canthal tilt exceeds men's by 1.9
 * degrees at the European corner and 1.8 at the African one, as the White
 * and African-American norms have it (1.6 to 2.2), but by nothing at the
 * Asian corner, where three East Asian adult samples give +0.9, +1.18 and
 * +1.12 (listed in the receipt's citations), mean +1.07 degrees. The
 * revision moves only the Asian dimorphism correctives, read at 25 years
 * (age channel 0, where the age correctives are idle), along the source's
 * lateral canthus elevation pair.
 */
import fs from "node:fs";

import { parseFaceBasisRevisionArguments } from "./parseFaceBasisRevisionArguments";
import { prepareCanthalTiltBasis } from "./prepareCanthalTiltBasis";
import { readFaceBasisStudy } from "./readFaceBasisStudy";
import { writeFaceBasisRevision } from "./writeFaceBasisRevision";

const { studyDirectory, revision, output } = parseFaceBasisRevisionArguments(
  process.argv.slice(2),
  fs.existsSync,
);
const { basis, subjects, controls } = readFaceBasisStudy(fs, studyDirectory);
const prepared = prepareCanthalTiltBasis({
  basis: basis.json,
  documents: subjects.json,
  controls: controls.json,
  revision,
  dimorphism: "globalSexualDimorphism",
  targets: {
    men: "population.asianAncestry.sex-positive",
    women: "population.asianAncestry.sex-negative",
  },
  field: ["leftLateralCanthusElevation", "rightLateralCanthusElevation"],
  skin: "Human",
  globe: "Human.low-poly",
  eyes: ["joint-l-eye", "joint-r-eye"],
  half: [0.022, 0.014],
  resolution: 0.0001,
  band: 0.001,
  corners: [{ label: "Asian", shape: { asianAncestry: 1 } }],
  difference: 1.07,
});
writeFaceBasisRevision({
  io: fs,
  output,
  receiptFile: "canthal-tilt-receipt.json",
  prepared,
  inputs: { basis, subjects, controls },
  fields: {
    citations: {
      definition:
        "Hall BD et al., Elements of morphology: standard terminology for the periorbital region. Am J Med Genet A 2009;149A(1):29-39, doi:10.1002/ajmg.a.32597: the inclination of the en-ex line against the horizontal.",
      eastAsian: [
        "Park DH et al., Plast Reconstr Surg 2008;121:1405-1413: Korean adults 7.9 (2.4) men, 8.8 (2.3) women degrees, difference +0.9.",
        "Takahagi S et al., Clin Ophthalmol 2008;2:563-567 (PMC2694016): Japanese aged 20 to 29, 6.62 (1.73) men, 7.80 (3.18) women, +1.18.",
        "Gao T et al., Quant Imaging Med Surg 2025;15:882-897 (PMC11744102), 3D, aged 18 to 30: Chinese 4.89 men (n 19), 6.01 women (n 27), +1.12 (tilt as 180 degrees less the reported Ex-En-En angle).",
      ],
      mean: "(0.9 + 1.18 + 1.12) / 3 = 1.07 degrees.",
      others:
        "Farkas LG, Anthropometry of the Head and Face, 1994, and Price KM et al., Plast Reconstr Surg 2009;124:615, as tabulated by Vasanthakumar P et al., Oman Med J 2013;28:26-32 (PMC3562989) Table 3: North American White 2.1 men, 4.1 women (+2.0); White American 3.6, 5.8 (+2.2); African American 3.9, 6.0 (+2.1); Gao 2025 3D Caucasian 0.78, 2.40 (+1.62). The source's European (+1.9) and African (+1.8) corners already agree and are left.",
    },
  },
  recorded: new Date(),
});
console.log(JSON.stringify(prepared.receipt, null, 2));
