/**
 * Prepare the eyelash revision of the published face basis, from the test
 * CWD:
 *
 *   ttsx -P tsconfig.scripts.json --no-plugins scripts/face-review/prepare-eyelash-basis.ts STUDY REVISION OUTPUT
 *
 * The upper lid holds 160 lashes (Na et al. 2006: about 147 in Asian and 172
 * in Caucasian women), 7.4 mm long at the centre (Kikuchi et al. 2015: the
 * longest central lash 7.33 mm in men and 7.47 in women) and 0.844 and 0.891
 * of that at the medial and lateral ends (the mean of three Nigerian samples'
 * medial and lateral over central lengths, Adekanmbi 2019), 66 um across
 * (Na 2006: 71.7 Asian, 61.0 Caucasian), with 41 percent of its follicles
 * growing (Elder 1997). The lower lid holds 0.44 of the upper's lashes
 * (Kikuchi 2015: 40 to 48 percent of the upper density), 5.27 mm long
 * throughout (the same study's 4.98 and 5.56; no study gives its profile
 * along the lid), 0.77 of the upper's diameter (Elder 1997: lower shafts 158
 * um against upper 205), with 15 percent growing. The brows blend the
 * coverage their own texture holds. The texture is 1024 pixels square.
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

import { prepareEyelashBasis } from "./prepareEyelashBasis";

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
const upperCentral = 7.4;
const upperCount = 160;
const upperDiameter = 0.066;
const prepared = prepareEyelashBasis({
  basis: basis.json as IAutoMovieHumanFaceBasis,
  documents: subjects.json as IAutoMovieHumanFaceBasisDocument[],
  controls: controls.json as IAutoMovieHumanFaceControlMap,
  revision,
  surface: "Human.eyelashes01",
  skin: "Human",
  norms: [
    {
      region: "Human.eyelashes01/Human.eyelashes01",
      material: "Human.eyelashes01",
      count: upperCount,
      length: {
        medial: 0.844 * upperCentral,
        central: upperCentral,
        lateral: 0.891 * upperCentral,
      },
      diameter: upperDiameter,
      growing: 0.41,
    },
    {
      region: "Human.eyelashes01/Human.eyelashes01.lower",
      material: "Human.eyelashes01.lower",
      count: Math.round(0.44 * upperCount),
      length: { medial: 5.27, central: 5.27, lateral: 5.27 },
      diameter: 0.77 * upperDiameter,
      growing: 0.15,
    },
  ],
  blended: ["Human.eyebrow001"],
  size: 1024,
  seed: 20260925,
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
    count:
      "Na JI, Kwon OS, Kim BJ, et al. Ethnic characteristics of eyelashes: a comparative analysis in Asian and Caucasian females. Br J Dermatol 2006;155(6):1170-1176, doi:10.1111/j.1365-2133.2006.07495.x: 2946 upper lashes of 20 Asian women (about 147 per lid) and 1715 of 10 Caucasian women (about 172); diameter 71.7 and 61.0 um.",
    length:
      "Kikuchi M, Matsuda K, Ishihara Y, et al. Glob Dermatol 2015;2(1):74-77, doi:10.15761/GOD.1000123: Japanese aged 22 to 38 (25 men, 25 women), longest central lash upper 7.33 (0.83) and 7.47 (0.68) mm, lower 4.98 (0.75) and 5.56 (0.60) mm; lower density 5.80 and 6.24 per 2 mm against upper 12.12 and 15.24.",
    profile:
      "Adekanmbi AJ et al., Nigerian J Plast Surg 2019;15(2):39-43 (abstract): upper lash medial, middle and lateral lengths, Hausa 7.80, 9.35, 8.29; Yoruba 7.40, 8.58, 7.67; Igbo 7.24, 8.65, 7.72 mm; medial over middle 0.834, 0.862, 0.837 (mean 0.844), lateral over middle 0.887, 0.894, 0.892 (mean 0.891).",
    cycle:
      "Elder MJ. Anatomy and physiology of eyelash follicles: relevance to lash ablation procedures. Ophthalmic Plast Reconstr Surg 1997;13(1):21-25: 41 percent of upper and 15 percent of lower follicles in anagen; shaft 205 (28) um upper, 158 (26) um lower. Thibaut S et al., Br J Dermatol 2010;162(2):304-310: growth 0.12 mm per day, asynchronous cycles.",
  },
  inputs: {
    basis: { sha256: digest(basis.bytes), bytes: basis.bytes.length },
    subjects: { sha256: digest(subjects.bytes), bytes: subjects.bytes.length },
    controls: { sha256: digest(controls.bytes), bytes: controls.bytes.length },
  },
  outputs: { basis: { sha256: digest(basisBytes), bytes: basisBytes.length } },
};
fs.writeFileSync(
  path.join(output, "eyelash-receipt.json"),
  JSON.stringify(receipt, null, 2) + "\n",
);
console.log(JSON.stringify(prepared.receipt, null, 2));
