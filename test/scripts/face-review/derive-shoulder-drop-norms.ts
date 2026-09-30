/**
 * Derive how far below the chin the shoulders sit, by sex, from the ANSUR II
 * public working databases, from the test CWD:
 *
 *   ttsx -P tsconfig.scripts.json --no-plugins scripts/face-review/derive-shoulder-drop-norms.ts MALE.csv FEMALE.csv OUTPUT.json
 *
 * MALE.csv and FEMALE.csv are "ANSUR II MALE Public.csv" and "ANSUR II FEMALE
 * Public.csv" (one row per subject, millimetres, Latin-1). OUTPUT.json must be
 * new; it receives the drops (`faceShoulderDrops`) and the inputs' SHA-256, and
 * `fit-face-hair-shape.ts` reads it as `shoulder-drop-norms.json`.
 */
import { createHash } from "node:crypto";
import fs from "node:fs";

import { faceShoulderDrops } from "./faceShoulderDrops";
import { readCsvRecords } from "./readCsvRecords";

const [male, female, output] = process.argv.slice(2);
if (
  male === undefined ||
  female === undefined ||
  output === undefined ||
  fs.existsSync(output)
)
  throw new Error("Supply the male CSV, the female CSV and a new output file.");
const read = (file: string) => {
  const bytes = fs.readFileSync(file);
  return {
    sha256: createHash("sha256").update(bytes).digest("hex"),
    drops: faceShoulderDrops(readCsvRecords(bytes.toString("latin1"))),
  };
};
const men = read(male);
const women = read(female);
fs.writeFileSync(
  output,
  JSON.stringify(
    {
      source: {
        citation:
          "Gordon CC, Blackwell CL, Bradtmiller B, et al. 2012 Anthropometric Survey of U.S. Army Personnel: Methods and Summary Statistics. NATICK/TR-15/007, 2014; public working databases 2017.",
        sha256: { male: men.sha256, female: women.sha256 },
      },
      unit: "millimetres below menton",
      male: men.drops,
      female: women.drops,
    },
    null,
    1,
  ) + "\n",
);
console.log(fs.readFileSync(output, "utf8"));
