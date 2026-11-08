import type { IAutoMovieConstructionProfile } from "@automovie/interface";

import type { AutoMovieConstructionProfile } from "./AutoMovieConstructionProfile";
import { AutoMovieLoftAdmissionError } from "./AutoMovieLoftAdmissionError";
import type { IAutoMovieSolidSurface } from "./IAutoMovieSolidSurface";

/** World millimetres, copied before a cached source reading is retained. */
type Point = [number, number, number];

/** Maximum requested rectangular cells per original loop; exceeding it refuses instead of coarsening. */
const CELLS: number = 1_000_000;

/** Maximum dyadic refinement levels; an unresolved criterion remains a named refusal. */
const DEPTH: number = 16;

/**
 * Source-owned piece grids for the existing mesh consumer, without a fitted curve.
 *
 * Every original guide is a phase mark. A cell reads its original corners,
 * edge midpoints and centre. It refines station/phase directions whose linear
 * chord observations exceed the requested millimetre tolerance; a remaining
 * diagonal-centre discrepancy refines both directions. This finite criterion
 * is not a certified continuous maximum. Work/depth/representability limits
 * refuse the request instead of silently returning an unresolved coarse grid.
 *
 * Pure original functions and all their dependencies stay immutable through
 * preparation. A loop's station-major cache reuses exactly equal queries and
 * copies finite results; foreign source exceptions propagate unchanged.
 *
 * @evidence contracts/common.md#principled-implementation Refines observations of the identical original Point0 functions in their actual station/piece clocks, preserving original guides and domains; declared pole rows are evaluated as Point0 and never receive regular physical2.
 * @evidence contracts/common.md#clear-and-simple-design One loop-local sampler and two ordered mark families feed existing rectangular mesh faces; no chain, conic or source interpolant is reconstructed.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No source fit, arbitrary coarsening, moved pole or invented derivative appears. Midpoint observations establish only their stated finite criterion; declared topology and complete-source smoothness remain separate premises.
 * @evidence contracts/common.md#meaningful-documentation States mm tolerance, original guide marks, copied point-cache lifetime, sampled criterion and explicit resource/depth failures.
 * @evidence contracts/performance.md#efficient-algorithms With K refinement passes and N final rectangular cells, classification costs O(KN); memoized source work follows distinct dyadic grid/midpoint points and includes actual source costs. A loop is limited to one million cells and sixteen passes.
 * @evidence contracts/performance.md#reuse-equivalent-work Equal station/piece/coordinate queries share owned numeric points only within this immutable preparation; station-major discovery keeps caller-owned native preparations useful.
 * @evidence contracts/performance.md#bound-retention-and-release-resources One loop retains its finite point cache and ordered marks during preparation; results retain only O(stations+piece phase marks) arrays and the existing loop declaration, with no global cache or handle.
 */
export namespace AutoMovieConstructionProfileGrid {
  /** Tessellation marks of one actual loop; true collapsed rows stay separate from regular face grids. */
  export interface IGrid {
    /** Same copied declaration whose original functions were sampled. */
    loop: IAutoMovieConstructionProfile.ILoop;
    /** Regular station rows, physical millimetres; declared collapsed endpoints are omitted. */
    stations: number[];
    /** Inclusive normalized piece coordinates, retaining all original guides. */
    phases: ReadonlyMap<string, number[]>;
  }

  /** Derive grids from original Point0; malformed or unresolved requests produce no partial output. */
  export function create(
    prepared: AutoMovieConstructionProfile.IPrepared,
    tolerance: number,
  ): IGrid[] {
    if (!(Number.isFinite(tolerance) && tolerance > 0))
      fail(
        "Original profile tessellation needs a finite positive millimetre chord tolerance.",
      );
    const result: IGrid[] = [];
    for (const loop of prepared.definition.loops)
      result.push(grid(prepared, loop, tolerance));
    return result;
  }
}

/** Prepare one loop independently, so scratch dies before the next component. */
function grid(
  prepared: AutoMovieConstructionProfile.IPrepared,
  loop: IAutoMovieConstructionProfile.ILoop,
  tolerance: number,
): AutoMovieConstructionProfileGrid.IGrid {
  const first: number = 1000 * loop.domain[0];
  const last: number = 1000 * loop.domain[1];
  if (![first, last, last - first].every(Number.isFinite))
    fail(
      "Original profile station interval is not representable in millimetres.",
    );
  const poles: number[] =
    loop.pole === "both"
      ? [first, last]
      : loop.pole === "bottom"
        ? [first]
        : loop.pole === "top"
          ? [last]
          : [];
  const mid: number = middle(first, last);
  let stations: number[] =
    poles.length === 2
      ? [first, middle(first, mid), mid, middle(mid, last), last]
      : poles.length === 1
        ? [first, mid, last]
        : [first, last];
  const phases: Map<string, number[]> = new Map();
  for (const piece of loop.pieces) {
    const start: number = piece.clock[piece.direction === 1 ? 0 : 1];
    const scale: number = piece.direction * (piece.clock[1] - piece.clock[0]);
    const marks: Set<number> = new Set(
      prepared.surfaces.get(piece.id)!.period === undefined
        ? [0, 1]
        : [0, 0.25, 0.5, 0.75, 1],
    );
    for (const guide of prepared.definition.guides)
      if (guide.piece === piece.id) marks.add((guide.clock - start) / scale);
    phases.set(
      piece.id,
      [...marks].sort((a: number, b: number): number => a - b),
    );
  }
  const cache: Map<number, Map<string, Map<number, Point>>> = new Map();

  /** Cache only copied successful values of the same immutable original query. */
  const at: (piece: string, station: number, phase: number) => Point = (
    piece: string,
    station: number,
    phase: number,
  ): Point => {
    let row: Map<string, Map<number, Point>> | undefined = cache.get(station);
    if (row === undefined) {
      row = new Map();
      cache.set(station, row);
    }
    let curve: Map<number, Point> | undefined = row.get(piece);
    if (curve === undefined) {
      curve = new Map();
      row.set(piece, curve);
    }
    const old: Point | undefined = curve.get(phase);
    if (old !== undefined) return old;
    const owner: IAutoMovieSolidSurface = prepared.surfaces.get(piece)!;
    const value: readonly number[] = owner.point!(station, phase);
    if (
      !Array.isArray(value) ||
      value.length !== 3 ||
      !value.every(Number.isFinite)
    )
      fail("Original profile grid has no finite Point0.");
    const point: Point = [value[0]!, value[1]!, value[2]!];
    curve.set(phase, point);
    return point;
  };

  for (let level: number = 0; level <= DEPTH; level++) {
    const sampleStations: number[] = interleave(stations);
    const samples: Map<string, number[]> = new Map(
      [...phases].map(
        ([key, values]: [string, number[]]): [string, number[]] => [
          key,
          interleave(values),
        ],
      ),
    );
    if (
      (stations.length - 1) *
        [...phases.values()].reduce(
          (sum: number, values: number[]): number => sum + values.length - 1,
          0,
        ) >
      CELLS
    )
      fail("Original profile grid exceeds its declared cell-work limit.");
    for (const station of sampleStations)
      for (const piece of loop.pieces)
        for (const phase of samples.get(piece.id)!)
          at(piece.id, station, phase);

    // These checks observe every sampled source row, without turning finite observations into a topology proof.
    for (const station of sampleStations) {
      for (let i: number = 0; i < loop.pieces.length; i++)
        same(
          at(loop.pieces[i]!.id, station, 1),
          at(loop.pieces[(i + 1) % loop.pieces.length]!.id, station, 0),
          "Original loop has a mismatched boundary in its actual grid.",
        );
      if (poles.includes(station)) {
        const point: Point = at(loop.pieces[0]!.id, station, 0);
        for (const piece of loop.pieces)
          for (const phase of samples.get(piece.id)!)
            same(
              point,
              at(piece.id, station, phase),
              "Declared profile pole is not an actual point collapse at a queried original clock.",
            );
      }
    }
    const nextStations: Set<number> = new Set(stations);
    const nextPhases: Map<string, Set<number>> = new Map(
      [...phases].map(
        ([key, values]: [string, number[]]): [string, Set<number>] => [
          key,
          new Set(values),
        ],
      ),
    );
    let changed: boolean = false;
    for (const piece of loop.pieces) {
      const values: number[] = phases.get(piece.id)!;
      for (let i: number = 1; i < stations.length; i++)
        for (let j: number = 1; j < values.length; j++) {
          const a: number = stations[i - 1]!;
          const b: number = stations[i]!;
          const c: number = values[j - 1]!;
          const d: number = values[j]!;
          const u: number = middle(a, b);
          const v: number = middle(c, d);
          const centre: Point = at(piece.id, u, v);
          const stationError: number = Math.max(
            ...[c, v, d].map((phase: number): number =>
              deviation(
                at(piece.id, u, phase),
                at(piece.id, a, phase),
                at(piece.id, b, phase),
              ),
            ),
          );
          const phaseError: number = Math.max(
            ...[a, u, b].map((station: number): number =>
              deviation(
                at(piece.id, station, v),
                at(piece.id, station, c),
                at(piece.id, station, d),
              ),
            ),
          );
          const diagonal: number = Math.max(
            deviation(centre, at(piece.id, a, c), at(piece.id, b, d)),
            deviation(centre, at(piece.id, a, d), at(piece.id, b, c)),
          );
          const cross: boolean =
            diagonal > tolerance &&
            stationError <= tolerance &&
            phaseError <= tolerance;
          if (stationError > tolerance || cross) {
            nextStations.add(u);
            changed = true;
          }
          if (phaseError > tolerance || cross) {
            nextPhases.get(piece.id)!.add(v);
            changed = true;
          }
        }
    }
    if (!changed)
      return {
        loop,
        stations: stations.filter(
          (station: number): boolean => !poles.includes(station),
        ),
        phases,
      };
    stations = [...nextStations].sort((a: number, b: number): number => a - b);
    for (const [key, values] of nextPhases)
      phases.set(
        key,
        [...values].sort((a: number, b: number): number => a - b),
      );
  }
  return fail(
    "Original profile tessellation cannot meet its sampled chord criterion within the declared refinement limit.",
  );
}

/** Every added mark lies strictly within its finite original interval. */
function middle(a: number, b: number): number {
  const value: number = a + (b - a) / 2;
  if (!(Number.isFinite(value) && value > a && value < b))
    fail("Original profile grid has no representable interior subdivision.");
  return value;
}

/** Ordered endpoint and midpoint query marks, without changing any original source support. */
function interleave(values: readonly number[]): number[] {
  const result: number[] = [values[0]!];
  for (let i: number = 1; i < values.length; i++)
    result.push(middle(values[i - 1]!, values[i]!), values[i]!);
  return result;
}

/** One finite midpoint-to-chord observation in world millimetres. */
function deviation(point: Point, a: Point, b: Point): number {
  const value: number = Math.hypot(
    ...point.map((v: number, k: number): number => v - (a[k]! / 2 + b[k]! / 2)),
  );
  if (!Number.isFinite(value))
    fail("Original profile chord observation is not finite.");
  return value;
}

/** Binary64 evaluation budget for a queried source boundary; never a source fit or global certificate. */
function same(a: Point, b: Point, message: string): void {
  if (
    a.some(
      (v: number, k: number): boolean =>
        Math.abs(v - b[k]!) >
        32 * Number.EPSILON * Math.max(1, Math.abs(v), Math.abs(b[k]!)),
    )
  )
    fail(message);
}

/** Explicit source/numeric admission leaves original callback failures untouched. */
function fail(message: string): never {
  throw new AutoMovieLoftAdmissionError(message);
}
