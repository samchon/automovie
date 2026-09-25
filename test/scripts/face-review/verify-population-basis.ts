/**
 * Replay every sampled population corner through the builder, from the test
 * CWD:
 *
 *   ttsx -P tsconfig.scripts.json --no-plugins scripts/face-review/verify-population-basis.ts BASIS.json.gz CORNERS.json.gz
 *
 * CORNERS is what `population_rows.py` writes beside the rows: every sampled
 * MPFB state as eye-frame displacements from the neutral. Each corner is
 * built at the controls it corresponds to (the ancestry share one, the
 * dimorphism and age channels at -1, 0 or 1) and its rest surfaces compared
 * to the sample; the worst difference per surface is printed. Every row is
 * rounded to a micrometre, so each term is off by at most half of one, and a
 * corner sums at most seven (an ancestry, dimorphism and age endpoint, three
 * pair products and the triple): a corner off by more than 3.5 micrometres
 * fails the run.
 */
import {
  type IAutoMovieHumanFaceBasis,
  createHumanFaceBasisBuilder,
} from "@automovie/human";
import fs from "node:fs";
import { gunzipSync } from "node:zlib";

import { faceShapeFitSurfacePositions } from "./faceShapeFitSurface";

const [basisPath, cornersPath] = process.argv.slice(2);
if (basisPath === undefined || cornersPath === undefined)
  throw new Error("Supply the basis and the corners.");
const basis = JSON.parse(
  gunzipSync(fs.readFileSync(basisPath)).toString("utf8"),
) as IAutoMovieHumanFaceBasis;
const corners = JSON.parse(
  gunzipSync(fs.readFileSync(cornersPath)).toString("utf8"),
) as Record<string, Record<string, number[]>>;
const build = createHumanFaceBasisBuilder(basis);
const ANCESTRY: Record<string, string> = {
  african: "africanAncestry",
  asian: "asianAncestry",
  caucasian: "europeanAncestry",
};
const rest = (shape: Record<string, number>) =>
  build({ id: "v", name: "v", basis: basis.id, shape, expression: {} });
const neutral = rest({});
let worstAll = 0;
for (const [key, delta] of Object.entries(corners)) {
  const [race, gender, age] = key.split("|");
  const shape: Record<string, number> = {
    globalSexualDimorphism: 2 * Number(gender) - 1,
    globalAgeStructure:
      Number(age) < 0.5
        ? (Number(age) - 0.5) / 0.25
        : (Number(age) - 0.5) / 0.5,
  };
  if (race !== "default") shape[ANCESTRY[race!]!] = 1;
  const model = rest(shape);
  const worst: Record<string, number> = {};
  for (const surface of basis.surfaces) {
    const a = faceShapeFitSurfacePositions(basis, model, surface.id);
    const b = faceShapeFitSurfacePositions(basis, neutral, surface.id);
    const d = delta[surface.id]!;
    let w = 0;
    for (let i = 0; i < a.length; ++i)
      w = Math.max(w, Math.abs(a[i]! - b[i]! - d[i]!));
    worst[surface.id] = w;
    worstAll = Math.max(worstAll, w);
  }
  console.log(
    key.padEnd(22),
    Object.values(worst)
      .map((w) => (w * 1e6).toFixed(2))
      .join(" "),
    "um",
  );
}
console.log("worst", (worstAll * 1e6).toFixed(3), "um");
if (worstAll > 3.5e-6)
  throw new Error("A population corner does not replay its sample.");
