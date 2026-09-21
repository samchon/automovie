/** Move one surface out of another, as soft tissue would and no further.
 *
 * This is the solver behind the combination correctives. Given a mesh that has
 * entered another, it finds the vertices whose triangles cross, puts each on the
 * far side of the surface it entered plus a clearance, and then relaxes that
 * push over the surrounding rings so what results is tissue moving rather than
 * a dent: a lip that clears the teeth by folding itself around one incisor has
 * not been corrected, it has been damaged. Push and relax alternate until
 * nothing crosses or the rounds run out, and the caller is told which.
 *
 * Every displacement is bounded, measured from where the vertex started. Without
 * that bound the solver clears everything and means nothing: told to keep
 * pushing until the triangles part, it once threw a lip 38 mm and a tongue
 * 178 mm, which clears the crossing and destroys the face. A combination that
 * cannot be repaired inside what soft tissue over a dental arch actually has to
 * give is a pose the rig should refuse, and the solver reports it as unsolved
 * rather than publishing a repair that is worse than the defect.
 *
 * Which way is out is decided at rest, not in the pose. A vertex inside a
 * tooth is near every face of that tooth, and the nearest one is as likely to
 * lead into the mouth as out of it; at rest the same vertex sat clear of the
 * teeth on one definite side, and that offset is the direction it leaves by.
 * A caller that supplies the rest meshes gets that rule; one that does not
 * gets the nearest face, which is right whenever the crossing is shallow.
 *
 * Inputs are plain `IAutoMovieMesh` buffers in metres, shared-vertex or split,
 * and the result is keyed by that mesh's own vertex ordinals; the caller owns
 * whatever mapping turns those into a basis endpoint. Nothing here mutates its
 * inputs. Consumers: `generate-combination-correctives.ts`.
 */
import { measureAutoMovieMeshCrossings } from "@automovie/engine";
import type { IAutoMovieMesh } from "@automovie/interface";

/** How far past the surface it entered a pushed vertex is put, in metres. */
export const CLEARANCE = 0.0005;
/** Rounds of pushing and relaxing before a pair is called unsolved. */
export const ROUNDS = 24;
/**
 * The most a corrective may move any vertex, in metres, unless a caller says
 * otherwise. Three millimetres is what soft tissue over a dental arch gives
 * without becoming a different pose; a caller that needs more is asking to
 * cover a protrusion, and says how much and reports what it took.
 */
export const LIMIT = 0.003;
/** How much of a pushed vertex's motion its neighbours take on, per sweep. */
export const RELAX = 0.5;
/** Relaxation sweeps after each push. */
export const SMOOTHING = 6;
/**
 * Rings of neighbours around a pushed vertex that relaxation may move.
 *
 * One ring gives a step: the pushed vertex at its full displacement, its
 * neighbours at about half, and zero one edge further, which on a lip is a
 * crease two millimetres wide. Three rings let the same displacement fall off
 * over the width soft tissue actually spreads a push across.
 */
export const RINGS = 3;

const triangles = (mesh: IAutoMovieMesh): number[] =>
  mesh.indices ?? [...new Array(mesh.positions.length / 3).keys()];

/** Vertices of `mesh` that take part in a triangle crossing `into`. */
const crossedVertices = (
  mesh: IAutoMovieMesh,
  into: IAutoMovieMesh,
): Set<number> => {
  const rows = triangles(mesh);
  const hit = new Set<number>();
  for (const crossing of measureAutoMovieMeshCrossings(mesh, into))
    for (let corner = 0; corner < 3; corner++)
      hit.add(rows[crossing.triangle * 3 + corner]);
  return hit;
};

/** The neighbours of each vertex, over a mesh's own triangles. */
export const neighboursOf = (mesh: IAutoMovieMesh): Set<number>[] => {
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
  const sub = (x: number[], y: number[]) => [
    x[0] - y[0],
    x[1] - y[1],
    x[2] - y[2],
  ];
  const dot = (x: number[], y: number[]) =>
    x[0] * y[0] + x[1] * y[1] + x[2] * y[2];
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
    const low = of(
      [0, 1, 2].map((k) => Math.min(...triangle.map((p) => p[k]))),
    );
    const high = of(
      [0, 1, 2].map((k) => Math.max(...triangle.map((p) => p[k]))),
    );
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
  const nearest = (
    point: number[],
  ): { at: number[]; normal: number[]; away: number } => {
    const middle = of(point);
    let best = 0;
    let bestPoint = corners[0][0];
    let nearest = Infinity;
    for (let reach = 1; reach <= 6; reach++) {
      for (let x = middle[0] - reach; x <= middle[0] + reach; x++)
        for (let y = middle[1] - reach; y <= middle[1] + reach; y++)
          for (let z = middle[2] - reach; z <= middle[2] + reach; z++)
            for (const index of grid.get(key(x, y, z)) ?? []) {
              const on = closestInTriangle(
                point,
                ...(corners[index] as [number[], number[], number[]]),
              );
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
  /**
   * How far along `direction` a point has to travel to be past every triangle
   * the ray meets, or zero when it meets none. Moller-Trumbore over the whole
   * mesh: a dental arch is a few thousand triangles and this is asked a few
   * thousand times, which is nothing.
   */
  const exitAlong = (point: number[], direction: number[]): number => {
    let last = 0;
    for (const tri of corners) {
      const e1 = [0, 1, 2].map((k) => tri[1][k] - tri[0][k]);
      const e2 = [0, 1, 2].map((k) => tri[2][k] - tri[0][k]);
      const p = [
        direction[1] * e2[2] - direction[2] * e2[1],
        direction[2] * e2[0] - direction[0] * e2[2],
        direction[0] * e2[1] - direction[1] * e2[0],
      ];
      const det = e1[0] * p[0] + e1[1] * p[1] + e1[2] * p[2];
      if (Math.abs(det) < 1e-15) continue;
      const inv = 1 / det;
      const s = [0, 1, 2].map((k) => point[k] - tri[0][k]);
      const u = (s[0] * p[0] + s[1] * p[1] + s[2] * p[2]) * inv;
      if (u < 0 || u > 1) continue;
      const q = [
        s[1] * e1[2] - s[2] * e1[1],
        s[2] * e1[0] - s[0] * e1[2],
        s[0] * e1[1] - s[1] * e1[0],
      ];
      const v =
        (direction[0] * q[0] + direction[1] * q[1] + direction[2] * q[2]) * inv;
      if (v < 0 || u + v > 1) continue;
      const t = (e2[0] * q[0] + e2[1] * q[1] + e2[2] * q[2]) * inv;
      if (t > last) last = t;
    }
    return last;
  };
  return { nearest, exitAlong };
};

/** What one push-out produced, keyed by the yielding mesh's vertex ordinals. */
export interface IPushOut {
  /** Displacement in metres per vertex that moved at all. */
  moved: Map<number, number[]>;
  /** Crossed vertices at the start of each round; the last entry is what remains. */
  crossings: number[];
  /** True when the last round found nothing crossing. */
  solved: boolean;
}

/**
 * Move `mesh` out of `into`, and report the displacement it took.
 *
 * Push and relax alternate. The push puts every crossed vertex on the far side
 * of the surface it has entered, plus a clearance; the relax spreads that over
 * `RINGS` rings of neighbours so the result is a surface moving rather than a
 * row of vertices yanked past their neighbours. Only those rings take part: a
 * lip that clears the teeth by moving the whole lip is not a corrective, it is
 * a different lip.
 */
export const pushOut = (
  mesh: IAutoMovieMesh,
  into: IAutoMovieMesh,
  limit: number = LIMIT,
  rest?: { mesh: IAutoMovieMesh; into: IAutoMovieMesh },
): IPushOut => {
  const { nearest: nearestOn, exitAlong } = gridOf(into);
  const near = neighboursOf(mesh);
  // Which side of the firm surface a vertex belongs on is not a property of
  // the pose, where the vertex is inside that surface and every face of it
  // looks equally near, but of the rest pose, where the vertex sat clear of it
  // on one side. The nearest face in the pose sends a lip vertex a few
  // millimetres into an incisor out through the lingual face, into the mouth
  // and still inside it, and that is the plateau the budget was blamed for.
  // So the rest offset from the firm surface is the way out, when given.
  const sideAtRest = rest === undefined ? undefined : gridOf(rest.into).nearest;
  const wayOut = new Map<number, number[]>();
  const directionOf = (row: number): number[] | undefined => {
    if (sideAtRest === undefined || rest === undefined) return undefined;
    let known = wayOut.get(row);
    if (known === undefined) {
      const point = [0, 1, 2].map((k) => rest.mesh.positions[row * 3 + k]);
      const { at, normal, away } = sideAtRest(point);
      const offset = [0, 1, 2].map((k) => point[k] - at[k]);
      const size = Math.hypot(offset[0], offset[1], offset[2]);
      // A vertex touching the surface at rest has no offset to speak of and
      // takes the face normal, signed by which side it was on.
      known =
        size > 1e-6
          ? offset.map((one) => one / size)
          : normal.map((one) => (away < 0 ? -one : one));
      wayOut.set(row, known);
    }
    return known;
  };
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
      // A vertex already outside can still belong to a triangle that crosses:
      // three corners clear of a tooth say nothing about the face between them
      // passing through it. Projecting such a vertex to the surface would move
      // it backwards, so it is carried further out instead, a clearance at a
      // time, until its triangle has nothing left to cross. A plateau at 87
      // vertices was exactly this -- every one of them was already outside,
      // every push was skipped, and the count stopped falling.
      const direction = directionOf(row);
      if (direction === undefined) {
        const { at, normal, away } = nearestOn(point);
        const outward = Math.max(away, 0) + CLEARANCE * (round + 1);
        for (let k = 0; k < 3; k++)
          working.positions[row * 3 + k] = at[k] + normal[k] * outward;
      } else {
        const outward = exitAlong(point, direction) + CLEARANCE * (round + 1);
        for (let k = 0; k < 3; k++)
          working.positions[row * 3 + k] = point[k] + direction[k] * outward;
      }
      // Never past the budget, measured from where the vertex started.
      const moved = [0, 1, 2].map(
        (k) => working.positions[row * 3 + k] - mesh.positions[row * 3 + k],
      );
      const far = Math.hypot(moved[0], moved[1], moved[2]);
      if (far > limit)
        for (let k = 0; k < 3; k++)
          working.positions[row * 3 + k] =
            mesh.positions[row * 3 + k] + (moved[k] / far) * limit;
    }
    let frontier = new Set<number>(hit);
    for (let ring = 0; ring < RINGS; ring++) {
      const next = new Set<number>();
      for (const row of frontier)
        for (const neighbour of near[row])
          if (!touched.has(neighbour)) {
            touched.add(neighbour);
            next.add(neighbour);
          }
      frontier = next;
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
        const drift = [0, 1, 2].map(
          (k) => blended[k] - mesh.positions[row * 3 + k],
        );
        const far = Math.hypot(drift[0], drift[1], drift[2]);
        for (let k = 0; k < 3; k++)
          working.positions[row * 3 + k] =
            far > limit
              ? mesh.positions[row * 3 + k] + (drift[k] / far) * limit
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

/**
 * Take back a part's own motion until it is clear of another, and report it.
 *
 * A tongue put out through sealed or puckered lips is a pose the channels
 * describe and the tissue cannot make: the lips would have to open by the
 * tongue's whole thickness, which no push inside a budget reaches, and it was
 * measured not to. What the tongue can do is not come out that far. So the
 * agent's displacement from rest is scaled down by one factor, whole, and the
 * smallest factor that leaves it clear of the other part is found by
 * bisection; the corrective is then a scaled copy of the agent's own field,
 * which is exactly the motion the pose asked for, less. There is no budget,
 * because a pose that needs the whole motion taken back is the other channel
 * alone, and that is a face.
 */
export const takeBack = (
  mesh: IAutoMovieMesh,
  rest: IAutoMovieMesh,
  other: IAutoMovieMesh,
): IPushOut & { factor: number } => {
  const crossingCount = (positions: number[]) =>
    measureAutoMovieMeshCrossings({ ...mesh, positions }, other).length;
  const pulled = (factor: number): number[] =>
    mesh.positions.map(
      (value, at) => value - factor * (value - rest.positions[at]),
    );
  const crossings: number[] = [crossingCount(mesh.positions)];
  if (crossings[0] === 0)
    return { moved: new Map(), crossings, solved: true, factor: 0 };
  if (crossingCount(pulled(1)) > 0) {
    crossings.push(crossings[0]);
    return { moved: new Map(), crossings, solved: false, factor: 1 };
  }
  let low = 0;
  let high = 1;
  for (let step = 0; step < 8; step++) {
    const middle = (low + high) / 2;
    const left = crossingCount(pulled(middle));
    crossings.push(left);
    if (left === 0) high = middle;
    else low = middle;
  }
  const positions = pulled(high);
  const moved = new Map<number, number[]>();
  for (let row = 0; row < mesh.positions.length / 3; row++) {
    const delta = [0, 1, 2].map(
      (k) => positions[row * 3 + k] - mesh.positions[row * 3 + k],
    );
    if (Math.hypot(delta[0], delta[1], delta[2]) > 1e-9) moved.set(row, delta);
  }
  crossings.push(0);
  return { moved, crossings, solved: true, factor: high };
};
