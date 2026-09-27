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
import type {
  IAutoMovieHumanFaceBasis,
  IAutoMovieHumanFaceBasisDocument,
  IAutoMovieHumanFaceControlMap,
} from "@automovie/human";
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { gunzipSync, gzipSync } from "node:zlib";

import { prepareCanthalTiltBasis } from "./prepareCanthalTiltBasis";

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
const prepared = prepareCanthalTiltBasis({
  basis: basis.json as IAutoMovieHumanFaceBasis,
  documents: subjects.json as IAutoMovieHumanFaceBasisDocument[],
  controls: controls.json as IAutoMovieHumanFaceControlMap,
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
  inputs: {
    basis: { sha256: digest(basis.bytes), bytes: basis.bytes.length },
    subjects: { sha256: digest(subjects.bytes), bytes: subjects.bytes.length },
    controls: { sha256: digest(controls.bytes), bytes: controls.bytes.length },
  },
  outputs: { basis: { sha256: digest(basisBytes), bytes: basisBytes.length } },
};
fs.writeFileSync(
  path.join(output, "canthal-tilt-receipt.json"),
  JSON.stringify(receipt, null, 2) + "\n",
);
console.log(JSON.stringify(prepared.receipt, null, 2));
