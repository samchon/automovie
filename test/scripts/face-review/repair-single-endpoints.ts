/** Repair the endpoints that put a surface through a surface on their own.
 *
 * A single channel that already crosses says the shape itself is wrong, and
 * no combination corrective would save it; the census on the neutral head
 * names them: `jawOpen`, `jawLeft`, `jawRight`, `mouthFunnel`, `mouthRollUpper`
 * and `tongueOut` each make a part pair cross that the rest pose does not,
 * almost all of them the oral lining through the mandibular gum block as the
 * jaw swings and one of them the rolled upper lip through the incisors. None
 * is visible from outside and every one is counted, so every one is repaired
 * where it lives: in the endpoint.
 *
 * The procedure is the corrective generator's, aimed at one channel. The
 * neutral head wears the channel at full weight, the part pairs that cross
 * beyond the rest pose are pushed clear by the same standing orders, and the
 * displacement that took is folded into that channel's positive endpoint on
 * each surface, so the channel alone now describes a face whose lining stays
 * outside its own bone. Half weight is measured afterwards and reported,
 * because a repair at the end of a straight line can still cross in the
 * middle of it; nothing is solved there, since an endpoint has no middle.
 *
 * Usage, from the test package:
 *   ttsx -P tsconfig.json --no-plugins scripts/face-review/repair-single-endpoints.ts [--limit mm] [--write]
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
  crossingPairs,
  solveCombination,
  wornFrom,
} from "./solve-combination";

/** The identity this revision publishes under, and the one it succeeds. */
const REVISION = "mpfb-connected-head-2026-09-21-single-repaired";
const SUCCEEDS = "mpfb-connected-head-2026-09-21-jaw-arc";

/** The part a channel makes the agent of its pose. */
const AGENTS: Record<string, string> = {
  tongueOut: "Human.tongue01/Human.tongue01",
};

/**
 * A channel that carries another's whole displacement, and the corrective
 * that cancels the double count when both are driven: `tongueOut` folds
 * `jawOpen` in and `tongueOutJawOpenUnfold` takes it back out. A repair to
 * the carried channel is therefore applied to the carrier and negated in the
 * unfold as well, or the two together would apply the repair twice; and the
 * carrier is solved after that, on the head that already has it, for what
 * remains its own.
 */
const FOLDED: Record<string, { carries: string; unfold: string }> = {
  tongueOut: { carries: "jawOpen", unfold: "tongueOutJawOpenUnfold" },
};

const published = "studies/human-face/connected-basis/global-face";
const file = `${published}/basis.json.gz`;
const basis: IAutoMovieHumanFaceBasis = JSON.parse(
  gunzipSync(fs.readFileSync(file)).toString("utf8"),
);
const limitAt = process.argv.indexOf("--limit");
const limit = limitAt < 0 ? LIMIT : Number(process.argv[limitAt + 1]) / 1000;
if (!Number.isFinite(limit) || limit <= 0)
  throw new Error(
    `--limit wants millimetres, not ${process.argv[limitAt + 1]}`,
  );

const parts: Parts = new Map();
for (const surface of basis.surfaces)
  for (const region of surface.regions)
    parts.set(region.id, { surface: surface.id, indices: region.indices });
/** The basis as the repairs accumulate; each channel is solved on it. */
const next: IAutoMovieHumanFaceBasis = structuredClone(basis);
const wearer = (of: IAutoMovieHumanFaceBasis) => {
  const build = createHumanFaceBasisBuilder(of);
  const model = (expression: Record<string, number>) =>
    build({
      id: "neutral",
      name: "neutral",
      basis: of.id,
      shape: {},
      expression,
    } satisfies IAutoMovieHumanFaceBasisDocument);
  const worn = (expression: Record<string, number>) =>
    wornFrom(
      of,
      new Map(
        model(expression).parts.map((part) => [
          part.id,
          (part.geometry as { type: "mesh"; mesh: IAutoMovieMesh }).mesh,
        ]),
      ),
    );
  return { model, worn };
};
const { model: restModel, worn: restWorn } = wearer(basis);
const atRest = restWorn({});
const rest = crossingPairs(restModel({}));

/** A sparse target read as vertex to displacement, and back. */
const spread = (rows: number[] | undefined): Map<number, number[]> => {
  const out = new Map<number, number[]>();
  for (let i = 0; rows !== undefined && i < rows.length; i += 4)
    out.set(rows[i], [rows[i + 1], rows[i + 2], rows[i + 3]]);
  return out;
};
const gather = (moved: Map<number, number[]>): number[] => {
  const out: number[] = [];
  for (const vertex of [...moved.keys()].sort((a, b) => a - b)) {
    const [x, y, z] = moved.get(vertex)!;
    if (x === 0 && y === 0 && z === 0) continue;
    out.push(vertex, x, y, z);
  }
  return out;
};

console.log(
  `${"channel".padEnd(20)} ${"yields".padEnd(12)} ${"to".padEnd(12)}` +
    ` ${"crossed".padStart(7)} ${"left".padStart(4)} ${"moved".padStart(5)} ${"most".padStart(5)}`,
);
/** Add sparse rows into a surface's named target, or subtract them. */
const foldInto = (
  surface: IAutoMovieHumanFaceBasis["surfaces"][number],
  name: string,
  rows: number[],
  sign: 1 | -1,
): void => {
  const target = spread(surface.targets[name]);
  for (let i = 0; i < rows.length; i += 4) {
    const already = target.get(rows[i]) ?? [0, 0, 0];
    target.set(rows[i], [
      already[0] + sign * rows[i + 1],
      already[1] + sign * rows[i + 2],
      already[2] + sign * rows[i + 3],
    ]);
  }
  surface.targets[name] = gather(target);
};

const receipts: Record<string, unknown>[] = [];
const repaired = new Map<string, Map<string, number[]>>();
for (const channel of basis.channels) {
  if (channel.kind !== "expression") continue;
  // Solved on the head with every earlier repair present, which is what makes
  // a carrier see its carried channel's repair before solving its own.
  const { model, worn } = wearer(next);
  const appeared = [...crossingPairs(model({ [channel.id]: 1 }))]
    .filter((pair) => !rest.has(pair))
    .sort((a, b) => a.localeCompare(b));
  if (appeared.length === 0) continue;
  const agents = new Set(
    AGENTS[channel.id] === undefined ? [] : [AGENTS[channel.id]],
  );
  // One channel alone: whatever it moves, a take-back returns to rest.
  const solved = solveCombination(
    worn({ [channel.id]: 1 }),
    appeared,
    parts,
    atRest,
    limit,
    agents,
    () => atRest,
    atRest,
    (line) => console.log(`${channel.id.padEnd(20)} ${line}`),
  );
  console.log(
    `${"".padEnd(20)} ${(solved.publishable ? "-> folded into " + channel.positive : "-> left as authored").padEnd(46)}` +
      ` crease ${(solved.creaseMetres * 1000).toFixed(2)} mm`,
  );
  if (solved.publishable) {
    repaired.set(channel.id, solved.rows);
    for (const surface of next.surfaces) {
      const mine = solved.rows.get(surface.id);
      if (mine === undefined) continue;
      foldInto(surface, channel.positive, mine, 1);
      for (const [carrier, fold] of Object.entries(FOLDED))
        if (fold.carries === channel.id) {
          const carrying = next.channels.find((one) => one.id === carrier)!;
          foldInto(surface, carrying.positive, mine, 1);
          foldInto(surface, fold.unfold, mine, -1);
        }
    }
  }
  receipts.push({
    channel: channel.id,
    endpoint: channel.positive,
    repaired: solved.publishable,
    movedVertices: solved.movedVertices,
    creaseMillimetres: solved.creaseMetres * 1000,
    crossings: solved.outcomes,
  });
}

// Every repair folded in, then each channel measured again at full and at
// fractions of its weight, so the receipt says what the endpoint does rather
// than what the push reported; and the carrier with its carried channel both
// at full, which is where a repair applied twice would show.
// An endpoint has no middle, but a corrective does: a channel still crossing
// at a fraction of its weight with its endpoint clear gets a single-driver
// in-between there, solved on the head with the earlier ones present,
// peaking at that weight and gone at full and at zero.
// Each in-between spans to its neighbours, so it is whole at its own weight
// and absent at theirs: three quarters fades out at a half and at one, a half
// at a quarter and three quarters, a quarter at zero and a half. Without the
// span, one solved at three quarters fired into a half that had been clear.
const PEAKS: [number, [number, number]][] = [
  [0.5, [0.25, 0.75]],
  [0.25, [0, 0.5]],
  [0.75, [0.5, 1]],
];
for (const [peak, between] of PEAKS) {
  const { model, worn } = wearer(next);
  for (const id of [...repaired.keys()]) {
    const half = { [id]: peak };
    const appeared = [...crossingPairs(model(half))]
      .filter((pair) => !rest.has(pair))
      .sort((a, b) => a.localeCompare(b));
    if (appeared.length === 0) continue;
    const agents = new Set(AGENTS[id] === undefined ? [] : [AGENTS[id]]);
    const solved = solveCombination(
      worn(half),
      appeared,
      parts,
      atRest,
      limit,
      agents,
      () => atRest,
      atRest,
      (line) => console.log(`${`${id} @${peak}`.padEnd(20)} ${line}`),
    );
    const name = `${id}At${String(peak).replace("0.", "")}`;
    console.log(
      `${"".padEnd(20)} ${(solved.publishable ? "-> in-between " + name : `-> left crossing at ${peak}`).padEnd(46)}` +
        ` crease ${(solved.creaseMetres * 1000).toFixed(2)} mm`,
    );
    receipts.push({
      channel: id,
      endpoint: name,
      weights: String(peak),
      repaired: solved.publishable,
      budgetMillimetres: limit * 1000,
      movedVertices: solved.movedVertices,
      creaseMillimetres: solved.creaseMetres * 1000,
      crossings: solved.outcomes,
    });
    if (!solved.publishable) continue;
    next.correctives = [
      ...(next.correctives ?? []),
      {
        id: name,
        inputs: [{ channel: id, side: "positive", peak, between }],
        weight: 1,
        target: name,
      },
    ];
    for (const surface of next.surfaces) {
      const mine = solved.rows.get(surface.id);
      if (mine !== undefined) surface.targets[name] = mine;
    }
  }
}

const { model: afterModel } = wearer(next);
const remaining: Record<string, Record<string, string[]>> = {};
const poses: [string, Record<string, number>][] = [];
for (const id of repaired.keys())
  for (const weight of [1, 0.75, 0.5, 0.25]) poses.push([id, { [id]: weight }]);
for (const [carrier, fold] of Object.entries(FOLDED))
  poses.push([
    `${carrier} + ${fold.carries}`,
    { [carrier]: 1, [fold.carries]: 1 },
  ]);
for (const [id, expression] of poses) {
  remaining[id] ??= {};
  const weight = Object.values(expression).join(",");
  {
    const left = [...crossingPairs(afterModel(expression))].filter(
      (pair) => !rest.has(pair),
    );
    remaining[id][weight] = left;
    console.log(
      `${id.padEnd(20)} after, at ${weight}: ${left.length === 0 ? "clear" : left.join(", ")}`,
    );
  }
}

if (process.argv.includes("--write") === false)
  console.log("dry run; pass --write to publish");
else if (basis.id === REVISION)
  console.log("already published as this revision; nothing to do");
else {
  if (basis.id !== SUCCEEDS)
    throw new Error(
      `this step succeeds ${SUCCEEDS}, but the basis reads ${basis.id}`,
    );
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
    `${published}/single-repair-receipt.json`,
    `${JSON.stringify(
      {
        basis: REVISION,
        supersedes: was,
        budgetMillimetres: limit * 1000,
        channels: receipts,
        remaining,
        limits: [
          "An endpoint is repaired at full weight; a channel still crossing at a fraction of its weight is reported here and is the linear endpoint's own middle, which no endpoint edit reaches.",
          "The repair is a field on the neutral head; a subject's own lining may still cross its own bone, which the subject verification reports.",
        ],
      },
      null,
      2,
    )}\n`,
  );
  console.log(`published ${REVISION}, succeeding ${was}`);
}
