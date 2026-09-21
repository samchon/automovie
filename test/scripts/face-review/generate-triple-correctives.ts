/** Solve the sampled triples that cross past their pairs into three-driver correctives.
 *
 * The pair correctives answer every pair; what a third channel adds on top of
 * a corrected pair is measured by `enumerate-expression-triples.ts`, and each
 * triple it names is solved here on the head that already carries the pair
 * correctives, by the same standing orders, into a corrective driven by all
 * three channels. The activation is the product of three clamped drivers, so
 * it is absent from every pair and every single, which is exactly the pose
 * it was solved to leave untouched. Triples are solved at full weight only;
 * a triple's in-betweens are a fourth power of the grid and are not sampled.
 *
 * Usage, from the test package:
 *   ttsx -P tsconfig.json --no-plugins scripts/face-review/generate-triple-correctives.ts [--limit mm] [--write]
 */
import {
  type IAutoMovieHumanFaceBasis,
  type IAutoMovieHumanFaceBasisDocument,
  createHumanFaceBasisBuilder,
} from "@automovie/human";
import type { IAutoMovieMesh } from "@automovie/interface";
import fs from "node:fs";
import { gunzipSync, gzipSync } from "node:zlib";

import { LIMIT } from "./push-out";
import {
  type Parts,
  type Worn,
  anchoredBy,
  crossingPairs,
  moverOf,
  solveCombination,
  wornFrom,
} from "./solve-combination";

/** The identity this revision publishes under, and the one it succeeds. */
const REVISION = "mpfb-connected-head-2026-09-21-triple-correctives";
const SUCCEEDS = "mpfb-connected-head-2026-09-21-pair-correctives";

/** The part a channel makes the agent of its pose, which the lips then part around. */
const AGENTS: Record<string, string> = {
  tongueOut: "Human.tongue01/Human.tongue01",
};

const published = "studies/human-face/connected-basis/global-face";
const investigation = "../.shots/human-2469/investigation-2498";
const file = `${published}/basis.json.gz`;
const basis: IAutoMovieHumanFaceBasis = JSON.parse(
  gunzipSync(fs.readFileSync(file)).toString("utf8"),
);
const sample = JSON.parse(
  fs.readFileSync(`${investigation}/expression-triples-neutral.json`, "utf8"),
) as {
  basis: string;
  sampledFromTopPairs: number;
  triples: number;
  inventing: { triple: string; appeared: string[] }[];
};
if (sample.basis !== basis.id)
  throw new Error(
    `the triple sample is for ${sample.basis}, the basis reads ${basis.id}`,
  );
const limitAt = process.argv.indexOf("--limit");
const limit = limitAt < 0 ? LIMIT : Number(process.argv[limitAt + 1]) / 1000;
if (!Number.isFinite(limit) || limit <= 0)
  throw new Error(
    `--limit wants millimetres, not ${process.argv[limitAt + 1]}`,
  );
console.log(
  `${sample.inventing.length} of ${sample.triples} sampled triples invent a crossing past their pairs`,
);

const parts: Parts = new Map();
for (const surface of basis.surfaces)
  for (const region of surface.regions)
    parts.set(region.id, { surface: surface.id, indices: region.indices });
const build = createHumanFaceBasisBuilder(basis);
const model = (expression: Record<string, number>) =>
  build({
    id: "neutral",
    name: "neutral",
    basis: basis.id,
    shape: {},
    expression,
  } satisfies IAutoMovieHumanFaceBasisDocument);
const wearing = (expression: Record<string, number>): Worn =>
  wornFrom(
    basis,
    new Map(
      model(expression).parts.map((part) => [
        part.id,
        (part.geometry as { type: "mesh"; mesh: IAutoMovieMesh }).mesh,
      ]),
    ),
  );
const atRest = wearing({});
const mover = moverOf(wearing, atRest, parts);
const capital = (id: string) => id[0].toUpperCase() + id.slice(1);
// The sample names what crossed on the basis it was measured on; the pair
// correctives may have been solved again since, so every triple is measured
// afresh here against its rest, singles and pairs, and one that no longer
// invents anything is absent rather than solved.
const cache = new Map<string, Set<string>>();
const crossed = (channels: string[]): Set<string> => {
  const key = [...channels].sort((a, b) => a.localeCompare(b)).join("+");
  let hit = cache.get(key);
  if (hit === undefined) {
    hit = crossingPairs(model(Object.fromEntries(channels.map((c) => [c, 1]))));
    cache.set(key, hit);
  }
  return hit;
};

type Corrective = NonNullable<IAutoMovieHumanFaceBasis["correctives"]>[number];
const correctives: Corrective[] = [];
const targets = new Map<string, Map<string, number[]>>();
const receipts: Record<string, unknown>[] = [];
console.log(
  `\n${"combination".padEnd(60)} ${"yields".padEnd(12)} ${"to".padEnd(12)}` +
    ` ${"crossed".padStart(7)} ${"left".padStart(4)} ${"moved".padStart(5)} ${"most".padStart(5)}`,
);
let absent = 0;
for (const one of sample.inventing) {
  const channels = one.triple.split(" + ");
  const expression = Object.fromEntries(channels.map((c) => [c, 1]));
  const [a, b, c] = channels;
  const below = new Set(crossed([]));
  for (const subset of [[a], [b], [c], [a, b], [a, c], [b, c]])
    for (const pair of crossed(subset)) below.add(pair);
  const appeared = [...crossed(channels)]
    .filter((pair) => !below.has(pair))
    .sort((x, y) => x.localeCompare(y));
  if (appeared.length === 0) {
    absent++;
    receipts.push({ combination: one.triple, corrective: null, crossings: [] });
    continue;
  }
  const agents = new Set(
    channels.flatMap((c) => (AGENTS[c] === undefined ? [] : [AGENTS[c]])),
  );
  const withoutAgents = wearing(
    Object.fromEntries(
      Object.entries(expression).filter(([c]) => AGENTS[c] === undefined),
    ),
  );
  const solved = solveCombination(
    wearing(expression),
    appeared,
    parts,
    atRest,
    limit,
    agents,
    anchoredBy(wearing, atRest, mover, expression),
    withoutAgents,
    (line) => console.log(`${one.triple.padEnd(60)} ${line}`),
    below,
  );
  const id =
    channels.map((c, at) => (at === 0 ? c : capital(c))).join("") + "Clear";
  if (solved.publishable) {
    correctives.push({
      id,
      inputs: channels.map((c) => ({ channel: c, side: "positive" as const })),
      weight: 1,
      target: id,
    });
    targets.set(id, solved.rows);
  }
  console.log(
    `${"".padEnd(60)} ${(solved.publishable ? `-> ${id}` : "-> not published").padEnd(46)}` +
      ` crease ${(solved.creaseMetres * 1000).toFixed(2)} mm`,
  );
  receipts.push({
    combination: one.triple,
    corrective: solved.publishable ? id : null,
    movedVertices: solved.movedVertices,
    creaseMillimetres: solved.creaseMetres * 1000,
    crossings: solved.outcomes,
  });
}
console.log(
  `\n${sample.inventing.length} triples, ${absent} absent on this basis, ${correctives.length} published`,
);
fs.writeFileSync(
  `${investigation}/triple-correctives.json`,
  `${JSON.stringify(receipts, null, 2)}\n`,
);

if (process.argv.includes("--write") === false)
  console.log("dry run; pass --write to publish");
else if (basis.id === REVISION)
  console.log("already published as this revision; nothing to do");
else {
  if (basis.id !== SUCCEEDS)
    throw new Error(
      `this step succeeds ${SUCCEEDS}, but the basis reads ${basis.id}`,
    );
  const taken = new Set([
    ...basis.channels.map((one) => one.id),
    ...(basis.correctives ?? []).map((one) => one.id),
  ]);
  for (const corrective of correctives)
    if (taken.has(corrective.id))
      throw new Error(`${corrective.id} is already a channel or corrective`);
  const next = structuredClone(basis);
  next.correctives = [...(next.correctives ?? []), ...correctives];
  for (const surface of next.surfaces)
    for (const [id, rows] of targets) {
      const mine = rows.get(surface.id);
      if (mine !== undefined) surface.targets[id] = mine;
    }
  const was = basis.id;
  next.id = REVISION;
  fs.writeFileSync(file, gzipSync(`${JSON.stringify(next)}\n`, { level: 9 }));
  const restamp = (path: string, zipped: boolean): void => {
    const raw = zipped
      ? gunzipSync(fs.readFileSync(path)).toString("utf8")
      : fs.readFileSync(path, "utf8");
    const parsed: unknown = JSON.parse(raw);
    const records: { basis?: string }[] = Array.isArray(parsed)
      ? parsed
      : Object.values(parsed as Record<string, { basis?: string }>);
    for (const record of records) record.basis = REVISION;
    const text = Array.isArray(parsed)
      ? `${JSON.stringify(parsed, null, 2)}\n`
      : `${JSON.stringify(parsed)}\n`;
    fs.writeFileSync(
      path,
      zipped ? gzipSync(text, { level: 9 }) : Buffer.from(text, "utf8"),
    );
  };
  restamp(`${published}/subjects.json`, false);
  restamp(`${published}/grooms.json.gz`, true);
  fs.writeFileSync(
    `${published}/triple-corrective-receipt.json`,
    `${JSON.stringify(
      {
        basis: REVISION,
        supersedes: was,
        sample: {
          fromTopPairs: sample.sampledFromTopPairs,
          triples: sample.triples,
          inventing: sample.inventing.length,
        },
        budgetMillimetres: limit * 1000,
        published: correctives.map((one) => one.id),
        combinations: receipts,
        limits: [
          "Triples are sampled from the most interacting pairs joined by their partners, not enumerated; 22,100 triples is twelve hours a head.",
          "A triple corrective is solved at full weight only; its in-betweens are not sampled.",
          "Solved on the neutral head; a subject's own triples are not solved.",
        ],
      },
      null,
      2,
    )}\n`,
  );
  console.log(`published ${REVISION}, succeeding ${was}`);
}
