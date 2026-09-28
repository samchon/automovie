/**
 * Prepare the lower-face revision of the published face basis, from the test
 * CWD:
 *
 *   ttsx -P tsconfig.scripts.json --no-plugins scripts/face-review/prepare-lower-face-basis.ts STUDY REVISION OUTPUT
 *
 * The norms are the young-adult lower face heights (subnasale to menton) of
 * Farkas, Katic and Forrest, Ann Plast Surg 2007;59:692-698: North American
 * White men 72.6 mm and women 64.3 mm, African-American men 78.9 mm and
 * women 71.5 mm, set against the source's European and African corners at
 * 25 years (age channel 0) with the dimorphism channel at +1 and -1. The
 * field is the source's `chinHeight` endpoint.
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

import { prepareLowerFaceBasis } from "./prepareLowerFaceBasis";

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
const corner = (ancestry: string, sex: number) => ({
  [ancestry]: 1,
  globalSexualDimorphism: sex,
});
const prepared = prepareLowerFaceBasis({
  basis: basis.json as IAutoMovieHumanFaceBasis,
  documents: subjects.json as IAutoMovieHumanFaceBasisDocument[],
  controls: controls.json as IAutoMovieHumanFaceControlMap,
  revision,
  channel: "chinHeight",
  skin: "Human",
  lips: (basis.json as IAutoMovieHumanFaceBasis).contact!.lips,
  norms: [
    {
      label: "North American White men",
      shape: corner("europeanAncestry", 1),
      targetMetres: 0.0726,
    },
    {
      label: "North American White women",
      shape: corner("europeanAncestry", -1),
      targetMetres: 0.0643,
    },
    {
      label: "African-American men",
      shape: corner("africanAncestry", 1),
      targetMetres: 0.0789,
    },
    {
      label: "African-American women",
      shape: corner("africanAncestry", -1),
      targetMetres: 0.0715,
    },
  ],
  profile: { nose: [-0.02, 0.02], chinDepth: 0.03, level: 0.1, step: 0.00025 },
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
    norms:
      "Farkas LG, Katic MJ, Forrest CR. Comparison of craniofacial measurements of young adult African-American and North American white males and females. Ann Plast Surg 2007;59(6):692-698, as tabulated in PMC6384287 Tables 2 and 3: sn-me 72.6 (4.5) and 64.3 (4.0) mm NAW men and women (n 109, 200), 78.9 (6.7) and 71.5 (5.2) mm AA men and women (n 50 each); sn-sto 22.3, 20.1, 26.1, 24.5 mm.",
  },
  inputs: {
    basis: { sha256: digest(basis.bytes), bytes: basis.bytes.length },
    subjects: { sha256: digest(subjects.bytes), bytes: subjects.bytes.length },
    controls: { sha256: digest(controls.bytes), bytes: controls.bytes.length },
  },
  outputs: { basis: { sha256: digest(basisBytes), bytes: basisBytes.length } },
};
fs.writeFileSync(
  path.join(output, "lower-face-receipt.json"),
  JSON.stringify(receipt, null, 2) + "\n",
);
console.log(JSON.stringify(prepared.receipt, null, 2));
