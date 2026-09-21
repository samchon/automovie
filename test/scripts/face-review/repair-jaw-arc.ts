/** Put a part-open jaw on the arc it turns through, not on the chord.
 *
 * `jawOpen`'s endpoint is a rigid screw of the mandible, 21.155 degrees about
 * an axis through the condyles, since `rigidify-jaw-open.ts`. An endpoint is
 * interpolated linearly, so at half weight every vertex on that mandible sits
 * at the midpoint of its chord and not on its arc: 1.16 mm inside the arc at
 * half open, and every soft part that rides the jaw -- the lower lip carries
 * all of it, the chin more -- is short by its share of the same. That is the
 * defect `measure-jaw-hinge.ts` measured and left to "the joint".
 *
 * Two things are done here, in order.
 *
 * First, the jaw that `tongueOut` carries is made the same bone. The whole of
 * `jawOpen` was folded into `tongueOut` before the mandible was rigidified,
 * and the rigidifying rewrote `jawOpen` alone, so a tongue out on its own
 * still kneads the arch by the 2.3 mm the old endpoint did. The arch rows of
 * the fold are replaced by the screw, and the unfold corrective that cancels
 * the double count at `(tongueOut, jawOpen)` is replaced with it, so the sum
 * at every corner stays what it was.
 *
 * Second, the arc. The contract already has what a joint needs for this: a
 * corrective driven by a channel at a fraction of its weight, whole there and
 * gone at the neighbouring fractions (`peak` and `between`). The gap between
 * arc and chord is a bump, zero at both ends and largest in the middle, so
 * in-betweens on a grid of quarters carry it exactly at the grid and as a tent
 * between. Two channels carry the jaw, and together they open it by
 * `1 - (1 - w_j)(1 - w_t)` -- which is what the unfold makes of them -- so the
 * in-betweens are a grid over both: a corrective at each node of
 * `{0, ¼, ½, ¾, 1}²` holding what the arc at that node's opening misses, less
 * what the nodes beneath it already give. At a node exactly its own
 * correctives fire and no other; between nodes the tents interpolate, and
 * how far off the arc that leaves the arch is measured below and reported.
 *
 * Which vertices, and by how much, is read from the asset rather than named.
 * Every vertex of every surface has the displacement the screw would give it;
 * how much of that a channel's endpoint actually gives it is the projection
 * of the endpoint's displacement onto the screw's, clipped to [0, 1]: one on
 * the arch and the lower lip, nothing on the brow. A channel is a carrier of
 * the jaw only when its arch moves as that fraction of the screw with next to
 * nothing left over; a channel whose arch does not move, or moves some other
 * way (`jawLeft` slides, and a slide is straight), is left alone.
 *
 * What it does not do. A subject's identity has moved the arch before the
 * screw is applied, so `(I - R) S` survives on every subject as
 * `mandible-receipt.json` reports; that is a posed pivot's to fix, which no
 * field on the neutral head reaches.
 *
 * Usage, from the test package:
 *   ttsx -P tsconfig.json --no-plugins scripts/face-review/repair-jaw-arc.ts [--write]
 */
import {
  type IAutoMovieHumanFaceBasis,
  type IAutoMovieHumanFaceBasisDocument,
  createHumanFaceBasisBuilder,
} from "@automovie/human";
import type { IAutoMovieMesh } from "@automovie/interface";
import fs from "node:fs";
import { gunzipSync, gzipSync } from "node:zlib";

import { rigid, screwOf } from "./rigid";
import { wornFrom } from "./solve-combination";

/** The identity this revision publishes under, and the one it succeeds. */
const REVISION = "mpfb-connected-head-2026-09-21-jaw-arc";
const SUCCEEDS = "mpfb-connected-head-2026-09-20-rigid-mandible";

/** The one surface that is bone, and the channel that turns it. */
const BONE = "Human.teeth_base";
const OPEN = "jawOpen";
/** Channels that carry a fold of `jawOpen`, and the corrective that unfolds it. */
const FOLDED: Record<string, string> = { tongueOut: "tongueOutJawOpenUnfold" };

/** The grid a carrier's weight is sampled on; each node spans to its neighbours. */
const STEPS = [0.25, 0.5, 0.75, 1];
const SPAN = 0.25;
/**
 * A channel carries the jaw when its arch moves as one fraction of the screw
 * with this little left over, relative to how far the arch moved.
 */
const CARRIER_RESIDUAL = 0.01;
/** Below this fraction of the screw the arch has not moved with the jaw. */
const CARRIER_FRACTION = 0.02;
/** A row smaller than this, in metres, is not written. */
const ROW_FLOOR = 1e-5;
/** Rows are written to the micrometre, like every other corrective here. */
const ROUND = 1e6;

const published = "studies/human-face/connected-basis/global-face";
const file = `${published}/basis.json.gz`;
const basis: IAutoMovieHumanFaceBasis = JSON.parse(
  gunzipSync(fs.readFileSync(file)).toString("utf8"),
);
const next = structuredClone(basis);

const bone = next.surfaces.find((one) => one.id === BONE);
if (bone === undefined) throw new Error(`this basis has no ${BONE}`);
const jaw = next.channels.find((one) => one.id === OPEN);
if (jaw === undefined || jaw.positive === null)
  throw new Error(`this basis has no ${OPEN} with a positive endpoint`);
const openRows = bone.targets[jaw.positive];
if (openRows === undefined || openRows.length === 0)
  throw new Error(`${OPEN} does not move ${BONE}`);

// The screw, read off the arch exactly as it was written there.
const arch: number[] = [];
const opened = [...bone.positions];
for (let i = 0; i < openRows.length; i += 4) {
  arch.push(openRows[i]);
  for (let k = 0; k < 3; k++)
    opened[openRows[i] * 3 + k] += openRows[i + 1 + k];
}
const hinge = rigid(bone.positions, opened, arch);
if (hinge.rms > 1e-6)
  throw new Error(
    `${OPEN} is not rigid on the arch (${(hinge.rms * 1000).toFixed(3)} mm); rigidify it first`,
  );
const screw = screwOf(hinge.turn, hinge.apply([0, 0, 0]));
console.log(
  `${OPEN}: ${screw.degrees.toFixed(3)} degrees about [${screw.axis.map((one) => one.toFixed(4)).join(", ")}]` +
    ` through [${screw.pivot.map((one) => one.toFixed(4)).join(", ")}] m, slide ${(screw.slide * 1000).toFixed(3)} mm`,
);

/** The screw's own displacement of a rest point, at a fraction of its angle. */
const swing = (point: number[], fraction: number): number[] => {
  const spun = screw.at(fraction)(point);
  return [spun[0] - point[0], spun[1] - point[1], spun[2] - point[2]];
};
const pointOf = (positions: number[], vertex: number) =>
  positions.slice(vertex * 3, vertex * 3 + 3);
const rowsToMap = (rows: number[] | undefined): Map<number, number[]> => {
  const map = new Map<number, number[]>();
  if (rows !== undefined)
    for (let i = 0; i < rows.length; i += 4)
      map.set(rows[i], [rows[i + 1], rows[i + 2], rows[i + 3]]);
  return map;
};
const mapToRows = (map: Map<number, number[]>): number[] => {
  const rows: number[] = [];
  for (const [vertex, delta] of [...map].sort((a, b) => a[0] - b[0]))
    if (delta.some((one) => one !== 0)) rows.push(vertex, ...delta);
  return rows;
};

// First: the fold. What a folded channel gives the arch beyond the jaw it
// carries is its own; that is kept, and the jaw it carries becomes the screw.
const refolded: Record<string, unknown>[] = [];
for (const [carrier, unfold] of Object.entries(FOLDED)) {
  const channel = next.channels.find((one) => one.id === carrier);
  if (channel === undefined || channel.positive === null)
    throw new Error(`this basis has no ${carrier} with a positive endpoint`);
  const negation = next.correctives?.find((one) => one.id === unfold);
  if (negation === undefined)
    throw new Error(`this basis has no ${unfold} corrective`);
  const folded = rowsToMap(bone.targets[channel.positive]);
  const unfolded = rowsToMap(bone.targets[negation.target]);
  let own = 0;
  let kneaded = 0;
  for (const vertex of arch) {
    const point = pointOf(bone.positions, vertex);
    const was = folded.get(vertex) ?? [0, 0, 0];
    const undo = unfolded.get(vertex) ?? [0, 0, 0];
    // The fold less its negation is the channel's own motion of the arch.
    const self = [0, 1, 2].map((k) => was[k] + undo[k]);
    own = Math.max(own, Math.hypot(self[0], self[1], self[2]));
    const turned = swing(point, 1);
    kneaded += [0, 1, 2].reduce(
      (sum, k) => sum + (-undo[k] - turned[k]) ** 2,
      0,
    );
    folded.set(
      vertex,
      [0, 1, 2].map((k) => Math.round((self[k] + turned[k]) * ROUND) / ROUND),
    );
    unfolded.set(
      vertex,
      [0, 1, 2].map((k) => Math.round(-turned[k] * ROUND) / ROUND),
    );
  }
  bone.targets[channel.positive] = mapToRows(folded);
  bone.targets[negation.target] = mapToRows(unfolded);
  const kneadedRms = Math.sqrt(kneaded / arch.length);
  console.log(
    `${carrier}: the jaw it carries kneaded the arch by ${(kneadedRms * 1000).toFixed(3)} mm rms;` +
      ` the arch is now the screw, and ${unfold} its negative (its own motion of the arch was ${(own * 1000).toFixed(3)} mm at most)`,
  );
  refolded.push({
    channel: carrier,
    unfold,
    kneadedMillimetresRms: kneadedRms * 1000,
    ownArchMotionMillimetres: own * 1000,
  });
}

/**
 * How much of the screw a target gives each vertex of a surface: the
 * projection of the target's displacement onto the screw's, clipped to [0, 1].
 * A vertex the target does not move carries nothing.
 */
const carryOf = (positions: number[], rows: number[]): Map<number, number> => {
  const carry = new Map<number, number>();
  for (let i = 0; i < rows.length; i += 4) {
    const vertex = rows[i];
    const full = swing(pointOf(positions, vertex), 1);
    const size = full[0] ** 2 + full[1] ** 2 + full[2] ** 2;
    if (size < 1e-12) continue;
    const along =
      (rows[i + 1] * full[0] + rows[i + 2] * full[1] + rows[i + 3] * full[2]) /
      size;
    if (along > 0) carry.set(vertex, Math.min(1, along));
  }
  return carry;
};

// Which channels carry the jaw at all is decided on the arch: the fraction of
// the screw it moved as, and how much of its motion that fraction leaves over.
type Side = "positive" | "negative";
interface ICarrier {
  channel: string;
  side: Side;
  target: string;
  fraction: number;
  leftover: number;
}
const carriers: ICarrier[] = [];
for (const channel of next.channels)
  for (const side of ["positive", "negative"] as const) {
    const target = channel[side];
    if (target === null) continue;
    const rows = bone.targets[target];
    if (rows === undefined || rows.length === 0) continue;
    const carry = carryOf(bone.positions, rows);
    const onArch = arch.filter((vertex) => carry.has(vertex));
    if (onArch.length < arch.length / 2) continue;
    let fraction = 0;
    for (const vertex of onArch) fraction += carry.get(vertex)!;
    fraction /= onArch.length;
    if (fraction < CARRIER_FRACTION) continue;
    const moved = rowsToMap(rows);
    let over = 0;
    let total = 0;
    for (const vertex of arch) {
      const full = swing(pointOf(bone.positions, vertex), 1);
      const was = moved.get(vertex) ?? [0, 0, 0];
      for (let k = 0; k < 3; k++) {
        over += (was[k] - fraction * full[k]) ** 2;
        total += was[k] ** 2;
      }
    }
    const leftover = Math.sqrt(over / total);
    console.log(
      `  ${channel.id.padEnd(22)} ${side.padEnd(8)} arch carries ${(fraction * 100).toFixed(1).padStart(5)}% of the screw,` +
        ` ${(leftover * 100).toFixed(1)}% left over${leftover > CARRIER_RESIDUAL ? "   NOT A CARRIER" : ""}`,
    );
    if (leftover <= CARRIER_RESIDUAL)
      carriers.push({ channel: channel.id, side, target, fraction, leftover });
  }
if (carriers.length === 0) throw new Error("no channel carries the jaw");

// How much of the jaw each vertex rides, read off `jawOpen` itself: one on
// the arch, one on the lower lip, a fraction on the tongue's root, nothing on
// the brow. A vertex that rides the jaw by `f` sits at `f` of the way from
// its rest to where the screw would put it, so its share of the arc's bump is
// `f` of the arch's; the endpoint at full weight is the author's and is kept.
const share = new Map<string, Map<number, number>>();
for (const surface of next.surfaces) {
  const rows = surface.targets[jaw.positive];
  if (rows !== undefined && rows.length > 0)
    share.set(surface.id, carryOf(surface.positions, rows));
}

// Second: the grid. A node is one weight per carrier; the opening the carriers
// make together is `1 - prod(1 - w F)` with `F` each carrier's fraction of
// the screw on the arch, and the row is the vertex's share of the arc there
// less the chord there, less what the nodes beneath it (the same node with
// some carriers at zero) already give.
type Node = number[];
const nodes: Node[] = [];
const grow = (prefix: number[]): void => {
  if (prefix.length === carriers.length) {
    if (prefix.some((one) => one > 0)) nodes.push(prefix);
    return;
  }
  for (const weight of [0, ...STEPS]) grow([...prefix, weight]);
};
grow([]);
nodes.sort(
  (a, b) =>
    a.filter((one) => one > 0).length - b.filter((one) => one > 0).length,
);
const spell = (weight: number) => String(weight).replace("0.", "");
const capital = (id: string) => id[0].toUpperCase() + id.slice(1);
const nameOf = (node: Node): string => {
  const live = carriers.flatMap((carrier, at) =>
    node[at] > 0
      ? [
          `${carrier.channel}${carrier.side === "negative" ? "Negative" : ""}At${spell(node[at])}`,
        ]
      : [],
  );
  return live.length === 1
    ? live[0].replace("At", "ArcAt")
    : live.map((one, at) => (at === 0 ? one : capital(one))).join("") + "Arc";
};
const beneath = (node: Node): Node[] => {
  const found: Node[] = [];
  const live = node.flatMap((one, at) => (one > 0 ? [at] : []));
  for (let mask = 1; mask < (1 << live.length) - 1; mask++)
    found.push(
      node.map((one, at) => {
        const bit = live.indexOf(at);
        return bit >= 0 && (mask & (1 << bit)) !== 0 ? one : 0;
      }),
    );
  return found;
};

type Corrective = NonNullable<IAutoMovieHumanFaceBasis["correctives"]>[number];
const correctives: Corrective[] = [];
const targets = new Map<string, Map<string, number[]>>();
const rowsOf = new Map<string, Map<string, Map<number, number[]>>>();
const receipts: Record<string, unknown>[] = [];
for (const node of nodes) {
  const id = nameOf(node);
  const under = beneath(node).map((one) => rowsOf.get(nameOf(one)));
  const mine = new Map<string, Map<number, number[]>>();
  const rows = new Map<string, number[]>();
  let vertices = 0;
  let most = 0;
  for (const surface of next.surfaces) {
    const rides = share.get(surface.id);
    if (rides === undefined) continue;
    let closed = 1;
    carriers.forEach((carrier, at) => {
      closed *= 1 - node[at] * carrier.fraction;
    });
    const opening = 1 - closed;
    const out = new Map<number, number[]>();
    for (const [vertex, fraction] of rides) {
      const point = pointOf(surface.positions, vertex);
      const arc = swing(point, opening);
      const chord = swing(point, 1).map((one) => one * opening);
      const row = [0, 1, 2].map((k) => fraction * (arc[k] - chord[k]));
      for (const below of under) {
        const given = below?.get(surface.id)?.get(vertex);
        if (given !== undefined) for (let k = 0; k < 3; k++) row[k] -= given[k];
      }
      const rounded = row.map((one) => Math.round(one * ROUND) / ROUND);
      const size = Math.hypot(rounded[0], rounded[1], rounded[2]);
      if (size < ROW_FLOOR) continue;
      out.set(vertex, rounded);
      most = Math.max(most, size);
      vertices++;
    }
    if (out.size > 0) {
      mine.set(surface.id, out);
      rows.set(surface.id, mapToRows(out));
    }
  }
  if (vertices === 0) continue;
  rowsOf.set(id, mine);
  correctives.push({
    id,
    inputs: carriers.flatMap((carrier, at) =>
      node[at] > 0
        ? [
            {
              channel: carrier.channel,
              side: carrier.side,
              peak: node[at],
              between: [node[at] - SPAN, Math.min(1, node[at] + SPAN)] as [
                number,
                number,
              ],
            },
          ]
        : [],
    ),
    weight: 1,
    target: id,
  });
  targets.set(id, rows);
  receipts.push({
    corrective: id,
    node: Object.fromEntries(
      carriers.flatMap((carrier, at) =>
        node[at] > 0 ? [[carrier.channel, node[at]]] : [],
      ),
    ),
    vertices,
    surfaces: [...rows.keys()],
    mostMillimetres: most * 1000,
  });
  console.log(
    `  ${id.padEnd(34)} ${String(vertices).padStart(6)} vertices over ${rows.size} surfaces, most ${(most * 1000).toFixed(3)} mm`,
  );
}
next.correctives = [...(next.correctives ?? []), ...correctives];
for (const surface of next.surfaces)
  for (const [id, rows] of targets) {
    const mine = rows.get(surface.id);
    if (mine !== undefined) surface.targets[id] = mine;
  }

// Measured, not assumed: the arch at a fine grid over the carriers, against
// the exact screw at the opening the carriers make, before and after.
const archOf = (
  which: IAutoMovieHumanFaceBasis,
  expression: Record<string, number>,
): number[] => {
  const model = createHumanFaceBasisBuilder(which)({
    id: "neutral",
    name: "neutral",
    basis: which.id,
    shape: {},
    expression,
  } satisfies IAutoMovieHumanFaceBasisDocument);
  return wornFrom(
    which,
    new Map(
      model.parts.map((part) => [
        part.id,
        (part.geometry as { type: "mesh"; mesh: IAutoMovieMesh }).mesh,
      ]),
    ),
  ).get(BONE)!.positions;
};
const offArc = (positions: number[], opening: number): number => {
  let worst = 0;
  for (const vertex of arch) {
    const point = pointOf(bone.positions, vertex);
    const exact = screw.at(opening)(point);
    worst = Math.max(
      worst,
      Math.hypot(
        positions[vertex * 3] - exact[0],
        positions[vertex * 3 + 1] - exact[1],
        positions[vertex * 3 + 2] - exact[2],
      ),
    );
  }
  return worst * 1000;
};
const fine: {
  expression: Record<string, number>;
  before: number;
  after: number;
}[] = [];
const sample = (expression: Record<string, number>): void => {
  let closed = 1;
  for (const carrier of carriers)
    closed *= 1 - (expression[carrier.channel] ?? 0) * carrier.fraction;
  fine.push({
    expression,
    before: offArc(archOf(basis, expression), 1 - closed),
    after: offArc(archOf(next, expression), 1 - closed),
  });
};
for (const carrier of carriers)
  for (let step = 1; step < 20; step++)
    sample({ [carrier.channel]: step / 20 });
if (carriers.length === 2)
  for (let a = 1; a < 8; a++)
    for (let b = 1; b < 8; b++)
      sample({ [carriers[0].channel]: a / 8, [carriers[1].channel]: b / 8 });
console.log(
  `\n${"pose".padEnd(40)} ${"before".padStart(9)} ${"after".padStart(9)}   worst arch vertex off the screw, mm`,
);
for (const one of fine)
  if (Object.keys(one.expression).length === 1 || one.after > 0.05)
    console.log(
      `${Object.entries(one.expression)
        .map(([c, w]) => `${c}@${w.toFixed(3)}`)
        .join(" + ")
        .padEnd(
          40,
        )} ${one.before.toFixed(3).padStart(9)} ${one.after.toFixed(3).padStart(9)}`,
    );
const worstBefore = Math.max(...fine.map((one) => one.before));
const worstAfter = Math.max(...fine.map((one) => one.after));
console.log(
  `\n${correctives.length} correctives over ${carriers.length} carriers; the arch was off its screw by ${worstBefore.toFixed(3)} mm at worst, ${worstAfter.toFixed(3)} mm with them`,
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
    `${published}/jaw-arc-receipt.json`,
    `${JSON.stringify(
      {
        basis: REVISION,
        supersedes: was,
        screw: {
          axis: screw.axis,
          pivotMetres: screw.pivot,
          slideMetres: screw.slide,
          degrees: screw.degrees,
        },
        refolded,
        carriers,
        grid: STEPS,
        published: receipts,
        archOffScrewMillimetres: {
          worstBefore,
          worstAfter,
          samples: fine,
        },
        limits: [
          "The in-betweens are exact at the grid nodes and tents between them; between nodes the arch is off the screw by what the samples report, not by nothing.",
          "The carriers open the jaw by 1 - (1 - w_j)(1 - w_t), which is what the unfold corrective makes of them; a third carrier would need the grid to grow.",
          "A subject's identity moves the arch before the screw is applied, so (I - R) S survives per subject as mandible-receipt.json reports; only a posed pivot reaches it.",
        ],
      },
      null,
      2,
    )}\n`,
  );
  console.log(`published ${REVISION}, succeeding ${was}`);
}
