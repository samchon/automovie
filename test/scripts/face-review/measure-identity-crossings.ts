/** Does carrying identity as vertex geometry push any surface through another?
 *
 * The instrument says to read the change from a rest pose rather than the count
 * itself: a layered character rests with its shells inside each other on
 * purpose, and the shipped connected face already crosses on six pairs at rest
 * because the eyeball sits inside the lid and the lashes are rooted in skin.
 *
 * So each subject is measured twice — once as published and once with its
 * identity removed — and what is reported is the difference. A pair that
 * appears, or a triangle count that grows, is the delta pushing tissue through
 * tissue. A pair that was already there and stays is the asset being itself.
 *
 * Usage: ttsx -P tsconfig.json --no-plugins scripts/face-review/measure-identity-crossings.ts
 */
import { measureAutoMovieModelCrossings } from "@automovie/engine";
import {
  type IAutoMovieHumanFaceBasis,
  type IAutoMovieHumanFaceBasisDocument,
  createHumanFaceBasisBuilder,
} from "@automovie/human";
import fs from "node:fs";
import { gunzipSync } from "node:zlib";

const published = "studies/human-face/connected-basis/global-face";
const basis: IAutoMovieHumanFaceBasis = JSON.parse(
  gunzipSync(fs.readFileSync(`${published}/basis.json.gz`)).toString("utf8"),
);
const documents: IAutoMovieHumanFaceBasisDocument[] = JSON.parse(
  fs.readFileSync(`${published}/subjects.json`, "utf8"),
);
const build = createHumanFaceBasisBuilder(basis);

/** Every crossing pair of a built model, as `a|b` with its triangle count. */
const pairs = (document: IAutoMovieHumanFaceBasisDocument) => {
  const out = new Map<string, number>();
  for (const crossing of measureAutoMovieModelCrossings(build(document)))
    out.set(
      `${crossing.part}|${crossing.other}`,
      crossing.triangles + crossing.otherTriangles,
    );
  return out;
};

const rows: Record<string, unknown> = {};
let worsened = 0;
for (const document of documents) {
  const name = document.id.replace("-connected", "");
  const without = pairs({ ...document, identity: undefined });
  const withIt = pairs(document);

  const appeared: string[] = [];
  let grew = 0;
  for (const [pair, count] of withIt) {
    const before = without.get(pair) ?? 0;
    if (before === 0) appeared.push(pair);
    else if (count > before) grew += count - before;
  }
  const gone = [...without.keys()].filter((pair) => withIt.has(pair) === false);
  const total = (one: Map<string, number>) =>
    [...one.values()].reduce((sum, value) => sum + value, 0);

  rows[name] = {
    pairsAtRest: without.size,
    pairsWithIdentity: withIt.size,
    trianglesAtRest: total(without),
    trianglesWithIdentity: total(withIt),
    pairsThatAppeared: appeared,
    pairsThatWent: gone,
    trianglesGrownOnExistingPairs: grew,
  };
  if (appeared.length > 0) worsened++;
  console.log(
    `${name.padEnd(26)} pairs ${without.size} -> ${withIt.size}` +
      `   triangles ${total(without)} -> ${total(withIt)}` +
      `   appeared ${appeared.length === 0 ? "none" : appeared.join(", ")}`,
  );
}
fs.writeFileSync(
  "../.shots/human-2469/investigation-2498/identity-crossings.json",
  `${JSON.stringify(rows, null, 2)}\n`,
);
console.log(`${worsened} subjects gained a crossing pair`);
