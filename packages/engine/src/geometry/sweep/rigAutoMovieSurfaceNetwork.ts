import { AutoMovieHumanoidBone, IAutoMovieVector3 } from "@automovie/interface";

import { IAutoMovieResolvedBone } from "../../kinematics/IAutoMovieResolvedBone";
import { AutoMovieSurfaceTier } from "./AutoMovieSurfaceTier";
import { IAutoMovieBoneBuffer } from "./IAutoMovieBoneBuffer";
import { IAutoMovieSubdivisionStencil } from "./IAutoMovieSubdivisionStencil";
import { IAutoMovieSurfaceCage } from "./IAutoMovieSurfaceCage";
import { IAutoMovieSurfaceConstruction } from "./IAutoMovieSurfaceConstruction";
import { IAutoMovieSurfaceCurveRig } from "./IAutoMovieSurfaceCurveRig";
import { IAutoMovieSurfaceNetwork } from "./IAutoMovieSurfaceNetwork";
import { IAutoMovieSurfacePoint } from "./IAutoMovieSurfacePoint";
import { IAutoMovieSurfaceRegistry } from "./IAutoMovieSurfaceRegistry";
import { IAutoMovieSurfaceRig } from "./IAutoMovieSurfaceRig";
import { IAutoMovieSurfaceSample } from "./IAutoMovieSurfaceSample";
import { IAutoMovieSweepBinding } from "./IAutoMovieSweepBinding";
import { IAutoMovieSweepRig } from "./IAutoMovieSweepRig";
import { bufferAutoMovieBones } from "./bufferAutoMovieBones";
import { holdAutoMovieSurfaceGirths } from "./holdAutoMovieSurfaceGirths";
import { planAutoMovieSurfaceRigPatches } from "./planAutoMovieSurfaceRigPatches";
import { prepareAutoMovieSurfaceConstruction } from "./prepareAutoMovieSurfaceConstruction";
import { reachAutoMovieSurfaceCell } from "./reachAutoMovieSurfaceCell";
import { registerAutoMovieSurfaceVertices } from "./registerAutoMovieSurfaceVertices";
import { rigAutoMovieSurfaceCurve } from "./rigAutoMovieSurfaceCurve";
import { rigAutoMovieSweep } from "./rigAutoMovieSweep";
import { solveAutoMovieSubdivisionLimit } from "./solveAutoMovieSubdivisionLimit";
import { stencilAutoMovieSubdivisionLimit } from "./stencilAutoMovieSubdivisionLimit";

/** Decimal places domain parameters are rounded to when they name a shared vertex. */
const KEY_DIGITS: number = 9;

/** Fit residual above which the rest cage is refused, relative to the cage's extent. */
const FIT_LIMIT: number = 1e-6;

/**
 * Compile a surface network at one tier into its rest cage and a per-pose update of the cage's control positions.
 *
 * Each patch becomes a grid of its tier's rows and columns, sampled evenly in its own coordinates. A sweep patch evaluates its sweep, its radius averaged over each vertex's cell, which reaches half the spacing to the neighbouring sample on each side along `u` and `v`, as `IAutoMovieSweepRig.sample` states, so detail finer than the tier's grid fades instead of aliasing into ripples. A point sampled by several patches or sides takes, on each side, the finest spacing any of them gives there, and a side none of them reaches mirrors the other, so a point's position does not depend on patch order and a mirrored layout samples to a mirrored cage; a node on a sweep that no grid samples is the section point itself. A Coons patch takes its four sides' points and fills the interior as `rigAutoMovieSurfaceCoons` states; a bridge fills its rows with cubic Hermite curves between its two loops, as `rigAutoMovieSurfaceBridge` states; a transition band lays its quads out by `layoutAutoMovieSurfaceTransition` and samples every corner on its sweep. A network curve is compiled by `rigAutoMovieSurfaceCurve`, which makes it meet sweep nodes in their tangent planes. Vertices are shared by identity, never by distance: a point of a sweep is named by the sweep and its domain coordinates rounded to nine decimals, a curve point by the curve and its share, a node by its name.
 *
 * The patch grids alone decide the topology, so one network gives every input and every pose the same cage at a tier. A ring may only name points that patches made, and a bridge loop only sweep points that patches made, which catches sides that do not meet; an edge used twice in the same direction is refused as overlapping or misoriented patches.
 *
 * With `fit` (the default) the samples of sweeps and curves are targets the cage's Catmull-Clark limit passes through, solved by `solveAutoMovieSubdivisionLimit`; the interior vertices of Coons patches and bridges are blend controls of their own construction and keep their samples as control positions, because interpolating a blend's samples makes the limit surface ring between them where a loop turns sharply; pinned ring vertices keep their given positions. Without, controls are the samples themselves and the residual is 0. A ring that declares a perimeter is held to it at rest by `holdAutoMovieSurfaceGirths`, a radial factor along its sweep that every pose keeps. Every face corner carries `(patch, s, t)` and a UV value: the patch's rectangle in texture space, or the band `t in [k / P, (k + 1) / P]` of the unit square for patch `k` of `P`.
 *
 * Bindings make the rig posable exactly as `poseAutoMovieSurfaceNetwork` poses the network: bound sweeps by `rigAutoMovieSweep`, free nodes, curve through points, normals and directions and ring positions rigidly with their bones. Everything else is computed here once; `pose` refreshes only the bones, the bound sweeps, the curves, the samples, the blends, the pins and the fit, into buffers sized here.
 *
 * @param props.network The network, only read; its sweeps are retained through their rigs.
 * @param props.tier The tier to sample.
 * @param props.fit Whether to fit controls to the limit surface; omitted, true.
 * @param props.bindings Bones by name for sweeps, free nodes, curves and rings; omitted, none.
 * @param props.rest Bones at rest, required with bindings.
 * @param props.construction Optional rest construction sample counts; inspection uses the same unfiltered sweep and curve writers after the girth solve.
 * @param props.preserveVolume Whether bound sweeps keep their rest volume at joint stations; omitted, false.
 * @returns The rig.
 * @throws Error when a name is unknown or repeated, a binding names nothing in the network or comes without rest bones, a count is not a positive integer, a curve meets a sweep along its normal, a patch's opposite sides differ in count or its sides do not close, a bridge's loops differ in count or name points no patch made, a ring's positions do not match its loop, patches overlap, or the rest fit does not converge.
 *
 * @evidence contracts/common.md#principled-implementation A multi-block structured cage: each block samples its defining surface on a regular grid, blocks weld by exact identity, the limit fit inverts the subdivision stencils for samples of authored surfaces and keeps blend controls, and posing is sweep-based deformation split into its pose-invariant compile and per-pose evaluation.
 * @evidence contracts/common.md#clear-and-simple-design Patch layout is delegated to `planAutoMovieSurfaceRigPatches`; one compile records, per vertex, the writer that evaluates it; the rest cage and every pose run the same writers, and `sampleAutoMovieSurfaceNetwork` is this rig at rest. Vertex registration, face layout, sweeps, curves, Coons patches, bridges, bones and the fit are their own modules.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No vertex is welded by proximity and no gap is stitched; bindings naming nothing are refused; a rest fit that does not converge is refused, and every pose returns its residual.
 * @evidence contracts/common.md#meaningful-documentation States each fill rule and its source, the welding identity, the topology guarantee, the fit and why blends are held, pinning, the UV default, the posing rules and every refusal.
 * @evidence contracts/performance.md#efficient-algorithms Compile, for P patches, V vertices and F faces: O(P log P) patch ordering plus O(V) map operations and sweep queries, O(F) for the orientation check and stencils, plus each sweep's compile and O(N) requested construction writers and reads. Pose: O(V) writers of constant size, each bound sweep's and curve's update including O(N) registered observation frame/scale slots, O(n r) per bridge and the fit's O(V + F) per Jacobi sweep, with no allocation.
 * @evidence contracts/performance.md#reuse-equivalent-work Shapes, Coons weights, Hermite weights, stencils and rest volumes are computed once; a vertex shared by patches is evaluated once per pose.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Retains the cage record, one writer per vertex or blend, four position buffers of 3 V numbers, the stencils, and each sweep's and curve's rig with its compiled surface, whose row cache `compileAutoMovieSweep` bounds at 8,192 rows and which posing does not grow; requested construction temporarily adds one writer per sample, clears those writers after reading, and retains the registered observation frame/scale slots and the separate rest snapshot until the rig is released.
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
  construction?: IAutoMovieSurfaceConstruction.ISamples;
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
  construction?: IAutoMovieSurfaceConstruction.ISamples;
}): IAutoMovieSurfaceRig => {
  const { network, tier }: typeof props = props;
  const bindings: NonNullable<typeof props.bindings> = props.bindings ?? {};
  function known(
    names: string[],
    record: object | undefined,
    what: string,
  ): void {
    for (const name of Object.keys(record ?? {}))
      if (!names.includes(name))
        throw new Error(`binding names unknown ${what} ${name}`);
  }
  known(Object.keys(network.sweeps), bindings.sweeps, "sweep");
  known(Object.keys(network.nodes ?? {}), bindings.nodes, "node");
  known(Object.keys(network.curves ?? {}), bindings.curves, "curve");
  known(
    (network.rings ?? []).map(
      (r: IAutoMovieSurfaceNetwork.IRing): string => r.name,
    ),
    bindings.rings,
    "ring",
  );
  const bound: boolean = [
    bindings.sweeps,
    bindings.nodes,
    bindings.curves,
    bindings.rings,
  ].some((r: object | undefined): boolean => Object.keys(r ?? {}).length > 0);
  if (bound && props.rest === undefined)
    throw new Error("a rig with bindings needs the rest bones");
  const bones: IAutoMovieBoneBuffer | null =
    props.rest === undefined ? null : bufferAutoMovieBones(props.rest);
  function boneOf(bone: AutoMovieHumanoidBone | undefined): number {
    return bone === undefined || bones === null ? -1 : bones.index(bone);
  }

  const sweeps: Map<string, IAutoMovieSweepRig> = new Map();
  function sweepRig(name: string): IAutoMovieSweepRig {
    let r: IAutoMovieSweepRig | undefined = sweeps.get(name);
    if (r === undefined) {
      const sweep: IAutoMovieSurfaceNetwork["sweeps"][string] | undefined =
        network.sweeps[name];
      if (sweep === undefined)
        throw new Error(`network names unknown sweep ${name}`);
      const b: IAutoMovieSweepBinding | undefined = bindings.sweeps?.[name];
      r = rigAutoMovieSweep({
        sweep,
        ...(b === undefined
          ? {}
          : {
              binding: {
                points: b.points.map((bone: AutoMovieHumanoidBone): number =>
                  boneOf(bone),
                ),
                stations: b.stations.map(
                  (s: AutoMovieHumanoidBone[]): number[] =>
                    s.map((bone: AutoMovieHumanoidBone): number =>
                      boneOf(bone),
                    ),
                ),
              },
            }),
        preserveVolume: props.preserveVolume ?? false,
      });
      sweeps.set(name, r);
    }
    return r;
  }
  function count(
    counts: IAutoMovieSurfaceNetwork.ICounts,
    what: string,
  ): number {
    const n: number = counts[tier];
    if (!Number.isSafeInteger(n) || n < 1)
      throw new Error(`${what} needs a positive integer count at tier ${tier}`);
    return n;
  }
  const SCALE: number = 10 ** KEY_DIGITS;
  function round(x: number): number {
    return Math.round(x * SCALE);
  }
  // v is read modulo one turn after rounding, so v near 0 and near 1 name the same point
  function sweepKey(name: string, u: number, v: number): string {
    return `s|${name}|${round(Math.min(1, Math.max(0, u)))}|${((round(v) % SCALE) + SCALE) % SCALE}`;
  }
  function rest3(p: IAutoMovieVector3): Float64Array {
    return Float64Array.from([p.x, p.y, p.z]);
  }
  // a point that rides a bone, or stays where it is without one
  function riding(
    p: IAutoMovieVector3,
    bone: number,
  ): (out: Float64Array, at: number) => void {
    const rest: Float64Array = rest3(p);
    return (out: Float64Array, at: number): void => {
      if (bone >= 0) bones!.apply(bone, rest, 0, out, at);
      else for (let c: number = 0; c < 3; ++c) out[at + c] = rest[c]!;
    };
  }
  const nodes: Map<string, IAutoMovieSurfacePoint & { key: string }> =
    new Map();
  function node(name: string): IAutoMovieSurfacePoint & { key: string } {
    let found: (IAutoMovieSurfacePoint & { key: string }) | undefined =
      nodes.get(name);
    if (found !== undefined) return found;
    const n: IAutoMovieSurfaceNetwork.INode | undefined = network.nodes?.[name];
    if (n === undefined) throw new Error(`network names unknown node ${name}`);
    found =
      n.type === "point"
        ? {
            key: `n|${name}`,
            write: riding(n.position, boneOf(bindings.nodes?.[name])),
            probe: null,
          }
        : {
            key: sweepKey(n.sweep, n.u, n.v),
            write: sweepRig(n.sweep).sample(n.u, n.v, [0, 0, 0, 0]),
            probe: {
              rig: sweepRig(n.sweep),
              slot: sweepRig(n.sweep).probe(n.u, n.v),
            },
          };
    nodes.set(name, found);
    return found;
  }
  const curves: Map<string, IAutoMovieSurfaceCurveRig> = new Map();
  function curveRig(
    name: string,
    curve: IAutoMovieSurfaceNetwork.ICurve,
  ): IAutoMovieSurfaceCurveRig {
    let r: IAutoMovieSurfaceCurveRig | undefined = curves.get(name);
    if (r === undefined) {
      r = rigAutoMovieSurfaceCurve({
        name,
        curve,
        from: node(curve.from),
        to: node(curve.to),
        bone: boneOf(bindings.curves?.[name]),
        bones,
      });
      curves.set(name, r);
    }
    return r;
  }

  const registry: IAutoMovieSurfaceRegistry =
    registerAutoMovieSurfaceVertices(sweepRig);
  const { writers, existing }: IAutoMovieSurfaceRegistry = registry;
  function sample(
    edge: IAutoMovieSurfaceNetwork.IEdge,
    what: string,
  ): IAutoMovieSurfaceSample[] {
    if (edge.type === "sweep") {
      const n: number = count(edge.segments, what);
      const rig: IAutoMovieSweepRig = sweepRig(edge.sweep);
      return Array.from(
        { length: n + 1 },
        (_: unknown, i: number): IAutoMovieSurfaceSample => {
          const u: number =
            i === n
              ? edge.to.u
              : edge.from.u + ((edge.to.u - edge.from.u) * i) / n;
          const v: number =
            i === n
              ? edge.to.v
              : edge.from.v + ((edge.to.v - edge.from.v) * i) / n;
          const [ub, ua]: [number, number] = reachAutoMovieSurfaceCell(
            (edge.to.u - edge.from.u) / n,
            i === 0,
            i === n,
          );
          const [vb, va]: [number, number] = reachAutoMovieSurfaceCell(
            (edge.to.v - edge.from.v) / n,
            i === 0,
            i === n,
          );
          return {
            key: sweepKey(edge.sweep, u, v),
            writer: (): ((out: Float64Array, at: number) => void) =>
              rig.sample(u, v, [0, 0, 0, 0]),
            point: { sweep: edge.sweep, u, v, cell: [ub, ua, vb, va] },
            sweep: { rig, u, v },
            curve: null,
          };
        },
      );
    }
    const curve: IAutoMovieSurfaceNetwork.ICurve | undefined =
      network.curves?.[edge.curve];
    if (curve === undefined)
      throw new Error(`${what} names unknown curve ${edge.curve}`);
    if (curve.from === curve.to)
      throw new Error(`curve ${edge.curve} must join two different nodes`);
    const n: number = count(curve.segments, `curve ${edge.curve}`);
    const rig: IAutoMovieSurfaceCurveRig = curveRig(edge.curve, curve);
    const reverse: boolean = edge.reverse ?? false;
    return Array.from(
      { length: n + 1 },
      (_: unknown, i: number): IAutoMovieSurfaceSample => {
        const t: number = reverse ? (n - i) / n : i / n;
        const end: string | null =
          t === 0 ? curve.from : t === 1 ? curve.to : null;
        const at: IAutoMovieSurfaceNetwork.INode | null =
          end === null ? null : network.nodes![end]!;
        return {
          key: end !== null ? node(end).key : `c|${edge.curve}|${round(t)}`,
          writer: (): ((out: Float64Array, offset: number) => void) =>
            end !== null
              ? node(end).write
              : (out: Float64Array, offset: number): void =>
                  rig.point(t, out, offset),
          point:
            at !== null && at.type === "sweep"
              ? {
                  sweep: at.sweep,
                  u: at.u,
                  v: at.v,
                  cell: [Infinity, Infinity, Infinity, Infinity],
                }
              : null,
          sweep: null,
          curve: { rig, t },
        };
      },
    );
  }
  function loop(
    edges: IAutoMovieSurfaceNetwork.IEdge[],
    what: string,
  ): IAutoMovieSurfaceSample[] {
    if (edges.length === 0) throw new Error(`${what} needs at least one edge`);
    const out: IAutoMovieSurfaceSample[] = [];
    edges.forEach((edge: IAutoMovieSurfaceNetwork.IEdge, k: number): void => {
      const points: IAutoMovieSurfaceSample[] = sample(edge, what);
      if (k > 0 && points[0]!.key !== out[out.length - 1]!.key)
        throw new Error(
          `${what} edge ${k} does not start where edge ${k - 1} ends`,
        );
      out.push(...(k > 0 ? points.slice(1) : points));
    });
    if (out[out.length - 1]!.key !== out[0]!.key)
      throw new Error(`${what} does not close`);
    out.pop();
    return out;
  }

  const { layout, blend }: ReturnType<typeof planAutoMovieSurfaceRigPatches> =
    planAutoMovieSurfaceRigPatches({
      network,
      registry,
      sweepRig,
      count,
      sweepKey,
      sample,
      loop,
    });
  const faces: number[][] = layout.faces;
  const vertices: number = registry.count();

  const pinned: boolean[] = new Array<boolean>(vertices).fill(false);
  const pins: Array<(targets: Float64Array) => void> = [];
  const rings: Record<string, number[]> = {};
  for (const ring of network.rings ?? []) {
    if (ring.name in rings) throw new Error(`ring name ${ring.name} repeats`);
    const members: number[] = loop(ring.edges, `ring ${ring.name}`).map(
      (s: IAutoMovieSurfaceSample): number =>
        existing(s.key, `ring ${ring.name}`),
    );
    if (ring.positions !== undefined) {
      if (ring.positions.length !== members.length)
        throw new Error(
          `ring ${ring.name} has ${members.length} vertices but ${ring.positions.length} positions`,
        );
      const bone: number = boneOf(bindings.rings?.[ring.name]);
      members.forEach((v: number, k: number): void => {
        const p: IAutoMovieVector3 = ring.positions![k]!;
        if (![p.x, p.y, p.z].every(Number.isFinite))
          throw new Error(`ring ${ring.name} position ${k} is not finite`);
        const write: (out: Float64Array, at: number) => void = riding(p, bone);
        pins.push((targets: Float64Array): void => write(targets, 3 * v));
        pinned[v] = true;
      });
    }
    rings[ring.name] = members;
  }
  const inspect: () => IAutoMovieSurfaceConstruction[] =
    prepareAutoMovieSurfaceConstruction({
      network,
      sweepRig,
      curveRig,
      samples: props.construction,
    });
  registry.finalize();
  for (const rig of sweeps.values()) rig.seal();

  const fit: boolean = props.fit ?? true;
  const stencil: IAutoMovieSubdivisionStencil | null = fit
    ? stencilAutoMovieSubdivisionLimit(faces, vertices)
    : null;
  // blend vertices are controls of their own construction, not samples of a surface to pass through
  const free: Uint8Array = Uint8Array.from(
    { length: vertices },
    (_: unknown, i: number): number => (pinned[i] || blend.has(i) ? 0 : 1),
  );
  const targets: Float64Array = new Float64Array(3 * vertices);
  const scratch: Float64Array = new Float64Array(3 * vertices);
  function evaluate(posed: readonly IAutoMovieResolvedBone[] | null): void {
    if (bones !== null) {
      if (posed === null) bones.reset();
      else bones.update(posed);
    }
    for (const rig of sweeps.values()) rig.pose(posed === null ? null : bones);
    for (const curve of curves.values()) curve.update();
    for (const write of writers) write(targets);
    for (const pin of pins) pin(targets);
    for (let k: number = 0; k < targets.length; ++k)
      if (!Number.isFinite(targets[k]!))
        throw new Error(`network point ${Math.floor(k / 3)} is not finite`);
  }
  function place(positions: Float64Array): number {
    if (stencil === null) {
      positions.set(targets);
      return 0;
    }
    return solveAutoMovieSubdivisionLimit({
      stencil,
      targets,
      free,
      positions,
      scratch,
    });
  }

  const restPositions: Float64Array = new Float64Array(3 * vertices);
  holdAutoMovieSurfaceGirths({
    network,
    rings,
    faces,
    vertices,
    sweepRig,
    rest: (positions: Float64Array): void => {
      evaluate(null);
      place(positions);
    },
    positions: restPositions,
  });
  evaluate(null);
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
    if (residual > FIT_LIMIT * extent)
      throw new Error(`limit fit did not converge, residual ${residual}`);
  }
  const cage: IAutoMovieSurfaceCage = {
    tier,
    cage: {
      positions: Array.from(restPositions),
      faces,
      uvs: layout.uvs,
      uvFaces: layout.uvFaces,
    },
    targets: Array.from(targets),
    pinned,
    corners: layout.corners,
    patches: layout.grids,
    rings,
    residual,
  };
  return {
    cage,
    construction: inspect(),
    bones: bones?.bones ?? [],
    pose: (
      posed: readonly IAutoMovieResolvedBone[],
      positions: Float64Array,
      out?: Float64Array,
    ): number => {
      if (positions.length !== 3 * vertices)
        throw new Error(
          `a posed cage needs ${3 * vertices} position numbers, not ${positions.length}`,
        );
      if (out !== undefined && out.length !== 3 * vertices)
        throw new Error(
          `a posed cage needs ${3 * vertices} target numbers, not ${out.length}`,
        );
      evaluate(bones === null ? null : posed);
      if (out !== undefined) out.set(targets);
      return place(positions);
    },
  };
};
