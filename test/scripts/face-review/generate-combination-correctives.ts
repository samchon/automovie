/** Author the missing correctives by solving them, not by noticing them.
 *
 * The enumeration of all 1326 expression pairs says thirty-eight combinations
 * put a surface through a surface that neither side puts it through, and the
 * basis carries two correctives against them. Writing the other thirty-six by
 * hand would be the same reactive method that produced the first two, one
 * pose at a time, with no statement of when the list ends. The list already
 * ends; what is missing is a procedure that answers every item of it the same
 * way.
 *
 * The procedure. A combination's pose is built on the neutral head, because a
 * corrective endpoint is a displacement field on the basis and not on a
 * subject. The surfaces that cross are found. One of them yields -- which one
 * is not a judgement call but a standing order, below -- and its crossed
 * vertices are pushed to the far side of the surface they have entered, plus a
 * clearance. The push is then relaxed over the surface so that what results is
 * a soft tissue moving, not a dent: a lip that clears the teeth by denting
 * itself around one incisor has not been corrected, it has been damaged.
 * Pushing and relaxing alternate until nothing crosses or the budget runs out,
 * and a pair that runs out is reported unsolved rather than published.
 *
 * Which surface yields, and why. Bone does not deform, so teeth never move and
 * whatever they are inside of does. Between two soft surfaces the one that is
 * enclosed yields, because a tongue is in a mouth and lips are not in a tongue.
 * Hair-like surfaces yield to skin for the same reason a brow sits on a face.
 *
 * What this cannot do, and says so. The pose is neutral, so a corrective it
 * writes is checked against every subject afterwards and the ones it fails to
 * clear are named. And a corrective is a repair, not an acceptance: it removes
 * a measured crossing and says nothing about whether the face is one somebody
 * would make.
 *
 * Usage, from the test package:
 *   ttsx -P tsconfig.json --no-plugins scripts/face-review/generate-combination-correctives.ts [--pairs N] [--write]
 */
import { measureAutoMovieMeshCrossings } from "@automovie/engine";
import type { IAutoMovieMesh } from "@automovie/interface";
import {
  type IAutoMovieHumanFaceBasis,
  type IAutoMovieHumanFaceBasisDocument,
  createHumanFaceBasisBuilder,
} from "@automovie/human";
import fs from "node:fs";
import { gunzipSync } from "node:zlib";

/** Which surface gives way, lowest first: bone never, then skin, then the rest. */
const YIELDS = [
  "Human.teeth_base/Human.teeth_base",
  "Human/skin",
  "Human/lips",
  "Human.eyebrow001/Human.eyebrow001",
  "Human.eyelashes01/Human.eyelashes01",
  "Human.tongue01/Human.tongue01",
];

/** How far past the surface it entered a pushed vertex is put, in metres. */
const CLEARANCE = 0.0005;
/** Rounds of pushing and relaxing before a pair is called unsolved. */
const ROUNDS = 24;
/**
 * The most a corrective may move any vertex, in metres.
 *
 * Without it the solver clears everything and means nothing: told to keep
 * pushing until the triangles part, it threw a lip 38 mm and a tongue 178 mm,
 * which clears the crossing and destroys the face. A corrective is a repair of
 * a pose, and a repair that has to move a lip four centimetres is not saying
 * the lip is wrong. It is saying the pose is. So the budget is what soft tissue
 * over a dental arch actually has to give -- a few millimetres -- and a
 * combination that cannot be repaired inside it is reported as a pose the rig
 * should not have been asked for, rather than published as a corrective.
 */
const LIMIT = 0.003;
/** How much of a pushed vertex's motion its neighbours take on, per round. */
const RELAX = 0.5;
/** Rounds of relaxation after each push. */
const SMOOTHING = 6;

const published = "studies/human-face/connected-basis/global-face";
const basis: IAutoMovieHumanFaceBasis = JSON.parse(
  gunzipSync(fs.readFileSync(`${published}/basis.json.gz`)).toString("utf8"),
);
const documents: IAutoMovieHumanFaceBasisDocument[] = JSON.parse(
  fs.readFileSync(`${published}/subjects.json`, "utf8"),
);
const found = JSON.parse(
  fs.readFileSync(
    "../.shots/human-2469/investigation-2498/expression-pairs.json",
    "utf8",
  ),
) as Record<
  string,
  { all: { pair: string; interaction: number; appeared: string[] }[] }
>;

const offending = Object.values(found)[0]
  .all.filter((one) => one.appeared.length > 0)
  .sort((a, b) => b.interaction - a.interaction);
// `indexOf` gives -1 when the flag is absent, and argv[0] is the interpreter,
// so reading argv[index + 1] without checking turns "all of them" into NaN and
// the whole run into nothing. It did, once, silently.
const asked = process.argv.indexOf("--pairs");
const budget =
  asked < 0 ? offending.length : Number(process.argv[asked + 1] ?? offending.length);
if (!Number.isFinite(budget) || budget <= 0)
  throw new Error(`--pairs wants a count, not ${process.argv[asked + 1]}`);
console.log(
  `${offending.length} combinations invent a crossing; ` +
    `${Math.min(budget, offending.length)} to be solved`,
);

const build = createHumanFaceBasisBuilder(basis);
/** The neutral head wearing one expression, as part id to mesh. */
const wearing = (expression: Record<string, number>) => {
  const blank: IAutoMovieHumanFaceBasisDocument = {
    ...documents[0],
    shape: {},
    expression,
    hair: undefined,
  };
  const parts = new Map<string, IAutoMovieMesh>();
  for (const part of build(blank).parts)
    if (part.geometry.type === "mesh") parts.set(part.id, part.geometry.mesh);
  return parts;
};

const triangles = (mesh: IAutoMovieMesh): number[] =>
  mesh.indices ?? [...new Array(mesh.positions.length / 3).keys()];

/** Vertices of `mesh` that take part in a triangle crossing `into`. */
const crossedVertices = (mesh: IAutoMovieMesh, into: IAutoMovieMesh): Set<number> => {
  const rows = triangles(mesh);
  const hit = new Set<number>();
  for (const crossing of measureAutoMovieMeshCrossings(mesh, into))
    for (let corner = 0; corner < 3; corner++)
      hit.add(rows[crossing.triangle * 3 + corner]);
  return hit;
};

/** The neighbours of each vertex, over a mesh's own triangles. */
const neighboursOf = (mesh: IAutoMovieMesh): Set<number>[] => {
  const rows = triangles(mesh);
  const near: Set<number>[] = [...new Array(mesh.positions.length / 3)].map(
    () => new Set<number>(),
  );
  for (let at = 0; at + 2 < rows.length; at += 3)
    for (let corner = 0; corner < 3; corner++) {
      const here = rows[at + corner];
      near[here].add(rows[at + ((corner + 1) % 3)]);
      near[here].add(rows[at + ((corner + 2) % 3)]);
    }
  return near;
};

/** Closest point to `point` inside triangle `abc`, by Ericson's region test. */
const closestInTriangle = (
  point: number[],
  a: number[],
  b: number[],
  c: number[],
): number[] => {
  const sub = (x: number[], y: number[]) => [x[0] - y[0], x[1] - y[1], x[2] - y[2]];
  const dot = (x: number[], y: number[]) => x[0] * y[0] + x[1] * y[1] + x[2] * y[2];
  const mix = (x: number[], y: number[], t: number) =>
    [0, 1, 2].map((k) => x[k] + (y[k] - x[k]) * t);
  const ab = sub(b, a);
  const ac = sub(c, a);
  const ap = sub(point, a);
  const d1 = dot(ab, ap);
  const d2 = dot(ac, ap);
  if (d1 <= 0 && d2 <= 0) return a;
  const bp = sub(point, b);
  const d3 = dot(ab, bp);
  const d4 = dot(ac, bp);
  if (d3 >= 0 && d4 <= d3) return b;
  const vc = d1 * d4 - d3 * d2;
  if (vc <= 0 && d1 >= 0 && d3 <= 0) return mix(a, b, d1 / (d1 - d3));
  const cp = sub(point, c);
  const d5 = dot(ab, cp);
  const d6 = dot(ac, cp);
  if (d6 >= 0 && d5 <= d6) return c;
  const vb = d5 * d2 - d1 * d6;
  if (vb <= 0 && d2 >= 0 && d6 <= 0) return mix(a, c, d2 / (d2 - d6));
  const va = d3 * d6 - d5 * d4;
  if (va <= 0 && d4 - d3 >= 0 && d5 - d6 >= 0)
    return mix(b, c, (d4 - d3) / (d4 - d3 + (d5 - d6)));
  const denominator = va + vb + vc;
  return [0, 1, 2].map(
    (k) => a[k] + (ab[k] * vb) / denominator + (ac[k] * vc) / denominator,
  );
};

/**
 * A mesh's triangles in a uniform grid, with their planes, for nearest queries.
 *
 * Projecting onto the nearest *vertex* was tried first and does not converge:
 * a dental arch is coarse enough that its nearest vertex can be millimetres
 * from its nearest surface, so a lip pushed to a vertex is still inside the
 * tooth. The nearest point on the nearest triangle is where a surface is.
 */
const gridOf = (mesh: IAutoMovieMesh) => {
  const rows = triangles(mesh);
  const corners: number[][][] = [];
  const planes: number[][] = [];
  let span = 0;
  for (let at = 0; at + 2 < rows.length; at += 3) {
    const triangle = [rows[at], rows[at + 1], rows[at + 2]].map((row) =>
      [0, 1, 2].map((k) => mesh.positions[row * 3 + k]),
    );
    corners.push(triangle);
    const u = [0, 1, 2].map((k) => triangle[1][k] - triangle[0][k]);
    const v = [0, 1, 2].map((k) => triangle[2][k] - triangle[0][k]);
    const cross = [
      u[1] * v[2] - u[2] * v[1],
      u[2] * v[0] - u[0] * v[2],
      u[0] * v[1] - u[1] * v[0],
    ];
    const size = Math.hypot(cross[0], cross[1], cross[2]);
    planes.push(size > 0 ? cross.map((one) => one / size) : [0, 0, 1]);
    span += Math.max(
      ...[0, 1, 2].map(
        (k) =>
          Math.max(triangle[0][k], triangle[1][k], triangle[2][k]) -
          Math.min(triangle[0][k], triangle[1][k], triangle[2][k]),
      ),
    );
  }
  const cell = Math.max(span / Math.max(corners.length, 1), 1e-6);
  const key = (x: number, y: number, z: number) => `${x},${y},${z}`;
  const of = (point: number[]) =>
    point.map((one) => Math.floor(one / cell)) as [number, number, number];
  const grid = new Map<string, number[]>();
  for (const [index, triangle] of corners.entries()) {
    const low = of([0, 1, 2].map((k) => Math.min(...triangle.map((p) => p[k]))));
    const high = of([0, 1, 2].map((k) => Math.max(...triangle.map((p) => p[k]))));
    for (let x = low[0]; x <= high[0]; x++)
      for (let y = low[1]; y <= high[1]; y++)
        for (let z = low[2]; z <= high[2]; z++) {
          const at = key(x, y, z);
          const bucket = grid.get(at);
          if (bucket === undefined) grid.set(at, [index]);
          else bucket.push(index);
        }
  }

  /** The nearest surface point, its outward normal, and the signed distance. */
  return (point: number[]): { at: number[]; normal: number[]; away: number } => {
    const middle = of(point);
    let best = 0;
    let bestPoint = corners[0][0];
    let nearest = Infinity;
    for (let reach = 1; reach <= 6; reach++) {
      for (let x = middle[0] - reach; x <= middle[0] + reach; x++)
        for (let y = middle[1] - reach; y <= middle[1] + reach; y++)
          for (let z = middle[2] - reach; z <= middle[2] + reach; z++)
            for (const index of grid.get(key(x, y, z)) ?? []) {
              const on = closestInTriangle(point, ...(corners[index] as [number[], number[], number[]]));
              const apart =
                (on[0] - point[0]) ** 2 +
                (on[1] - point[1]) ** 2 +
                (on[2] - point[2]) ** 2;
              if (apart < nearest) {
                nearest = apart;
                best = index;
                bestPoint = on;
              }
            }
      // One ring past the first hit, so a nearer triangle in the next cell is
      // not missed by stopping at the first cell that had anything in it.
      if (nearest < Infinity && Math.sqrt(nearest) < cell * (reach - 1)) break;
    }
    const normal = planes[best];
    return {
      at: bestPoint,
      normal,
      away: [0, 1, 2].reduce(
        (total, k) => total + (point[k] - bestPoint[k]) * normal[k],
        0,
      ),
    };
  };
};

/**
 * Move `mesh` out of `into`, and report the displacement it took.
 *
 * Push and relax alternate. The push puts every crossed vertex on the far side
 * of the surface it has entered, plus a clearance; the relax spreads that over
 * the neighbourhood so the result is a surface moving rather than a row of
 * vertices yanked past their neighbours. Only vertices the push has touched,
 * and their neighbours, take part: a lip that clears the teeth by moving the
 * whole lip is not a corrective, it is a different lip.
 */
const pushOut = (
  mesh: IAutoMovieMesh,
  into: IAutoMovieMesh,
): { moved: Map<number, number[]>; crossings: number[]; solved: boolean } => {
  const nearestOn = gridOf(into);
  const near = neighboursOf(mesh);
  const working: IAutoMovieMesh = { ...mesh, positions: [...mesh.positions] };
  const crossings: number[] = [];
  let solved = false;
  for (let round = 0; round < ROUNDS; round++) {
    const hit = crossedVertices(working, into);
    crossings.push(hit.size);
    if (hit.size === 0) {
      solved = true;
      break;
    }
    const touched = new Set<number>(hit);
    for (const row of hit) {
      const point = [0, 1, 2].map((k) => working.positions[row * 3 + k]);
      const { at, normal, away } = nearestOn(point);
      // A vertex already outside can still belong to a triangle that crosses:
      // three corners clear of a tooth say nothing about the face between them
      // passing through it. Projecting such a vertex to the surface would move
      // it backwards, so it is carried further out instead, a clearance at a
      // time, until its triangle has nothing left to cross. That plateau at 87
      // vertices was exactly this -- every one of them was already outside,
      // every push was skipped, and the count stopped falling.
      const outward = Math.max(away, 0) + CLEARANCE * (round + 1);
      for (let k = 0; k < 3; k++)
        working.positions[row * 3 + k] = at[k] + normal[k] * outward;
      // Never past the budget, measured from where the vertex started.
      const moved = [0, 1, 2].map(
        (k) => working.positions[row * 3 + k] - mesh.positions[row * 3 + k],
      );
      const far = Math.hypot(moved[0], moved[1], moved[2]);
      if (far > LIMIT)
        for (let k = 0; k < 3; k++)
          working.positions[row * 3 + k] =
            mesh.positions[row * 3 + k] + (moved[k] / far) * LIMIT;
      for (const neighbour of near[row]) touched.add(neighbour);
    }
    for (let sweep = 0; sweep < SMOOTHING; sweep++) {
      const before = [...working.positions];
      for (const row of touched) {
        if (hit.has(row)) continue;
        // Relaxation is bounded too, or the neighbours carry the budget past
        // itself one ring at a time.
        const around = near[row];
        if (around.size === 0) continue;
        const middle = [0, 0, 0];
        for (const neighbour of around)
          for (let k = 0; k < 3; k++) middle[k] += before[neighbour * 3 + k];
        const blended = [0, 1, 2].map(
          (k) =>
            before[row * 3 + k] * (1 - RELAX) +
            (middle[k] / around.size) * RELAX,
        );
        const drift = [0, 1, 2].map((k) => blended[k] - mesh.positions[row * 3 + k]);
        const far = Math.hypot(drift[0], drift[1], drift[2]);
        for (let k = 0; k < 3; k++)
          working.positions[row * 3 + k] =
            far > LIMIT
              ? mesh.positions[row * 3 + k] + (drift[k] / far) * LIMIT
              : blended[k];
      }
    }
  }
  const moved = new Map<number, number[]>();
  for (let row = 0; row < mesh.positions.length / 3; row++) {
    const delta = [0, 1, 2].map(
      (k) => working.positions[row * 3 + k] - mesh.positions[row * 3 + k],
    );
    if (Math.hypot(delta[0], delta[1], delta[2]) > 1e-9) moved.set(row, delta);
  }
  return { moved, crossings, solved };
};

console.log();
console.log(
  `${"combination".padEnd(44)} ${"surface".padEnd(14)} ${"crossed".padStart(8)}` +
    ` ${"left".padStart(5)} ${"moved".padStart(6)} ${"most".padStart(7)}`,
);
const receipts: Record<string, unknown>[] = [];
for (const one of offending.slice(0, budget)) {
  const [first, second] = one.pair.split(" + ");
  const parts = wearing({ [first]: 1, [second]: 1 });
  for (const appeared of one.appeared) {
    const [a, b] = appeared.split(" x ");
    const rankOf = (id: string) =>
      YIELDS.indexOf(id) < 0 ? YIELDS.length : YIELDS.indexOf(id);
    const [firm, soft] = rankOf(a) < rankOf(b) ? [a, b] : [b, a];
    const mesh = parts.get(soft);
    const into = parts.get(firm);
    if (mesh === undefined || into === undefined) continue;
    const { moved, crossings, solved } = pushOut(mesh, into);
    let most = 0;
    for (const delta of moved.values())
      most = Math.max(most, Math.hypot(delta[0], delta[1], delta[2]));
    // Three outcomes, not two. A crossing the enumeration found on a subject
    // and this does not find on the neutral head is not repaired, it is absent:
    // identity moved the surfaces into each other and a basis-level corrective,
    // which is a field on the neutral, has nothing to act on. Counting those as
    // successes would report the generator solving what it never saw.
    const outcome =
      crossings[0] === 0 ? "absent on the neutral head" : solved ? "repaired" : "beyond the budget";
    receipts.push({
      combination: one.pair,
      surfaces: appeared,
      yielded: soft,
      crossedVerticesPerRound: crossings,
      movedVertices: moved.size,
      mostMillimetres: most * 1000,
      solved,
      outcome,
    });
    console.log(
      `${one.pair.padEnd(44)} ${(soft.split("/").pop() ?? soft).replace("Human.", "").padEnd(14)}` +
        ` ${String(crossings[0]).padStart(8)}` +
        ` ${String(crossings[crossings.length - 1]).padStart(5)}` +
        ` ${String(moved.size).padStart(6)}` +
        ` ${(most * 1000).toFixed(2).padStart(7)}` +
        (solved ? "" : "   UNSOLVED"),
    );
  }
}

fs.writeFileSync(
  "../.shots/human-2469/investigation-2498/combination-correctives.json",
  `${JSON.stringify(receipts, null, 2)}
`,
);
const counted = (what: string) =>
  receipts.filter((one) => one.outcome === what).length;
console.log(
  `
of ${receipts.length} crossings: ${counted("repaired")} repaired inside ` +
    `${(LIMIT * 1000).toFixed(0)} mm, ${counted("beyond the budget")} beyond it, ` +
    `${counted("absent on the neutral head")} absent on the neutral head`,
);
console.log(
  "a crossing absent on the neutral head is one identity put there; a basis " +
    "corrective is a field on the neutral and cannot reach it",
);
