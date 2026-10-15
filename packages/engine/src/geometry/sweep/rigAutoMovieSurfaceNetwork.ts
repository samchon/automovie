import { AutoMovieHumanoidBone, IAutoMovieVector3 } from "@automovie/interface";

import { IAutoMovieResolvedBone } from "../../kinematics/IAutoMovieResolvedBone";
import { AutoMovieSurfaceTier } from "./AutoMovieSurfaceTier";
import { IAutoMovieBoneBuffer } from "./IAutoMovieBoneBuffer";
import { IAutoMovieSubdivisionStencil } from "./IAutoMovieSubdivisionStencil";
import { IAutoMovieSurfaceCage } from "./IAutoMovieSurfaceCage";
import { IAutoMovieSurfaceCoordinate } from "./IAutoMovieSurfaceCoordinate";
import { IAutoMovieSurfaceCurveRig } from "./IAutoMovieSurfaceCurveRig";
import { IAutoMovieSurfaceNetwork } from "./IAutoMovieSurfaceNetwork";
import { IAutoMovieSurfacePoint } from "./IAutoMovieSurfacePoint";
import { IAutoMovieSurfaceRig } from "./IAutoMovieSurfaceRig";
import { IAutoMovieSurfaceSample } from "./IAutoMovieSurfaceSample";
import { IAutoMovieSweepBinding } from "./IAutoMovieSweepBinding";
import { IAutoMovieSweepRig } from "./IAutoMovieSweepRig";
import { bufferAutoMovieBones } from "./bufferAutoMovieBones";
import { rigAutoMovieSurfaceBridge } from "./rigAutoMovieSurfaceBridge";
import { rigAutoMovieSurfaceCoons } from "./rigAutoMovieSurfaceCoons";
import { rigAutoMovieSurfaceCurve } from "./rigAutoMovieSurfaceCurve";
import { rigAutoMovieSweep } from "./rigAutoMovieSweep";
import { solveAutoMovieSubdivisionLimit } from "./solveAutoMovieSubdivisionLimit";
import { stencilAutoMovieSubdivisionLimit } from "./stencilAutoMovieSubdivisionLimit";

/** Decimal places domain parameters are rounded to when they name a shared vertex. */
const KEY_DIGITS: number = 9;

/** Fit residual above which the rest cage is refused, relative to the cage's extent. */
const FIT_LIMIT: number = 1e-6;

/**
 * Compile a surface network at one tier into its rest cage and a per-pose
 * update of the cage's control positions.
 *
 * Each patch becomes a grid of its tier's rows and columns, sampled evenly in
 * its own coordinates. A sweep patch evaluates its sweep, its radius averaged
 * over each vertex's cell, which reaches half the spacing to the neighbouring
 * sample on each side along `u` and `v`, as `IAutoMovieSweepRig.sample`
 * states, so detail finer than the tier's grid fades instead of aliasing into
 * ripples. A point sampled by several patches or sides takes, on each side,
 * the finest spacing any of them gives there, and a side none of them reaches
 * mirrors the other, so a point's position does not depend on patch order and
 * a mirrored layout samples to a mirrored cage; a node on a sweep that no grid
 * samples is the section point itself. A Coons patch takes its four sides' points and fills the
 * interior as `rigAutoMovieSurfaceCoons` states; a bridge
 * fills its rows with cubic Hermite curves between its two loops, as
 * `rigAutoMovieSurfaceBridge` states. A network curve is compiled by
 * `rigAutoMovieSurfaceCurve`, which makes it meet sweep nodes in their
 * tangent planes. Vertices are shared by identity, never by distance: a point
 * of a sweep is named by the sweep and its domain coordinates rounded to nine
 * decimals, a curve point by the curve and its share, a node by its name.
 *
 * The patch grids alone decide the topology, so one network gives every
 * input and every pose the same cage at a tier. A ring may only name points
 * that patches made, and a bridge loop only sweep points that patches made,
 * which catches sides that do not meet; an edge used twice in the same
 * direction is refused as overlapping or misoriented patches.
 *
 * With `fit` (the default) the samples of sweeps and curves are targets the
 * cage's Catmull-Clark limit passes through, solved by
 * `solveAutoMovieSubdivisionLimit`; the interior vertices of Coons patches
 * and bridges are blend controls of their own construction and keep their
 * samples as control positions, because interpolating a blend's samples
 * makes the limit surface ring between them where a loop turns sharply;
 * pinned ring vertices keep their given positions. Without, controls are the
 * samples themselves and the residual is 0. Every face corner carries
 * `(patch, s, t)` and a UV value: the patch's rectangle in texture space, or
 * the band `t in [k / P, (k + 1) / P]` of the unit square for patch `k` of `P`.
 *
 * Bindings make the rig posable exactly as `poseAutoMovieSurfaceNetwork`
 * poses the network: bound sweeps by `rigAutoMovieSweep`, free nodes, curve
 * through points, normals and directions and ring positions rigidly with
 * their bones. Everything else is computed here once; `pose` refreshes only
 * the bones, the bound sweeps, the curves, the samples, the blends, the pins
 * and the fit, into buffers sized here.
 *
 * @param props.network The network, only read; its sweeps are retained through their rigs.
 * @param props.tier The tier to sample.
 * @param props.fit Whether to fit controls to the limit surface; omitted, true.
 * @param props.bindings Bones by name for sweeps, free nodes, curves and rings; omitted, none.
 * @param props.rest Bones at rest, required with bindings.
 * @param props.preserveVolume Whether bound sweeps keep their rest volume at joint stations; omitted, false.
 * @returns The rig.
 * @throws Error when a name is unknown or repeated, a binding names nothing in the network or comes without rest bones, a count is not a positive integer, a curve meets a sweep along its normal, a patch's opposite sides differ in count or its sides do not close, a bridge's loops differ in count or name points no patch made, a ring's positions do not match its loop, patches overlap, or the rest fit does not converge.
 *
 * @evidence contracts/common.md#principled-implementation A multi-block structured cage: each block samples its defining surface on a regular grid, blocks weld by exact identity, the limit fit inverts the subdivision stencils for samples of authored surfaces and keeps blend controls, and posing is sweep-based deformation split into its pose-invariant compile and per-pose evaluation.
 * @evidence contracts/common.md#clear-and-simple-design One compile records, per vertex, the writer that evaluates it; the rest cage and every pose run the same writers, and `sampleAutoMovieSurfaceNetwork` is this rig at rest. Sweeps, curves, bridges, bones and the fit are their own modules.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No vertex is welded by proximity and no gap is stitched; bindings naming nothing are refused; a rest fit that does not converge is refused, and every pose returns its residual.
 * @evidence contracts/common.md#meaningful-documentation States each fill rule and its source, the welding identity, the topology guarantee, the fit and why blends are held, pinning, the UV default, the posing rules and every refusal.
 * @evidence contracts/performance.md#efficient-algorithms Compile, for V vertices and F faces: O(V) map operations and sweep queries, O(F) for the orientation check and stencils, plus each sweep's compile. Pose: O(V) writers of constant size, each bound sweep's and curve's update, O(n r) per bridge and the fit's O(V + F) per Jacobi sweep, with no allocation.
 * @evidence contracts/performance.md#reuse-equivalent-work Shapes, Coons weights, Hermite weights, stencils and rest volumes are computed once; a vertex shared by patches is evaluated once per pose.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Retains the cage record, one writer per vertex or blend, four position buffers of 3 V numbers, the stencils, and each sweep's and curve's rig with its compiled surface, whose row cache `compileAutoMovieSweep` bounds at 8,192 rows and which posing does not grow; all are released with the rig.
 */
export const rigAutoMovieSurfaceNetwork: (props: {
  network: IAutoMovieSurfaceNetwork;
  tier: AutoMovieSurfaceTier;
  fit?: boolean;
  bindings?: {
    sweeps?: Record<string, IAutoMovieSweepBinding>;
    nodes?: Record<string, AutoMovieHumanoidBone>;
    curves?: Record<string, AutoMovieHumanoidBone>;
    rings?: Record<string, AutoMovieHumanoidBone>;
  };
  rest?: readonly IAutoMovieResolvedBone[];
  preserveVolume?: boolean;
}) => IAutoMovieSurfaceRig = (props: {
  network: IAutoMovieSurfaceNetwork;
  tier: AutoMovieSurfaceTier;
  fit?: boolean;
  bindings?: {
    sweeps?: Record<string, IAutoMovieSweepBinding>;
    nodes?: Record<string, AutoMovieHumanoidBone>;
    curves?: Record<string, AutoMovieHumanoidBone>;
    rings?: Record<string, AutoMovieHumanoidBone>;
  };
  rest?: readonly IAutoMovieResolvedBone[];
  preserveVolume?: boolean;
}): IAutoMovieSurfaceRig => {
  const { network, tier } = props;
  const bindings: NonNullable<typeof props.bindings> = props.bindings ?? {};
  const known = (names: string[], record: object | undefined, what: string): void => {
    for (const name of Object.keys(record ?? {}))
      if (!names.includes(name)) throw new Error(`binding names unknown ${what} ${name}`);
  };
  known(Object.keys(network.sweeps), bindings.sweeps, "sweep");
  known(Object.keys(network.nodes ?? {}), bindings.nodes, "node");
  known(Object.keys(network.curves ?? {}), bindings.curves, "curve");
  known((network.rings ?? []).map((r: IAutoMovieSurfaceNetwork.IRing): string => r.name), bindings.rings, "ring");
  const bound: boolean = [bindings.sweeps, bindings.nodes, bindings.curves, bindings.rings].some(
    (r: object | undefined): boolean => Object.keys(r ?? {}).length > 0,
  );
  if (bound && props.rest === undefined) throw new Error("a rig with bindings needs the rest bones");
  const bones: IAutoMovieBoneBuffer | null = props.rest === undefined ? null : bufferAutoMovieBones(props.rest);
  const boneOf = (bone: AutoMovieHumanoidBone | undefined): number => (bone === undefined || bones === null ? -1 : bones.index(bone));

  const sweeps: Map<string, IAutoMovieSweepRig> = new Map();
  const sweepRig = (name: string): IAutoMovieSweepRig => {
    let r: IAutoMovieSweepRig | undefined = sweeps.get(name);
    if (r === undefined) {
      const sweep = network.sweeps[name];
      if (sweep === undefined) throw new Error(`network names unknown sweep ${name}`);
      const b: IAutoMovieSweepBinding | undefined = bindings.sweeps?.[name];
      r = rigAutoMovieSweep({
        sweep,
        ...(b === undefined
          ? {}
          : {
              binding: {
                points: b.points.map((bone: AutoMovieHumanoidBone): number => boneOf(bone)),
                stations: b.stations.map((s: AutoMovieHumanoidBone[]): number[] => s.map((bone: AutoMovieHumanoidBone): number => boneOf(bone))),
              },
            }),
        preserveVolume: props.preserveVolume ?? false,
      });
      sweeps.set(name, r);
    }
    return r;
  };
  const count = (counts: IAutoMovieSurfaceNetwork.ICounts, what: string): number => {
    const n: number = counts[tier];
    if (!Number.isSafeInteger(n) || n < 1) throw new Error(`${what} needs a positive integer count at tier ${tier}`);
    return n;
  };
  const SCALE: number = 10 ** KEY_DIGITS;
  const round = (x: number): number => Math.round(x * SCALE);
  // v is read modulo one turn after rounding, so v near 0 and near 1 name the same point
  const sweepKey = (name: string, u: number, v: number): string =>
    `s|${name}|${round(Math.min(1, Math.max(0, u)))}|${((round(v) % SCALE) + SCALE) % SCALE}`;
  const rest3 = (p: IAutoMovieVector3): Float64Array => Float64Array.from([p.x, p.y, p.z]);
  // a point that rides a bone, or stays where it is without one
  const riding = (p: IAutoMovieVector3, bone: number): ((out: Float64Array, at: number) => void) => {
    const rest: Float64Array = rest3(p);
    return (out: Float64Array, at: number): void => {
      if (bone >= 0) bones!.apply(bone, rest, 0, out, at);
      else for (let c: number = 0; c < 3; ++c) out[at + c] = rest[c]!;
    };
  };
  const nodes: Map<string, IAutoMovieSurfacePoint & { key: string }> = new Map();
  const node = (name: string): IAutoMovieSurfacePoint & { key: string } => {
    let found: (IAutoMovieSurfacePoint & { key: string }) | undefined = nodes.get(name);
    if (found !== undefined) return found;
    const n: IAutoMovieSurfaceNetwork.INode | undefined = network.nodes?.[name];
    if (n === undefined) throw new Error(`network names unknown node ${name}`);
    found =
      n.type === "point"
        ? { key: `n|${name}`, write: riding(n.position, boneOf(bindings.nodes?.[name])), probe: null }
        : {
            key: sweepKey(n.sweep, n.u, n.v),
            write: sweepRig(n.sweep).sample(n.u, n.v, [0, 0, 0, 0]),
            probe: { rig: sweepRig(n.sweep), slot: sweepRig(n.sweep).probe(n.u, n.v) },
          };
    nodes.set(name, found);
    return found;
  };
  const curves: Map<string, IAutoMovieSurfaceCurveRig> = new Map();
  const curveRig = (name: string, curve: IAutoMovieSurfaceNetwork.ICurve): IAutoMovieSurfaceCurveRig => {
    let r: IAutoMovieSurfaceCurveRig | undefined = curves.get(name);
    if (r === undefined) {
      r = rigAutoMovieSurfaceCurve({ name, curve, from: node(curve.from), to: node(curve.to), bone: boneOf(bindings.curves?.[name]), bones });
      curves.set(name, r);
    }
    return r;
  };

  // registry of vertices by identity, each with the writer that evaluates it
  const index: Map<string, number> = new Map();
  const writers: Array<(targets: Float64Array) => void> = [];
  let vertices: number = 0;
  const reserve = (key: string): number => {
    const i: number = vertices++;
    index.set(key, i);
    return i;
  };
  const vertex = (key: string, make: () => (out: Float64Array, at: number) => void): number => {
    let i: number | undefined = index.get(key);
    if (i === undefined) {
      const write: (out: Float64Array, at: number) => void = make();
      const at: number = 3 * (i = reserve(key));
      writers.push((targets: Float64Array): void => write(targets, at));
    }
    return i;
  };
  // sweep points: their cell narrows as each sampling reports its spacing, and their writers are made once all have
  const pending: Map<string, IPending> = new Map();
  const admit = (sample: IAutoMovieSurfaceSample): number => {
    const point: IAutoMovieSurfaceSample["point"] = sample.point;
    if (point === null) return vertex(sample.key, sample.writer);
    let entry: IPending | undefined = pending.get(sample.key);
    if (entry === undefined) {
      const at: number = 3 * reserve(sample.key);
      const created: IPending = {
        sweep: point.sweep,
        u: point.u,
        v: point.v,
        cell: [Infinity, Infinity, Infinity, Infinity],
        write: (): void => undefined,
      };
      writers.push((targets: Float64Array): void => created.write(targets, at));
      pending.set(sample.key, (entry = created));
    }
    for (let k: number = 0; k < 4; ++k) entry.cell[k] = Math.min(entry.cell[k]!, point.cell[k]!);
    return index.get(sample.key)!;
  };
  // a side no sampling reported mirrors the other, and an axis no sampling spans has no extent
  const finalize = (): void => {
    for (const entry of pending.values()) {
      const cell: [number, number, number, number] = [0, 0, 0, 0];
      for (const axis of [0, 2]) {
        const below: number = entry.cell[axis]!;
        const above: number = entry.cell[axis + 1]!;
        cell[axis] = Number.isFinite(below) ? below : Number.isFinite(above) ? above : 0;
        cell[axis + 1] = Number.isFinite(above) ? above : cell[axis]!;
      }
      entry.write = sweepRig(entry.sweep).sample(entry.u, entry.v, cell);
    }
  };
  // the spacing a sampling step gives a point's cell below and above along one axis
  const reach = (step: number, first: boolean, last: boolean): [number, number] => {
    const size: number = Math.abs(step);
    if (step === 0) return [Infinity, Infinity];
    const back: number = first ? Infinity : size;
    const ahead: number = last ? Infinity : size;
    return step > 0 ? [back, ahead] : [ahead, back];
  };
  const existing = (key: string, what: string): number => {
    const i: number | undefined = index.get(key);
    if (i === undefined) throw new Error(`${what} names a point no patch made`);
    return i;
  };
  // a bridge may run along a network curve no patch samples, but a sweep point it names must be one a patch made
  const joined = (point: IAutoMovieSurfaceSample, what: string): number =>
    point.key.startsWith("s|") ? existing(point.key, what) : admit(point);
  const sample = (edge: IAutoMovieSurfaceNetwork.IEdge, what: string): IAutoMovieSurfaceSample[] => {
    if (edge.type === "sweep") {
      const n: number = count(edge.segments, what);
      const rig: IAutoMovieSweepRig = sweepRig(edge.sweep);
      return Array.from({ length: n + 1 }, (_: unknown, i: number): IAutoMovieSurfaceSample => {
        const u: number = i === n ? edge.to.u : edge.from.u + ((edge.to.u - edge.from.u) * i) / n;
        const v: number = i === n ? edge.to.v : edge.from.v + ((edge.to.v - edge.from.v) * i) / n;
        const [ub, ua] = reach((edge.to.u - edge.from.u) / n, i === 0, i === n);
        const [vb, va] = reach((edge.to.v - edge.from.v) / n, i === 0, i === n);
        return {
          key: sweepKey(edge.sweep, u, v),
          writer: () => rig.sample(u, v, [0, 0, 0, 0]),
          point: { sweep: edge.sweep, u, v, cell: [ub, ua, vb, va] },
          sweep: { rig, u, v },
          curve: null,
        };
      });
    }
    const curve: IAutoMovieSurfaceNetwork.ICurve | undefined = network.curves?.[edge.curve];
    if (curve === undefined) throw new Error(`${what} names unknown curve ${edge.curve}`);
    if (curve.from === curve.to) throw new Error(`curve ${edge.curve} must join two different nodes`);
    const n: number = count(curve.segments, `curve ${edge.curve}`);
    const rig: IAutoMovieSurfaceCurveRig = curveRig(edge.curve, curve);
    const reverse: boolean = edge.reverse ?? false;
    return Array.from({ length: n + 1 }, (_: unknown, i: number): IAutoMovieSurfaceSample => {
      const t: number = reverse ? (n - i) / n : i / n;
      const end: string | null = t === 0 ? curve.from : t === 1 ? curve.to : null;
      const at: IAutoMovieSurfaceNetwork.INode | null = end === null ? null : network.nodes![end]!;
      return {
        key: end !== null ? node(end).key : `c|${edge.curve}|${round(t)}`,
        writer: () => (end !== null ? node(end).write : (out: Float64Array, offset: number): void => rig.point(t, out, offset)),
        point: at !== null && at.type === "sweep" ? { sweep: at.sweep, u: at.u, v: at.v, cell: [Infinity, Infinity, Infinity, Infinity] } : null,
        sweep: null,
        curve: { rig, t },
      };
    });
  };
  const loop = (edges: IAutoMovieSurfaceNetwork.IEdge[], what: string): IAutoMovieSurfaceSample[] => {
    if (edges.length === 0) throw new Error(`${what} needs at least one edge`);
    const out: IAutoMovieSurfaceSample[] = [];
    edges.forEach((edge: IAutoMovieSurfaceNetwork.IEdge, k: number): void => {
      const points: IAutoMovieSurfaceSample[] = sample(edge, what);
      if (k > 0 && points[0]!.key !== out[out.length - 1]!.key)
        throw new Error(`${what} edge ${k} does not start where edge ${k - 1} ends`);
      out.push(...(k > 0 ? points.slice(1) : points));
    });
    if (out[out.length - 1]!.key !== out[0]!.key) throw new Error(`${what} does not close`);
    out.pop();
    return out;
  };

  const blend: Set<number> = new Set();
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
        uvs.push(rect.s[0] + ((rect.s[1] - rect.s[0]) * i) / columns, rect.t[0] + ((rect.t[1] - rect.t[0]) * j) / rows);
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
          quad.map(([a, b]: [number, number]): IAutoMovieSurfaceCoordinate => ({ patch: p, s: a / columns, t: b / rows })) as IAutoMovieSurfaceCage["corners"][number],
        );
      }
    grids[p] = { name: patch.name, columns, rows, faces: faceList };
  };

  const order: number[] = network.patches
    .map((_: IAutoMovieSurfaceNetwork.IPatch, p: number): number => p)
    .sort((a: number, b: number): number => Number(network.patches[a]!.type === "bridge") - Number(network.patches[b]!.type === "bridge") || a - b);
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
      sweepRig(patch.sweep);
      const grid: number[][] = Array.from({ length: rows + 1 }, (_: unknown, j: number): number[] => {
        const u: number = j === rows ? u1 : u0 + ((u1 - u0) * j) / rows;
        return Array.from({ length: columns + 1 }, (__: unknown, i: number): number => {
          const v: number = i === columns ? v1 : v0 + ((v1 - v0) * i) / columns;
          const [ub, ua] = reach((u1 - u0) / rows, j === 0, j === rows);
          const [vb, va] = reach((v1 - v0) / columns, i === 0, i === columns);
          return admit({
            key: sweepKey(patch.sweep, u, v),
            writer: () => sweepRig(patch.sweep).sample(u, v, [0, 0, 0, 0]),
            point: { sweep: patch.sweep, u, v, cell: [ub, ua, vb, va] },
            sweep: null,
            curve: null,
          });
        });
      });
      emit(p, grid, columns, rows, false);
    } else if (patch.type === "coons") {
      const [bottom, right, top, left] = patch.sides.map((e: IAutoMovieSurfaceNetwork.IEdge, k: number): IAutoMovieSurfaceSample[] =>
        sample(e, `${what} side ${k}`),
      ) as [IAutoMovieSurfaceSample[], IAutoMovieSurfaceSample[], IAutoMovieSurfaceSample[], IAutoMovieSurfaceSample[]];
      const columns: number = bottom.length - 1;
      const rows: number = right.length - 1;
      if (top.length !== bottom.length || left.length !== right.length) throw new Error(`${what} opposite sides differ in count`);
      const ends: Array<[IAutoMovieSurfaceSample[], IAutoMovieSurfaceSample[]]> = [
        [bottom, right],
        [right, top],
        [top, left],
        [left, bottom],
      ];
      ends.forEach(([a, b]: [IAutoMovieSurfaceSample[], IAutoMovieSurfaceSample[]], k: number): void => {
        if (a[a.length - 1]!.key !== b[0]!.key) throw new Error(`${what} side ${k} does not end where side ${(k + 1) % 4} starts`);
      });
      const edgeAt = (i: number, j: number): IAutoMovieSurfaceSample | null =>
        j === 0 ? bottom[i]! : j === rows ? top[columns - i]! : i === 0 ? left[rows - j]! : i === columns ? right[j]! : null;
      const grid: number[][] = Array.from({ length: rows + 1 }, (_: unknown, j: number): number[] =>
        Array.from({ length: columns + 1 }, (__: unknown, i: number): number => {
          const e: IAutoMovieSurfaceSample | null = edgeAt(i, j);
          return e === null ? -1 : admit(e);
        }),
      );
      for (let j: number = 1; j < rows; ++j)
        for (let i: number = 1; i < columns; ++i) {
          grid[j]![i] = reserve(`p|${p}|${i}|${j}`);
          blend.add(grid[j]![i]!);
        }
      writers.push(rigAutoMovieSurfaceCoons(grid));
      emit(p, grid, columns, rows, false);
    } else {
      const rows: number = count(patch.rows, what);
      const a: IAutoMovieSurfaceSample[] = loop(patch.from.edges, `${what} from loop`);
      const b: IAutoMovieSurfaceSample[] = loop(patch.to.edges, `${what} to loop`);
      if (a.length !== b.length) throw new Error(`${what} loops differ in count, ${a.length} and ${b.length}`);
      const tension: number = patch.tension ?? 1;
      if (!(tension > 0) || !Number.isFinite(tension)) throw new Error(`${what} tension must be positive`);
      const n: number = a.length;
      const fromIndex: number[] = a.map((x: IAutoMovieSurfaceSample): number => joined(x, `${what} from loop`));
      const toIndex: number[] = b.map((x: IAutoMovieSurfaceSample): number => joined(x, `${what} to loop`));
      const probes: number[] = [...a, ...b].map((x: IAutoMovieSurfaceSample): number =>
        x.sweep === null ? -1 : x.sweep.rig.probe(x.sweep.u, x.sweep.v),
      );
      const grid: number[][] = Array.from({ length: rows + 1 }, (): number[] => new Array<number>(n));
      const interior: number[] = [];
      for (let k: number = 0; k < n; ++k) {
        grid[0]![k] = fromIndex[k]!;
        grid[rows]![k] = toIndex[k]!;
        for (let j: number = 1; j < rows; ++j) {
          const target: number = reserve(`p|${p}|${k}|${j}`);
          grid[j]![k] = target;
          interior.push(target);
          blend.add(target);
        }
      }
      writers.push(
        rigAutoMovieSurfaceBridge({ from: a, to: b, fromIndex, toIndex, fromRule: patch.from.tangent, toRule: patch.to.tangent, probes, rows, tension, interior }),
      );
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

  const pinned: boolean[] = new Array<boolean>(vertices).fill(false);
  const pins: Array<(targets: Float64Array) => void> = [];
  const rings: Record<string, number[]> = {};
  for (const ring of network.rings ?? []) {
    if (ring.name in rings) throw new Error(`ring name ${ring.name} repeats`);
    const members: number[] = loop(ring.edges, `ring ${ring.name}`).map((s: IAutoMovieSurfaceSample): number => existing(s.key, `ring ${ring.name}`));
    if (ring.positions !== undefined) {
      if (ring.positions.length !== members.length)
        throw new Error(`ring ${ring.name} has ${members.length} vertices but ${ring.positions.length} positions`);
      const bone: number = boneOf(bindings.rings?.[ring.name]);
      members.forEach((v: number, k: number): void => {
        const p: IAutoMovieVector3 = ring.positions![k]!;
        if (![p.x, p.y, p.z].every(Number.isFinite)) throw new Error(`ring ${ring.name} position ${k} is not finite`);
        const write: (out: Float64Array, at: number) => void = riding(p, bone);
        pins.push((targets: Float64Array): void => write(targets, 3 * v));
        pinned[v] = true;
      });
    }
    rings[ring.name] = members;
  }
  finalize();
  for (const rig of sweeps.values()) rig.seal();

  const fit: boolean = props.fit ?? true;
  const stencil: IAutoMovieSubdivisionStencil | null = fit ? stencilAutoMovieSubdivisionLimit(faces, vertices) : null;
  // blend vertices are controls of their own construction, not samples of a surface to pass through
  const free: Uint8Array = Uint8Array.from({ length: vertices }, (_: unknown, i: number): number => (pinned[i] || blend.has(i) ? 0 : 1));
  const targets: Float64Array = new Float64Array(3 * vertices);
  const scratch: Float64Array = new Float64Array(3 * vertices);
  const evaluate = (posed: readonly IAutoMovieResolvedBone[] | null): void => {
    if (bones !== null) {
      if (posed === null) bones.reset();
      else bones.update(posed);
    }
    for (const rig of sweeps.values()) rig.pose(posed === null ? null : bones);
    for (const curve of curves.values()) curve.update();
    for (const write of writers) write(targets);
    for (const pin of pins) pin(targets);
    for (let k: number = 0; k < targets.length; ++k)
      if (!Number.isFinite(targets[k]!)) throw new Error(`network point ${Math.floor(k / 3)} is not finite`);
  };
  const place = (positions: Float64Array): number => {
    if (stencil === null) {
      positions.set(targets);
      return 0;
    }
    return solveAutoMovieSubdivisionLimit({ stencil, targets, free, positions, scratch });
  };

  evaluate(null);
  const restPositions: Float64Array = new Float64Array(3 * vertices);
  const residual: number = place(restPositions);
  if (stencil !== null) {
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
    if (residual > FIT_LIMIT * extent) throw new Error(`limit fit did not converge, residual ${residual}`);
  }
  const cage: IAutoMovieSurfaceCage = {
    tier,
    cage: { positions: Array.from(restPositions), faces, uvs, uvFaces },
    targets: Array.from(targets),
    pinned,
    corners,
    patches: grids,
    rings,
    residual,
  };
  return {
    cage,
    bones: bones?.bones ?? [],
    pose: (posed: readonly IAutoMovieResolvedBone[], positions: Float64Array, out?: Float64Array): number => {
      if (positions.length !== 3 * vertices) throw new Error(`a posed cage needs ${3 * vertices} position numbers, not ${positions.length}`);
      if (out !== undefined && out.length !== 3 * vertices) throw new Error(`a posed cage needs ${3 * vertices} target numbers, not ${out.length}`);
      evaluate(bones === null ? null : posed);
      if (out !== undefined) out.set(targets);
      return place(positions);
    },
  };
};

/** A sweep point awaiting its writer: the sweep, domain point, the finest spacing reported on each side, and the writer once made. */
interface IPending {
  sweep: string;
  u: number;
  v: number;
  cell: [number, number, number, number];
  write: (out: Float64Array, at: number) => void;
}
