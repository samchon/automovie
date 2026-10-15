import { IAutoMovieVector3 } from "@automovie/interface";

import { Vector3 } from "../../math/Vector3";
import { AutoMovieSurfaceTier } from "./AutoMovieSurfaceTier";
import { IAutoMovieSurfaceCage } from "./IAutoMovieSurfaceCage";
import { IAutoMovieSurfaceCoordinate } from "./IAutoMovieSurfaceCoordinate";
import { IAutoMovieSurfaceNetwork } from "./IAutoMovieSurfaceNetwork";
import { IAutoMovieSweepPath } from "./IAutoMovieSweepPath";
import { IAutoMovieSweepSurface } from "./IAutoMovieSweepSurface";
import { compileAutoMovieSweep } from "./compileAutoMovieSweep";
import { fitAutoMovieSubdivisionLimit } from "./fitAutoMovieSubdivisionLimit";
import { frameAutoMovieSweepSpine } from "./frameAutoMovieSweepSpine";

/** Decimal places domain parameters are rounded to when they name a shared vertex. */
const KEY_DIGITS: number = 9;

/** Weights of the tent that averages a sweep's radius over a vertex's cell, at the cell's centre and half a spacing either side. */
const TENT: readonly number[] = [0.25, 0.5, 0.25];

/** Fit residual above which a sampling is refused, relative to the cage's extent. */
const FIT_LIMIT: number = 1e-6;

/**
 * Sample a surface network into a quad control cage at one tier.
 *
 * Each patch becomes a grid of its tier's rows and columns, sampled evenly in
 * its own coordinates. A sweep patch evaluates its sweep, its radius averaged
 * over each vertex's cell by a three-by-three tent reaching half the grid
 * spacing along `u` and `v`, so detail finer than the tier's grid, such as a
 * narrow feature at the lowest tier, fades instead of aliasing into ripples
 * between vertices; the average is of radii, not positions, so a round
 * section keeps its size. A point shared by patches of different spacing
 * takes the spacing of the first patch that samples it; a Coons patch takes
 * its four sides' points and fills the interior with Coons' bilinearly
 * blended interpolation of them (Coons 1967, MIT Project MAC TR-41); a bridge
 * takes its two loops' existing points and fills its rows with cubic Hermite
 * curves between them. Vertices are shared by identity, never by distance: a
 * point of a sweep is named by the sweep and its domain coordinates rounded to
 * nine decimals, a curve point by the curve and its share, a node by its name,
 * so every patch that samples the same side at the same count welds onto the
 * same vertices and a side sampled at another count stays apart.
 *
 * The patch grids alone decide the topology, so one network gives every input
 * the same cage at a tier. A ring may only name points that patches made, and
 * a bridge loop only sweep points that patches made (its curve points are
 * sampled like any shared curve), which catches sides that do not meet; an edge used twice in
 * the same direction is refused as overlapping or misoriented patches.
 *
 * With `fit` (the default), the samples are the targets of
 * `fitAutoMovieSubdivisionLimit`, so the cage's Catmull-Clark limit passes
 * through the surface at every vertex rather than shrinking inside it, and
 * pinned ring vertices keep their given positions. Without, controls are the
 * samples themselves and the residual is 0.
 *
 * Every face corner carries `(patch, s, t)` and a UV value: the patch's
 * rectangle in texture space, or, where it declares none, the band
 * `t in [k / P, (k + 1) / P]` of the unit square for patch `k` of `P`.
 *
 * @param props.network The network, only read.
 * @param props.tier The tier to sample.
 * @param props.fit Whether to fit controls to the limit surface; omitted, true.
 * @returns The cage, its targets, coordinates, patch grids and rings.
 * @throws Error when a name is unknown or repeated, a count is not a positive integer, a patch's opposite sides differ in count or its sides do not close, a bridge's loops differ in count or name points no patch made, a ring's positions do not match its loop, patches overlap, or the fit does not converge.
 *
 * @evidence contracts/common.md#principled-implementation A multi-block structured cage: each block samples its defining surface (a sweep, a Coons patch of its boundary curves, or a Hermite blend between loops) on a regular grid, blocks weld by exact identity of shared sides, and the limit fit inverts the subdivision stencils so the smooth surface interpolates the samples.
 * @evidence contracts/common.md#clear-and-simple-design Sampling, welding and fitting run in one pass per patch kind; sweep compilation, curve transport and the fit are delegated to their own modules.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No vertex is welded by proximity and no gap is stitched: sides that do not share identity stay apart and are reported as refusals, and a fit that does not converge is refused.
 * @evidence contracts/common.md#meaningful-documentation States each fill rule and its source, the welding identity, the topology guarantee, the fit and pinning, the UV default, and every refusal.
 * @evidence contracts/performance.md#efficient-algorithms For V vertices and F faces: sampling is O(V) surface evaluations, welding O(V) map operations, the orientation check O(F), and the fit O(F) per sweep; each sweep compiles once per call.
 * @evidence contracts/performance.md#reuse-equivalent-work Sweeps and curves compile once per call and are shared by every patch, edge and loop that names them, and a vertex is evaluated once however many patches share it.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Retains nothing; compiled sweeps, curves and the key map, O(V), are released on return and the cage arrays are transferred to the caller.
 */
export const sampleAutoMovieSurfaceNetwork: (props: {
  network: IAutoMovieSurfaceNetwork;
  tier: AutoMovieSurfaceTier;
  fit?: boolean;
}) => IAutoMovieSurfaceCage = (props: {
  network: IAutoMovieSurfaceNetwork;
  tier: AutoMovieSurfaceTier;
  fit?: boolean;
}): IAutoMovieSurfaceCage => {
  const { network, tier } = props;
  const surfaces: Map<string, IAutoMovieSweepSurface> = new Map();
  const surface = (name: string): IAutoMovieSweepSurface => {
    let s: IAutoMovieSweepSurface | undefined = surfaces.get(name);
    if (s === undefined) {
      const sweep = network.sweeps[name];
      if (sweep === undefined) throw new Error(`network names unknown sweep ${name}`);
      s = compileAutoMovieSweep(sweep);
      surfaces.set(name, s);
    }
    return s;
  };
  // the sweep point whose radius is averaged over a vertex's cell: a 3 x 3 tent of half the grid spacing
  const filtered = (s: IAutoMovieSweepSurface, u: number, v: number, du: number, dv: number): IAutoMovieVector3 => {
    let r: number = 0;
    for (let a: number = -1; a <= 1; ++a)
      for (let b: number = -1; b <= 1; ++b)
        r += TENT[a + 1]! * TENT[b + 1]! * s.radius(Math.min(1, Math.max(0, u + (a * du) / 2)), v + (b * dv) / 2);
    const f = s.frame(u);
    const angle: number = 2 * Math.PI * v;
    return Vector3.add(
      f.origin,
      Vector3.add(Vector3.scale(f.x, r * Math.cos(angle)), Vector3.scale(f.y, r * Math.sin(angle))),
    );
  };
  const count = (counts: IAutoMovieSurfaceNetwork.ICounts, what: string): number => {
    const n: number = counts[tier];
    if (!Number.isSafeInteger(n) || n < 1)
      throw new Error(`${what} needs a positive integer count at tier ${tier}`);
    return n;
  };
  const SCALE: number = 10 ** KEY_DIGITS;
  const round = (x: number): number => Math.round(x * SCALE);
  // v is read modulo one turn after rounding, so v near 0 and near 1 name the same point
  const sweepKey = (name: string, u: number, v: number): string =>
    `s|${name}|${round(Math.min(1, Math.max(0, u)))}|${((round(v) % SCALE) + SCALE) % SCALE}`;
  const node = (name: string): { key: string; point: IAutoMovieVector3 } => {
    const n: IAutoMovieSurfaceNetwork.INode | undefined = network.nodes?.[name];
    if (n === undefined) throw new Error(`network names unknown node ${name}`);
    if (n.type === "point") return { key: `n|${name}`, point: n.position };
    return { key: sweepKey(n.sweep, n.u, n.v), point: surface(n.sweep).point(n.u, n.v) };
  };
  const paths: Map<string, IAutoMovieSweepPath> = new Map();
  const curvePath = (name: string, curve: IAutoMovieSurfaceNetwork.ICurve): IAutoMovieSweepPath => {
    let p: IAutoMovieSweepPath | undefined = paths.get(name);
    if (p === undefined) {
      const points: IAutoMovieVector3[] = [node(curve.from).point, ...(curve.through ?? []), node(curve.to).point];
      const chord: IAutoMovieVector3 = Vector3.subtract(points[1]!, points[0]!);
      // any direction off the first chord; the curve's frames are never read
      const off: IAutoMovieVector3 =
        Math.abs(chord.x) <= Math.abs(chord.y) && Math.abs(chord.x) <= Math.abs(chord.z)
          ? Vector3.create(1, 0, 0)
          : Math.abs(chord.y) <= Math.abs(chord.z)
            ? Vector3.create(0, 1, 0)
            : Vector3.create(0, 0, 1);
      p = frameAutoMovieSweepSpine({ points, normal: off });
      paths.set(name, p);
    }
    return p;
  };

  // registry of vertices by identity
  const index: Map<string, number> = new Map();
  const targets: number[] = [];
  const vertex = (key: string, point: () => IAutoMovieVector3): number => {
    let i: number | undefined = index.get(key);
    if (i === undefined) {
      const p: IAutoMovieVector3 = point();
      if (![p.x, p.y, p.z].every(Number.isFinite)) throw new Error(`network point ${key} is not finite`);
      i = targets.length / 3;
      targets.push(p.x, p.y, p.z);
      index.set(key, i);
    }
    return i;
  };
  const existing = (key: string, what: string): number => {
    const i: number | undefined = index.get(key);
    if (i === undefined) throw new Error(`${what} names a point no patch made`);
    return i;
  };

  // a bridge may run along a network curve no patch samples, but a sweep point it names must be one a patch made
  const joined = (point: ISample, what: string): number =>
    point.key.startsWith("s|") ? existing(point.key, what) : vertex(point.key, point.point);
  const sample = (edge: IAutoMovieSurfaceNetwork.IEdge, what: string): ISample[] => {
    if (edge.type === "sweep") {
      const n: number = count(edge.segments, what);
      const s: IAutoMovieSweepSurface = surface(edge.sweep);
      return Array.from({ length: n + 1 }, (_: unknown, i: number): ISample => {
        const u: number = i === n ? edge.to.u : edge.from.u + ((edge.to.u - edge.from.u) * i) / n;
        const v: number = i === n ? edge.to.v : edge.from.v + ((edge.to.v - edge.from.v) * i) / n;
        return {
          key: sweepKey(edge.sweep, u, v),
          point: (): IAutoMovieVector3 =>
            filtered(s, u, v, Math.abs(edge.to.u - edge.from.u) / n, Math.abs(edge.to.v - edge.from.v) / n),
          tangent: (rule: IAutoMovieSurfaceNetwork.ILoop["tangent"]): IAutoMovieVector3 =>
            rule === "normal" || rule === "across"
              ? s.normal(u, v)
              : rule === "inward"
                ? Vector3.scale(s.normal(u, v), -1)
                : Vector3.scale(Vector3.normalize(s.along(u, v)), rule === "forward" ? 1 : -1),
        };
      });
    }
    const curve: IAutoMovieSurfaceNetwork.ICurve | undefined = network.curves?.[edge.curve];
    if (curve === undefined) throw new Error(`${what} names unknown curve ${edge.curve}`);
    if (curve.from === curve.to) throw new Error(`curve ${edge.curve} must join two different nodes`);
    const n: number = count(curve.segments, `curve ${edge.curve}`);
    const reverse: boolean = edge.reverse ?? false;
    return Array.from({ length: n + 1 }, (_: unknown, i: number): ISample => {
      const t: number = reverse ? (n - i) / n : i / n;
      const end: string | null = t === 0 ? curve.from : t === 1 ? curve.to : null;
      return {
        key: end !== null ? node(end).key : `c|${edge.curve}|${round(t)}`,
        point: (): IAutoMovieVector3 => (end !== null ? node(end).point : curvePath(edge.curve, curve).point(t)),
        tangent: (): IAutoMovieVector3 => {
          if (curve.direction === undefined)
            throw new Error(`curve ${edge.curve} needs a direction to be part of a bridge loop`);
          return Vector3.normalize(curve.direction);
        },
      };
    });
  };
  const loop = (edges: IAutoMovieSurfaceNetwork.IEdge[], what: string): ISample[] => {
    if (edges.length === 0) throw new Error(`${what} needs at least one edge`);
    const out: ISample[] = [];
    edges.forEach((edge: IAutoMovieSurfaceNetwork.IEdge, k: number): void => {
      const points: ISample[] = sample(edge, what);
      if (k > 0 && points[0]!.key !== out[out.length - 1]!.key)
        throw new Error(`${what} edge ${k} does not start where edge ${k - 1} ends`);
      out.push(...(k > 0 ? points.slice(1) : points));
    });
    if (out[out.length - 1]!.key !== out[0]!.key) throw new Error(`${what} does not close`);
    out.pop();
    return out;
  };

  const faces: number[][] = [];
  const corners: IAutoMovieSurfaceCage["corners"] = [];
  const uvs: number[] = [];
  const uvFaces: number[][] = [];
  const grids: IAutoMovieSurfaceCage.IPatch[] = [];
  const names: Set<string> = new Set();
  const total: number = network.patches.length;
  const emit = (p: number, grid: number[][], columns: number, rows: number, wrap: boolean): void => {
    const patch: IAutoMovieSurfaceNetwork.IPatch = network.patches[p]!;
    const rect: IAutoMovieSurfaceNetwork.IUvRect = patch.uv ?? { s: [0, 1], t: [p / total, (p + 1) / total] };
    const uv: number[][] = Array.from({ length: rows + 1 }, (_: unknown, j: number): number[] =>
      Array.from({ length: columns + 1 }, (__: unknown, i: number): number => {
        uvs.push(
          rect.s[0] + ((rect.s[1] - rect.s[0]) * i) / columns,
          rect.t[0] + ((rect.t[1] - rect.t[0]) * j) / rows,
        );
        return uvs.length / 2 - 1;
      }),
    );
    const at = (i: number, j: number): number => grid[j]![wrap ? i % columns : i]!;
    const faceList: number[] = [];
    for (let j: number = 0; j < rows; ++j)
      for (let i: number = 0; i < columns; ++i) {
        const quad: Array<[number, number]> = [
          [i, j],
          [i + 1, j],
          [i + 1, j + 1],
          [i, j + 1],
        ];
        faceList.push(faces.length);
        faces.push(quad.map(([a, b]: [number, number]): number => at(a, b)));
        uvFaces.push(quad.map(([a, b]: [number, number]): number => uv[b]![a]!));
        corners.push(
          quad.map(([a, b]: [number, number]): IAutoMovieSurfaceCoordinate => ({
            patch: p,
            s: a / columns,
            t: b / rows,
          })) as IAutoMovieSurfaceCage["corners"][number],
        );
      }
    grids[p] = { name: patch.name, columns, rows, faces: faceList };
  };

  const order: number[] = network.patches
    .map((_: IAutoMovieSurfaceNetwork.IPatch, p: number): number => p)
    .sort((a: number, b: number): number =>
      Number(network.patches[a]!.type === "bridge") - Number(network.patches[b]!.type === "bridge") || a - b,
    );
  for (const p of order) {
    const patch: IAutoMovieSurfaceNetwork.IPatch = network.patches[p]!;
    const what: string = `patch ${patch.name}`;
    if (names.has(patch.name)) throw new Error(`patch name ${patch.name} repeats`);
    names.add(patch.name);
    if (patch.type === "sweep") {
      const columns: number = count(patch.columns, what);
      const rows: number = count(patch.rows, what);
      const [u0, u1] = patch.u;
      const [v0, v1] = patch.v;
      if (!(u0 >= 0 && u1 <= 1 && u1 > u0)) throw new Error(`${what} u range must increase within 0 to 1`);
      if (!(v1 > v0 && v1 - v0 <= 1)) throw new Error(`${what} v range must increase by at most one turn`);
      const s: IAutoMovieSweepSurface = surface(patch.sweep);
      const grid: number[][] = Array.from({ length: rows + 1 }, (_: unknown, j: number): number[] => {
        const u: number = j === rows ? u1 : u0 + ((u1 - u0) * j) / rows;
        return Array.from({ length: columns + 1 }, (__: unknown, i: number): number => {
          const v: number = i === columns ? v1 : v0 + ((v1 - v0) * i) / columns;
          return vertex(sweepKey(patch.sweep, u, v), (): IAutoMovieVector3 =>
            filtered(s, u, v, (u1 - u0) / rows, (v1 - v0) / columns),
          );
        });
      });
      emit(p, grid, columns, rows, false);
    } else if (patch.type === "coons") {
      const [bottom, right, top, left] = patch.sides.map((e: IAutoMovieSurfaceNetwork.IEdge, k: number): ISample[] =>
        sample(e, `${what} side ${k}`),
      ) as [ISample[], ISample[], ISample[], ISample[]];
      const columns: number = bottom.length - 1;
      const rows: number = right.length - 1;
      if (top.length !== bottom.length || left.length !== right.length)
        throw new Error(`${what} opposite sides differ in count`);
      const ends: Array<[ISample[], ISample[]]> = [
        [bottom, right],
        [right, top],
        [top, left],
        [left, bottom],
      ];
      ends.forEach(([a, b]: [ISample[], ISample[]], k: number): void => {
        if (a[a.length - 1]!.key !== b[0]!.key) throw new Error(`${what} side ${k} does not end where side ${(k + 1) % 4} starts`);
      });
      const edgeAt = (i: number, j: number): ISample | null =>
        j === 0 ? bottom[i]! : j === rows ? top[columns - i]! : i === 0 ? left[rows - j]! : i === columns ? right[j]! : null;
      const grid: number[][] = Array.from({ length: rows + 1 }, (_: unknown, j: number): number[] =>
        Array.from({ length: columns + 1 }, (__: unknown, i: number): number => {
          const e: ISample | null = edgeAt(i, j);
          return e === null ? -1 : vertex(e.key, e.point);
        }),
      );
      const pt = (i: number, j: number): IAutoMovieVector3 => {
        const k: number = grid[j]![i]!;
        return Vector3.create(targets[3 * k]!, targets[3 * k + 1]!, targets[3 * k + 2]!);
      };
      for (let j: number = 1; j < rows; ++j)
        for (let i: number = 1; i < columns; ++i) {
          const s: number = i / columns;
          const t: number = j / rows;
          const ruled: IAutoMovieVector3 = Vector3.add(
            Vector3.add(Vector3.scale(pt(i, 0), 1 - t), Vector3.scale(pt(i, rows), t)),
            Vector3.add(Vector3.scale(pt(0, j), 1 - s), Vector3.scale(pt(columns, j), s)),
          );
          const corner: IAutoMovieVector3 = Vector3.add(
            Vector3.add(Vector3.scale(pt(0, 0), (1 - s) * (1 - t)), Vector3.scale(pt(columns, 0), s * (1 - t))),
            Vector3.add(Vector3.scale(pt(0, rows), (1 - s) * t), Vector3.scale(pt(columns, rows), s * t)),
          );
          grid[j]![i] = vertex(`p|${p}|${i}|${j}`, (): IAutoMovieVector3 => Vector3.subtract(ruled, corner));
        }
      emit(p, grid, columns, rows, false);
    } else {
      const rows: number = count(patch.rows, what);
      const a: ISample[] = loop(patch.from.edges, `${what} from loop`);
      const b: ISample[] = loop(patch.to.edges, `${what} to loop`);
      if (a.length !== b.length) throw new Error(`${what} loops differ in count, ${a.length} and ${b.length}`);
      const tension: number = patch.tension ?? 1;
      if (!(tension > 0) || !Number.isFinite(tension)) throw new Error(`${what} tension must be positive`);
      const n: number = a.length;
      const grid: number[][] = Array.from({ length: rows + 1 }, (): number[] => new Array<number>(n));
      const at = (i: number): IAutoMovieVector3 => Vector3.create(targets[3 * i]!, targets[3 * i + 1]!, targets[3 * i + 2]!);
      const ia: number[] = a.map((x: ISample): number => joined(x, `${what} from loop`));
      const ib: number[] = b.map((x: ISample): number => joined(x, `${what} to loop`));
      // direction of travel at a loop point; across a sweep it is normal x loop direction, in the surface
      const direction = (loopPoints: ISample[], indices: number[], k: number, rule: IAutoMovieSurfaceNetwork.ILoop["tangent"]): IAutoMovieVector3 => {
        const t: IAutoMovieVector3 = loopPoints[k]!.tangent(rule);
        if (rule !== "across" || !loopPoints[k]!.key.startsWith("s|")) return t;
        const along: IAutoMovieVector3 = Vector3.subtract(at(indices[(k + 1) % n]!), at(indices[(k + n - 1) % n]!));
        return Vector3.normalize(Vector3.cross(t, along));
      };
      for (let k: number = 0; k < n; ++k) {
        grid[0]![k] = ia[k]!;
        grid[rows]![k] = ib[k]!;
        const pa: IAutoMovieVector3 = at(ia[k]!);
        const pb: IAutoMovieVector3 = at(ib[k]!);
        const m: number = tension * Vector3.length(Vector3.subtract(pb, pa));
        const ta: IAutoMovieVector3 = Vector3.scale(direction(a, ia, k, patch.from.tangent), m);
        const tb: IAutoMovieVector3 = Vector3.scale(direction(b, ib, k, patch.to.tangent), m);
        for (let j: number = 1; j < rows; ++j) {
          const t: number = j / rows;
          const h: number[] = [2 * t ** 3 - 3 * t ** 2 + 1, t ** 3 - 2 * t ** 2 + t, -2 * t ** 3 + 3 * t ** 2, t ** 3 - t ** 2];
          grid[j]![k] = vertex(`p|${p}|${k}|${j}`, (): IAutoMovieVector3 =>
            Vector3.add(
              Vector3.add(Vector3.scale(pa, h[0]!), Vector3.scale(ta, h[1]!)),
              Vector3.add(Vector3.scale(pb, h[2]!), Vector3.scale(tb, h[3]!)),
            ),
          );
        }
      }
      emit(p, grid, n, rows, true);
    }
  }

  // every directed edge once: patches neither overlap nor disagree in winding
  const directed: Set<string> = new Set();
  faces.forEach((quad: number[]): void => {
    for (let k: number = 0; k < 4; ++k) {
      const key: string = `${quad[k]},${quad[(k + 1) % 4]}`;
      if (directed.has(key)) throw new Error(`patches overlap or wind inconsistently at edge ${key}`);
      directed.add(key);
    }
  });

  const pinned: boolean[] = new Array<boolean>(targets.length / 3).fill(false);
  const rings: Record<string, number[]> = {};
  for (const ring of network.rings ?? []) {
    if (ring.name in rings) throw new Error(`ring name ${ring.name} repeats`);
    const vertices: number[] = loop(ring.edges, `ring ${ring.name}`).map((s: ISample): number =>
      existing(s.key, `ring ${ring.name}`),
    );
    if (ring.positions !== undefined) {
      if (ring.positions.length !== vertices.length)
        throw new Error(`ring ${ring.name} has ${vertices.length} vertices but ${ring.positions.length} positions`);
      vertices.forEach((v: number, k: number): void => {
        const p: IAutoMovieVector3 = ring.positions![k]!;
        if (![p.x, p.y, p.z].every(Number.isFinite)) throw new Error(`ring ${ring.name} position ${k} is not finite`);
        targets[3 * v] = p.x;
        targets[3 * v + 1] = p.y;
        targets[3 * v + 2] = p.z;
        pinned[v] = true;
      });
    }
    rings[ring.name] = vertices;
  }

  let positions: number[] = [...targets];
  let residual: number = 0;
  if (props.fit ?? true) {
    const fitted: { positions: number[]; residual: number } = fitAutoMovieSubdivisionLimit({ faces, targets, pinned });
    let extent: number = 0;
    for (let axis: number = 0; axis < 3; ++axis) {
      let low: number = Infinity;
      let high: number = -Infinity;
      for (let i: number = axis; i < targets.length; i += 3) {
        low = Math.min(low, targets[i]!);
        high = Math.max(high, targets[i]!);
      }
      extent = Math.max(extent, high - low);
    }
    if (fitted.residual > FIT_LIMIT * extent)
      throw new Error(`limit fit did not converge, residual ${fitted.residual}`);
    positions = fitted.positions;
    residual = fitted.residual;
  }
  return { tier, cage: { positions, faces, uvs, uvFaces }, targets, pinned, corners, patches: grids, rings, residual };
};

/** One point of an edge: its identity, its position on demand, and its bridge direction by rule. */
interface ISample {
  key: string;
  point: () => IAutoMovieVector3;
  tangent: (rule: IAutoMovieSurfaceNetwork.ILoop["tangent"]) => IAutoMovieVector3;
}
