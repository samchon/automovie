import { IAutoMovieSurfaceLayout } from "./IAutoMovieSurfaceLayout";
import { IAutoMovieSurfaceNetwork } from "./IAutoMovieSurfaceNetwork";
import { IAutoMovieSurfaceRegistry } from "./IAutoMovieSurfaceRegistry";
import { IAutoMovieSurfaceSample } from "./IAutoMovieSurfaceSample";
import { IAutoMovieSweepRig } from "./IAutoMovieSweepRig";
import { layoutAutoMovieSurfacePatches } from "./layoutAutoMovieSurfacePatches";
import { layoutAutoMovieSurfaceTransition } from "./layoutAutoMovieSurfaceTransition";
import { reachAutoMovieSurfaceCell } from "./reachAutoMovieSurfaceCell";
import { rigAutoMovieSurfaceBridge } from "./rigAutoMovieSurfaceBridge";
import { rigAutoMovieSurfaceCoons } from "./rigAutoMovieSurfaceCoons";

/**
 * Lay out the sweep, transition, Coons and bridge blocks of a surface rig, preserving the sampler's vertex registration order and cell reaches.
 *
 * @param props Network, registry and the rig's shared edge/sweep evaluators
 * @returns The checked patch layout and the blend-control vertex indices
 * @throws Error for duplicate names, invalid patch ranges or counts, incompatible sides or loops, or overlapping patches
 *
 * @evidence contracts/common.md#principled-implementation The same structured grids, reduction strips, Coons boundaries and Hermite bridges as the surface-network declaration, welded through the shared vertex registry.
 * @evidence contracts/common.md#clear-and-simple-design Owns patch topology and blend writers; the orchestrator owns names, curves, fitting and posing.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Preserves patch order, exact identities and every layout refusal; no proximity welding or numerical adjustment is introduced.
 * @evidence contracts/common.md#meaningful-documentation States inputs, output ownership and refusal classes.
 * @evidence contracts/performance.md#efficient-algorithms O(P log P + V + F) for P patches, V emitted vertices and F faces; bridges follow other blocks so their boundaries already exist.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The supplied registry deduplicates shared vertices; each patch's topology is emitted once.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Transfers layout arrays and the blend index Set to the owning rig; temporary edge samples are released on return.
 */
export function planAutoMovieSurfaceRigPatches(props: {
  network: IAutoMovieSurfaceNetwork;
  registry: IAutoMovieSurfaceRegistry;
  sweepRig: (name: string) => IAutoMovieSweepRig;
  count: (counts: IAutoMovieSurfaceNetwork.ICounts, what: string) => number;
  sweepKey: (name: string, u: number, v: number) => string;
  sample: (
    edge: IAutoMovieSurfaceNetwork.IEdge,
    what: string,
  ) => IAutoMovieSurfaceSample[];
  loop: (
    edges: IAutoMovieSurfaceNetwork.IEdge[],
    what: string,
  ) => IAutoMovieSurfaceSample[];
}): IOutput {
  const {
    network,
    registry,
    sweepRig,
    count,
    sweepKey,
    sample,
    loop,
  }: typeof props = props;
  const { writers, reserve, admit, existing }: IAutoMovieSurfaceRegistry =
    registry;
  // a bridge may run along a network curve no patch samples, but a sweep point it names must be one a patch made
  const joined = (point: IAutoMovieSurfaceSample, what: string): number =>
    point.key.startsWith("s|") ? existing(point.key, what) : admit(point);
  const blend: Set<number> = new Set();
  const layout: IAutoMovieSurfaceLayout =
    layoutAutoMovieSurfacePatches(network);
  const { emit }: IAutoMovieSurfaceLayout = layout;
  const names: Set<string> = new Set();

  const order: number[] = network.patches
    .map((_: IAutoMovieSurfaceNetwork.IPatch, p: number): number => p)
    .sort(
      (a: number, b: number): number =>
        Number(network.patches[a]!.type === "bridge") -
          Number(network.patches[b]!.type === "bridge") || a - b,
    );
  for (const p of order) {
    const patch: IAutoMovieSurfaceNetwork.IPatch = network.patches[p]!;
    const what: string = `patch ${patch.name}`;
    if (names.has(patch.name))
      throw new Error(`patch name ${patch.name} repeats`);
    names.add(patch.name);
    if (patch.type === "sweep") {
      const columns: number = count(patch.columns, what);
      const rows: number = count(patch.rows, what);
      const [u0, u1]: [number, number] = patch.u;
      const [v0, v1]: [number, number] = patch.v;
      if (!(u0 >= 0 && u1 <= 1 && u1 > u0))
        throw new Error(`${what} u range must increase within 0 to 1`);
      if (!(v1 > v0 && v1 - v0 <= 1))
        throw new Error(`${what} v range must increase by at most one turn`);
      sweepRig(patch.sweep);
      const grid: number[][] = Array.from(
        { length: rows + 1 },
        (_: unknown, j: number): number[] => {
          const u: number = j === rows ? u1 : u0 + ((u1 - u0) * j) / rows;
          return Array.from(
            { length: columns + 1 },
            (__: unknown, i: number): number => {
              const v: number =
                i === columns ? v1 : v0 + ((v1 - v0) * i) / columns;
              const [ub, ua]: [number, number] = reachAutoMovieSurfaceCell(
                (u1 - u0) / rows,
                j === 0,
                j === rows,
              );
              const [vb, va]: [number, number] = reachAutoMovieSurfaceCell(
                (v1 - v0) / columns,
                i === 0,
                i === columns,
              );
              return admit({
                key: sweepKey(patch.sweep, u, v),
                writer: (): ((out: Float64Array, at: number) => void) =>
                  sweepRig(patch.sweep).sample(u, v, [0, 0, 0, 0]),
                point: { sweep: patch.sweep, u, v, cell: [ub, ua, vb, va] },
                sweep: null,
                curve: null,
              });
            },
          );
        },
      );
      emit(p, grid, columns, rows, false);
    } else if (patch.type === "transition") {
      const [u0, u1]: [number, number] = patch.u;
      const [v0, v1]: [number, number] = patch.v;
      if (!(u0 >= 0 && u1 <= 1 && u1 > u0))
        throw new Error(`${what} u range must increase within 0 to 1`);
      if (!(v1 > v0 && v1 - v0 <= 1))
        throw new Error(`${what} v range must increase by at most one turn`);
      const start: number = count(patch.start, what);
      const end: number = count(patch.end, what);
      const rows: number = count(patch.rows, what);
      const fine: number = Math.max(start, end);
      // every corner is a sweep point; its cell reaches the finer ring's spacing round and half a row along
      const quads: Array<Array<[number, number, number]>> =
        layoutAutoMovieSurfaceTransition(start, end, rows).map(
          (
            quad: ReturnType<typeof layoutAutoMovieSurfaceTransition>[number],
          ): Array<[number, number, number]> =>
            quad.map(
              ({
                s,
                t,
              }: ReturnType<
                typeof layoutAutoMovieSurfaceTransition
              >[number][number]): [number, number, number] => {
                const u: number = t === 1 ? u1 : u0 + (u1 - u0) * t;
                const v: number = s === 1 ? v1 : v0 + (v1 - v0) * s;
                const across: number = (v1 - v0) / fine;
                const along: number = (u1 - u0) / (2 * rows);
                return [
                  admit({
                    key: sweepKey(patch.sweep, u, v),
                    writer: (): ((out: Float64Array, at: number) => void) =>
                      sweepRig(patch.sweep).sample(u, v, [0, 0, 0, 0]),
                    point: {
                      sweep: patch.sweep,
                      u,
                      v,
                      cell: [
                        t === 0 ? Infinity : along,
                        t === 1 ? Infinity : along,
                        across,
                        across,
                      ],
                    },
                    sweep: null,
                    curve: null,
                  }),
                  s,
                  t,
                ];
              },
            ),
        );
      layout.emitFaces(p, quads, fine, rows);
    } else if (patch.type === "coons") {
      const [bottom, right, top, left]: [
        IAutoMovieSurfaceSample[],
        IAutoMovieSurfaceSample[],
        IAutoMovieSurfaceSample[],
        IAutoMovieSurfaceSample[],
      ] = patch.sides.map(
        (
          e: IAutoMovieSurfaceNetwork.IEdge,
          k: number,
        ): IAutoMovieSurfaceSample[] => sample(e, `${what} side ${k}`),
      ) as [
        IAutoMovieSurfaceSample[],
        IAutoMovieSurfaceSample[],
        IAutoMovieSurfaceSample[],
        IAutoMovieSurfaceSample[],
      ];
      const columns: number = bottom.length - 1;
      const rows: number = right.length - 1;
      if (top.length !== bottom.length || left.length !== right.length)
        throw new Error(`${what} opposite sides differ in count`);
      const ends: Array<
        [IAutoMovieSurfaceSample[], IAutoMovieSurfaceSample[]]
      > = [
        [bottom, right],
        [right, top],
        [top, left],
        [left, bottom],
      ];
      ends.forEach(
        (
          [a, b]: [IAutoMovieSurfaceSample[], IAutoMovieSurfaceSample[]],
          k: number,
        ): void => {
          if (a[a.length - 1]!.key !== b[0]!.key)
            throw new Error(
              `${what} side ${k} does not end where side ${(k + 1) % 4} starts`,
            );
        },
      );
      const edgeAt = (i: number, j: number): IAutoMovieSurfaceSample | null =>
        j === 0
          ? bottom[i]!
          : j === rows
            ? top[columns - i]!
            : i === 0
              ? left[rows - j]!
              : i === columns
                ? right[j]!
                : null;
      const grid: number[][] = Array.from(
        { length: rows + 1 },
        (_: unknown, j: number): number[] =>
          Array.from(
            { length: columns + 1 },
            (__: unknown, i: number): number => {
              const e: IAutoMovieSurfaceSample | null = edgeAt(i, j);
              return e === null ? -1 : admit(e);
            },
          ),
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
      const a: IAutoMovieSurfaceSample[] = loop(
        patch.from.edges,
        `${what} from loop`,
      );
      const b: IAutoMovieSurfaceSample[] = loop(
        patch.to.edges,
        `${what} to loop`,
      );
      if (a.length !== b.length)
        throw new Error(
          `${what} loops differ in count, ${a.length} and ${b.length}`,
        );
      const tension: number = patch.tension ?? 1;
      if (!(tension > 0) || !Number.isFinite(tension))
        throw new Error(`${what} tension must be positive`);
      const n: number = a.length;
      const fromIndex: number[] = a.map((x: IAutoMovieSurfaceSample): number =>
        joined(x, `${what} from loop`),
      );
      const toIndex: number[] = b.map((x: IAutoMovieSurfaceSample): number =>
        joined(x, `${what} to loop`),
      );
      const probes: number[] = [...a, ...b].map(
        (x: IAutoMovieSurfaceSample): number =>
          x.sweep === null ? -1 : x.sweep.rig.probe(x.sweep.u, x.sweep.v),
      );
      const grid: number[][] = Array.from(
        { length: rows + 1 },
        (): number[] => new Array<number>(n),
      );
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
        rigAutoMovieSurfaceBridge({
          from: a,
          to: b,
          fromIndex,
          toIndex,
          fromRule: patch.from.tangent,
          toRule: patch.to.tangent,
          probes,
          rows,
          tension,
          interior,
        }),
      );
      emit(p, grid, n, rows, true);
    }
  }

  layout.check();
  return { layout, blend };
}

/** The checked face layout and the blend-control indices transferred to the owning rig. */
interface IOutput {
  /** Faces, UVs, chart coordinates and patch grids. */
  layout: IAutoMovieSurfaceLayout;

  /** Indices whose samples remain blend controls in the limit fit. */
  blend: Set<number>;
}
