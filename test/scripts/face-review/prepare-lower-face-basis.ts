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
import fs from "node:fs";

import { parseFaceBasisRevisionArguments } from "./parseFaceBasisRevisionArguments";
import { prepareLowerFaceBasis } from "./prepareLowerFaceBasis";
import { readFaceBasisStudy } from "./readFaceBasisStudy";
import { writeFaceBasisRevision } from "./writeFaceBasisRevision";

const { studyDirectory, revision, output } = parseFaceBasisRevisionArguments(
  process.argv.slice(2),
  fs.existsSync,
);
const { basis, subjects, controls } = readFaceBasisStudy(fs, studyDirectory);
const corner = (ancestry: string, sex: number) => ({
  [ancestry]: 1,
  globalSexualDimorphism: sex,
});
const prepared = prepareLowerFaceBasis({
  basis: basis.json,
  documents: subjects.json,
  controls: controls.json,
  revision,
  channel: "chinHeight",
  skin: "Human",
  lips: basis.json.contact!.lips,
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
writeFaceBasisRevision({
  io: fs,
  output,
  receiptFile: "lower-face-receipt.json",
  prepared,
  inputs: { basis, subjects, controls },
  fields: {
    citations: {
      norms:
        "Farkas LG, Katic MJ, Forrest CR. Comparison of craniofacial measurements of young adult African-American and North American white males and females. Ann Plast Surg 2007;59(6):692-698, as tabulated in PMC6384287 Tables 2 and 3: sn-me 72.6 (4.5) and 64.3 (4.0) mm NAW men and women (n 109, 200), 78.9 (6.7) and 71.5 (5.2) mm AA men and women (n 50 each); sn-sto 22.3, 20.1, 26.1, 24.5 mm.",
    },
  },
  recorded: new Date(),
});
console.log(JSON.stringify(prepared.receipt, null, 2));
