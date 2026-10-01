import {
  type IAutoMovieHumanBodyBasis,
  type IAutoMovieHumanBodyBasisDocument,
  type IAutoMovieHumanBodySimpleShape,
  evaluateHumanBodyShape,
  expandHumanBodySimpleShape,
  humanBodyBasisWeights,
  measureHumanBodySimpleShape,
} from "@automovie/human";
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";

import { ANSUR_BODY_MEASURES } from "./ANSUR_BODY_MEASURES";
import {
  type IAnsurCensusRow,
  formatAnsurCensusTable,
} from "./formatAnsurCensusTable";
import { parseAnsurCsv } from "./parseAnsurCsv";
import { pickAnsurStrata } from "./pickAnsurStrata";
import { summariseAnsurResiduals } from "./summariseAnsurResiduals";

/**
 * Census how the body reproduces the proportions of measured people when the
 * simple tier is given only the identity card (sex, age, stature, mass,
 * muscle 0), the way the editor is used.
 *
 * Usage, from `test/`:
 * `pnpm exec ttsx -P tsconfig.scripts.json scripts/body-ansur/ansur-proportion-census.ts <label> [peoplePerSex=12] [--basis <input.gz>]`.
 * For each sex of the ANSUR II public CSVs under `.references/anthropometry`
 * it takes `peoplePerSex` real adults spread over the 1st to 99th BMI
 * percentile, expands each one's identity card through
 * `expandHumanBodySimpleShape`, reads the body at rest and writes, per
 * `ANSUR_BODY_MEASURES` row, the signed residual (body minus person, mm) by
 * thin-to-heavy band. A person the simple tier refuses is listed with its
 * reason and its card instead of being dropped. The people are probes of the
 * measured population's spread and never a fitting target: no constant is
 * taken from any of them. Output is `.shots/ansur-census/<label>.{md,json}`,
 * local and ignored. `<label>.documents.json` holds each expanded body as a
 * viewer document (copy it into `.shots/human-viewer/inputs/` to look at it).
 */
const label = process.argv[2] ?? "census";
const perSex = Number(process.argv[3] ?? 12);
const basisFlag = process.argv.indexOf("--basis");
const root = path.resolve(__dirname, "../../..");
const basisPath =
  basisFlag === -1
    ? path.join(root, "test/studies/human-body/connected-basis/basis.json.gz")
    : path.resolve(process.argv[basisFlag + 1]);
const basis = JSON.parse(
  zlib.gunzipSync(fs.readFileSync(basisPath)).toString("utf8"),
) as IAutoMovieHumanBodyBasis;
const bmi = (row: Record<string, number>): number =>
  row.weightkg / 10 / (row.stature / 1000) ** 2;

const rows: IAnsurCensusRow[] = [];
const documents: IAutoMovieHumanBodyBasisDocument[] = [];
const refused: { sex: string; card: unknown; reason: string }[] = [];
for (const [sex, file, code] of [
  ["female", "ANSUR_II_FEMALE_Public.csv", -1],
  ["male", "ANSUR_II_MALE_Public.csv", 1],
] as const) {
  const people = pickAnsurStrata(
    parseAnsurCsv(
      fs.readFileSync(path.join(root, ".references/anthropometry", file), "utf8"),
    ),
    bmi,
    perSex,
  );
  const residuals = ANSUR_BODY_MEASURES.map(() => [] as number[]);
  for (const person of people) {
    const card: IAutoMovieHumanBodySimpleShape = {
      sex: code,
      ageYears: person.age,
      statureMetres: person.stature / 1000,
      massKilograms: person.weightkg / 10,
      muscle: 0,
    };
    try {
      const shape = expandHumanBodySimpleShape(basis, card);
      documents.push({
        id: `${label}-${sex}-bmi${bmi(person).toFixed(1)}`,
        name: `${sex} BMI ${bmi(person).toFixed(1)}, ${card.statureMetres.toFixed(3)} m, ${card.massKilograms.toFixed(1)} kg`,
        basis: basis.id,
        shape,
      });
      const shaped = evaluateHumanBodyShape(
        basis,
        humanBodyBasisWeights(basis, { shape }),
      );
      const floor = Math.min(
        ...shaped.surfaces.map((positions) => {
          let low = Infinity;
          for (let v = 1; v < positions.length; v += 3)
            low = Math.min(low, positions[v]);
          return low;
        }),
      );
      ANSUR_BODY_MEASURES.forEach((measure, index) => {
        const metres =
          measure.read.kind === "channel"
            ? measureHumanBodySimpleShape.channel(basis, shape, measure.read.id)
            : shaped.landmarks[measure.read.landmark].y - floor;
        if (metres === null || person[measure.column] === undefined) return;
        residuals[index].push(metres * 1000 - person[measure.column]);
      });
    } catch (error) {
      refused.push({
        sex,
        card,
        reason: error instanceof Error ? error.message : String(error),
      });
    }
  }
  ANSUR_BODY_MEASURES.forEach((measure, index) => {
    const bands = Math.min(3, residuals[index].length);
    if (bands === 0) return;
    rows.push({
      sex,
      measure: measure.name,
      sameDefinition: measure.sameDefinition,
      count: residuals[index].length,
      bands: summariseAnsurResiduals(residuals[index], bands),
    });
  });
}
const directory = path.join(root, ".shots/ansur-census");
fs.mkdirSync(directory, { recursive: true });
const table = formatAnsurCensusTable(rows);
fs.writeFileSync(path.join(directory, label + ".md"), table);
fs.writeFileSync(
  path.join(directory, label + ".json"),
  JSON.stringify({ basis: basis.id, perSex, rows, refused }, null, 1),
);
fs.writeFileSync(
  path.join(directory, label + ".documents.json"),
  JSON.stringify(documents),
);
console.log(table);
console.log("refused", refused.length);
