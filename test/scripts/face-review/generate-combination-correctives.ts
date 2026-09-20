/** Author the missing correctives by solving them, not by noticing them.
 *
 * The enumeration of every expression pair on the neutral head says which
 * combinations put a surface through a surface that neither side puts it
 * through. Writing those correctives by hand would be the same reactive method
 * that produced the first two, one pose at a time, with no statement of when
 * the list ends. The list already ends; what is missing is a procedure that
 * answers every item of it the same way, and this is it.
 *
 * The procedure, in two tiers. A combination's pose is built on the neutral
 * head -- no shape, no per-vertex identity, no skin -- because a corrective
 * endpoint is a displacement field on the basis and not on a subject.
 * `solveCombination` pushes what crosses clear inside a budget and the
 * displacement is the corrective, firing on the product of the two channels so
 * a single channel alone is left exactly as authored. That is the first tier,
 * at full weight on both channels. A product is bilinear, so at (1, ½) the
 * same corrective lands at half strength on a pose that may still cross; the
 * second tier wears each corrected pair at (1, ½) and (½, 1) with the first
 * tier present, solves what remains, and publishes it as an in-between whose
 * halved driver peaks at ½ and is gone again at full.
 *
 * What it refuses. A pair the budget cannot clear is reported and not
 * published; a pair whose crossing this head does not show is absent, not
 * repaired; a fold of one surface into itself is named and left to a solver
 * that does not exist yet. And a corrective is a repair, not an acceptance: it
 * removes a measured crossing and says nothing about whether the face is one
 * somebody would make. `verify-combination-correctives.ts` is what says
 * whether the published revision holds on every subject.
 *
 * Usage, from the test package:
 *   ttsx -P tsconfig.json --no-plugins scripts/face-review/generate-combination-correctives.ts [--pairs N] [--limit mm] [--write]
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
  type ISolvedCombination,
  type Parts,
  type Worn,
  solveCombination,
  wornFrom,
} from "./solve-combination";

/** The identity this revision publishes under, and the one it succeeds. */
const REVISION = "mpfb-connected-head-2026-09-20-pair-correctives";
const SUCCEEDS = "mpfb-connected-head-2026-09-20-rigid-mandible";

/** The second tier's poses: which channel is halved, and the in-between's peak. */
const HALF = 0.5;

/** The part a channel makes the agent of its pose, which the lips then part around. */
const AGENTS: Record<string, string> = {
  tongueOut: "Human.tongue01/Human.tongue01",
};
const agentsOf = (channels: string[]): ReadonlySet<string> =>
  new Set(
    channels.flatMap((one) => (AGENTS[one] === undefined ? [] : [AGENTS[one]])),
  );

const published = "studies/human-face/connected-basis/global-face";
const investigation = "../.shots/human-2469/investigation-2498";
const file = `${published}/basis.json.gz`;
const basis: IAutoMovieHumanFaceBasis = JSON.parse(
  gunzipSync(fs.readFileSync(file)).toString("utf8"),
);

/** The enumeration's shards read back together, in the order they were cut. */
const shards = fs
  .readdirSync(investigation)
  .filter((name) => /^expression-pairs-neutral(\.\d+of\d+)?\.json$/.test(name))
  .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
if (shards.length === 0)
  throw new Error(
    "no neutral-head enumeration; run enumerate-expression-pairs.ts neutral first",
  );
type Found = { pair: string; interaction: number; appeared: string[] };
const found: Found[] = [];
let visited = 0;
let expected = 0;
for (const name of shards) {
  const report = JSON.parse(fs.readFileSync(`${investigation}/${name}`, "utf8"))
    .neutral as { all: Found[]; visited: number; pairs: number };
  found.push(...report.all);
  visited += report.visited;
  expected = report.pairs;
}
if (visited !== expected)
  throw new Error(
    `the shards visited ${visited} of ${expected} pairs; some are missing`,
  );
const offending = found
  .filter((one) => one.appeared.length > 0)
  .sort(
    (a, b) => b.interaction - a.interaction || a.pair.localeCompare(b.pair),
  );
// `indexOf` gives -1 when the flag is absent, and argv[0] is the interpreter,
// so reading argv[index + 1] without checking turns "all of them" into NaN and
// the whole run into nothing. It did, once, silently.
const asked = process.argv.indexOf("--pairs");
const budget =
  asked < 0
    ? offending.length
    : Number(process.argv[asked + 1] ?? offending.length);
if (!Number.isFinite(budget) || budget <= 0)
  throw new Error(`--pairs wants a count, not ${process.argv[asked + 1]}`);
const limitAt = process.argv.indexOf("--limit");
const limit = limitAt < 0 ? LIMIT : Number(process.argv[limitAt + 1]) / 1000;
if (!Number.isFinite(limit) || limit <= 0)
  throw new Error(
    `--limit wants millimetres, not ${process.argv[limitAt + 1]}`,
  );
console.log(
  `${offending.length} of ${visited} combinations invent a crossing on the neutral head; ` +
    `${Math.min(budget, offending.length)} to be solved`,
);

const parts: Parts = new Map();
for (const surface of basis.surfaces)
  for (const region of surface.regions)
    parts.set(region.id, { surface: surface.id, indices: region.indices });

/** A builder's head worn at one expression, over shared vertices. */
const wearer =
  (build: ReturnType<typeof createHumanFaceBasisBuilder>) =>
  (expression: Record<string, number>): Worn => {
    const document: IAutoMovieHumanFaceBasisDocument = {
      id: "neutral",
      name: "neutral",
      basis: basis.id,
      shape: {},
      expression,
    };
    return wornFrom(
      basis,
      new Map(
        build(document).parts.map((part) => [
          part.id,
          (part.geometry as { type: "mesh"; mesh: IAutoMovieMesh }).mesh,
        ]),
      ),
    );
  };
const capital = (id: string) => id[0].toUpperCase() + id.slice(1);

type Corrective = NonNullable<IAutoMovieHumanFaceBasis["correctives"]>[number];
const correctives: Corrective[] = [];
const targets = new Map<string, Map<string, number[]>>();
const receipts: Record<string, unknown>[] = [];

/** Keep a solved combination as a corrective when it earned publication. */
const keep = (
  id: string,
  inputs: Corrective["inputs"],
  solved: ISolvedCombination,
): boolean => {
  if (!solved.publishable) return false;
  correctives.push({ id, inputs, weight: 1, target: id });
  targets.set(id, solved.rows);
  return true;
};

const header = () =>
  console.log(
    `\n${"combination".padEnd(40)} ${"yields".padEnd(12)} ${"to".padEnd(12)}` +
      ` ${"crossed".padStart(7)} ${"left".padStart(4)} ${"moved".padStart(5)} ${"most".padStart(5)}`,
  );
const verdict = (kept: boolean, id: string, solved: ISolvedCombination) =>
  console.log(
    `${"".padEnd(40)} ${(kept ? `-> ${id}` : "-> not published").padEnd(46)}` +
      ` crease ${(solved.creaseMetres * 1000).toFixed(2)} mm`,
  );

// First tier: every offending pair at full weight on both channels.
header();
const wearing = wearer(createHumanFaceBasisBuilder(basis));
const atRest = wearing({});
const chosen = offending.slice(0, budget);
const firstTier = new Map<string, string>();
for (const one of chosen) {
  const [first, second] = one.pair.split(" + ");
  const solved = solveCombination(
    wearing({ [first]: 1, [second]: 1 }),
    one.appeared,
    parts,
    atRest,
    limit,
    agentsOf([first, second]),
    (line) => console.log(`${one.pair.padEnd(40)} ${line}`),
  );
  const id = `${first}${capital(second)}Clear`;
  const kept = keep(
    id,
    [
      { channel: first, side: "positive" },
      { channel: second, side: "positive" },
    ],
    solved,
  );
  if (kept) firstTier.set(one.pair, id);
  verdict(kept, id, solved);
  receipts.push({
    combination: one.pair,
    weights: "1,1",
    corrective: kept ? id : null,
    movedVertices: solved.movedVertices,
    creaseMillimetres: solved.creaseMetres * 1000,
    crossings: solved.outcomes,
  });
}

// Second tier: each corrected pair at half weight on one channel, worn with
// the first tier present so only what the half-strength corrective leaves is
// solved. The in-between's halved driver peaks at ½; the other stays a clamp.
const staged: IAutoMovieHumanFaceBasis = structuredClone(basis);
staged.correctives = [...(staged.correctives ?? []), ...correctives];
for (const surface of staged.surfaces)
  for (const [id, rows] of targets) {
    const mine = rows.get(surface.id);
    if (mine !== undefined) surface.targets[id] = mine;
  }
console.log("\nsecond tier: the corrected pairs at half weight on one channel");
header();
const wearingStaged = wearer(createHumanFaceBasisBuilder(staged));
for (const one of chosen) {
  const full = firstTier.get(one.pair);
  if (full === undefined) continue;
  const [first, second] = one.pair.split(" + ");
  for (const halved of [first, second]) {
    const other = halved === first ? second : first;
    const solved = solveCombination(
      wearingStaged({ [halved]: HALF, [other]: 1 }),
      one.appeared,
      parts,
      atRest,
      limit,
      agentsOf([first, second]),
      (line) =>
        console.log(`${`${one.pair} @${halved}=${HALF}`.padEnd(40)} ${line}`),
    );
    const id = `${full}${halved === first ? "First" : "Second"}Half`;
    const kept = keep(
      id,
      [
        {
          channel: first,
          side: "positive",
          ...(halved === first ? { peak: HALF } : {}),
        },
        {
          channel: second,
          side: "positive",
          ...(halved === second ? { peak: HALF } : {}),
        },
      ],
      solved,
    );
    // Nothing to solve at this pose is the first tier having carried it,
    // which is the outcome that wants no in-between at all.
    if (
      solved.outcomes.some(
        (o) => o.outcome === "repaired" || o.outcome === "beyond the budget",
      )
    )
      verdict(kept, id, solved);
    receipts.push({
      combination: one.pair,
      weights: halved === first ? `${HALF},1` : `1,${HALF}`,
      corrective: kept ? id : null,
      movedVertices: solved.movedVertices,
      creaseMillimetres: solved.creaseMetres * 1000,
      crossings: solved.outcomes,
    });
  }
}

const counted = (what: string) =>
  receipts
    .flatMap((one) => one.crossings as { outcome: string }[])
    .filter((one) => one.outcome === what).length;
console.log(
  `\n${chosen.length} combinations, ${firstTier.size} published at full weight, ` +
    `${correctives.length - firstTier.size} in-betweens; over both tiers ` +
    `${counted("repaired")} crossings repaired inside ${(limit * 1000).toFixed(0)} mm, ` +
    `${counted("beyond the budget")} beyond it, ${counted("absent")} absent, ` +
    `${counted("both rigid")} between rigid parts, ${counted("same surface")} folds of one surface`,
);
fs.writeFileSync(
  `${investigation}/combination-correctives.json`,
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
  // The staged basis already carries the first tier; the in-betweens join it.
  for (const corrective of correctives.slice(firstTier.size)) {
    staged.correctives!.push(corrective);
    for (const surface of staged.surfaces) {
      const mine = targets.get(corrective.id)!.get(surface.id);
      if (mine !== undefined) surface.targets[corrective.id] = mine;
    }
  }
  const was = basis.id;
  staged.id = REVISION;
  fs.writeFileSync(file, gzipSync(`${JSON.stringify(staged)}\n`, { level: 9 }));

  // Everything authored against the basis follows it. The mandible step did
  // not restamp the grooms and skins, so those still read two revisions back;
  // neither seats on anything a corrective or the bone moved, so they are
  // carried forward here and what they read before is recorded.
  const restamp = (path: string, zipped: boolean): Record<string, number> => {
    const raw = zipped
      ? gunzipSync(fs.readFileSync(path)).toString("utf8")
      : fs.readFileSync(path, "utf8");
    const parsed: unknown = JSON.parse(raw);
    const records: { basis?: string }[] = Array.isArray(parsed)
      ? parsed
      : Object.values(parsed as Record<string, { basis?: string }>);
    const read: Record<string, number> = {};
    for (const record of records) {
      read[record.basis ?? "none"] = (read[record.basis ?? "none"] ?? 0) + 1;
      record.basis = REVISION;
    }
    const text = Array.isArray(parsed)
      ? `${JSON.stringify(parsed, null, 2)}\n`
      : `${JSON.stringify(parsed)}\n`;
    fs.writeFileSync(
      path,
      zipped ? gzipSync(text, { level: 9 }) : Buffer.from(text, "utf8"),
    );
    console.log(`  ${path}: ${JSON.stringify(read)} -> ${REVISION}`);
    return read;
  };
  const restamped = {
    subjects: restamp(`${published}/subjects.json`, false),
    grooms: restamp(`${published}/grooms.json.gz`, true),
    skins: restamp(`${published}/skins.json.gz`, true),
  };
  fs.writeFileSync(
    `${published}/pair-corrective-receipt.json`,
    `${JSON.stringify(
      {
        basis: REVISION,
        supersedes: was,
        enumeration: {
          pairs: expected,
          inventingASurfacePair: offending.length,
          shards,
        },
        budgetMillimetres: limit * 1000,
        inBetweenPeak: HALF,
        published: correctives.map((one) => one.id),
        combinations: receipts,
        restamped,
        limits: [
          "A corrective removes a crossing measured on the neutral head; verify-combination-correctives.ts reports what remains on each subject and at the weights the in-betweens were not solved for.",
          "A combination beyond the budget is not published: the basis has no way to say that two channels must not be driven to their extremes together.",
          "A crossing identity alone produces is not on the neutral head and no basis-level field reaches it.",
          "A lip triangle through a skin triangle is one surface folding into itself; push-out between two bodies does not answer it and those pairs are listed as 'same surface'.",
        ],
      },
      null,
      2,
    )}\n`,
  );
  console.log(`published ${REVISION}, succeeding ${was}`);
}
