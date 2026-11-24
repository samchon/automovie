import type {
  IAutoMovieConstructionProfileGrid,
  IAutoMovieConstructionProfileLoop,
  IAutoMoviePreparedConstructionProfile,
  IAutoMovieSolidSurface,
} from "@automovie/interface";

import { AutoMovieLoftAdmissionError } from "./AutoMovieLoftAdmissionError";

/**
 * Maximum requested rectangular cells per original loop; exceeding it refuses
 * instead of coarsening.
 */
const CELLS: number = 1_000_000;

/**
 * Maximum dyadic refinement levels; an unresolved criterion remains a named
 * refusal.
 */
const DEPTH: number = 16;

/**
 * Source-owned piece grids for the existing mesh consumer, without a fitted
 * curve.
 *
 * Every original guide is a phase mark. A cell reads its original corners, edge
 * midpoints and centre. It refines station/phase directions whose linear chord
 * observations exceed the requested millimetre tolerance; a remaining
 * diagonal-centre discrepancy refines both directions. This finite criterion is
 * not a certified continuous maximum. Work/depth/representability limits refuse
 * the request instead of silently returning an unresolved coarse grid.
 *
 * Each level enumerates the samples of its current rectangular cells once.
 * Boundary checks and chord observations use their row and column positions.
 */
export namespace AutoMovieConstructionProfileGrid {
  /**
   * Derive grids from original Point0; malformed or unresolved requests produce
   * no partial output.
   */
  export function create(
    prepared: IAutoMoviePreparedConstructionProfile.IPrepared,
    tolerance: number,
  ): IAutoMovieConstructionProfileGrid.IGrid[] {
    if (!(Number.isFinite(tolerance) && tolerance > 0))
      fail(
        "Original profile tessellation needs a finite positive millimetre chord tolerance.",
      );
    const result: IAutoMovieConstructionProfileGrid.IGrid[] = [];
    for (const loop of prepared.definition.loops)
      result.push(grid(prepared, loop, tolerance));
    return result;
  }
}

/** Prepare one loop independently, so scratch dies before the next component. */
function grid(
  prepared: IAutoMoviePreparedConstructionProfile.IPrepared,
  loop: IAutoMovieConstructionProfileLoop,
  tolerance: number,
): IAutoMovieConstructionProfileGrid.IGrid {
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
  const surfaces: IAutoMovieSolidSurface[] = loop.pieces.map(
    (piece) => prepared.surfaces.get(piece.id)!,
  );

  for (let level: number = 0; level <= DEPTH; level++) {
    const sampleStations: number[] = interleave(stations);
    const clocks: number[][] = loop.pieces.map((piece): number[] =>
      interleave(phases.get(piece.id)!),
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
    const samples: Float64Array[] = clocks.map(
      (phases): Float64Array =>
        new Float64Array(3 * sampleStations.length * phases.length),
    );
    for (let row: number = 0; row < sampleStations.length; row++) {
      const station: number = sampleStations[row]!;
      for (let piece: number = 0; piece < surfaces.length; piece++) {
        const owner: IAutoMovieSolidSurface = surfaces[piece]!;
        const read: (phase: number) => readonly number[] =
          owner.pointAt?.(station) ??
          ((phase: number): readonly number[] => owner.point!(station, phase));
        const phases: number[] = clocks[piece]!;
        const values: Float64Array = samples[piece]!;
        for (let q: number = 0; q < phases.length; q++) {
          const point: readonly number[] = read(phases[q]!);
          if (
            !Array.isArray(point) ||
            point.length !== 3 ||
            !point.every(Number.isFinite)
          )
            fail("Original profile grid has no finite Point0.");
          values.set(point, 3 * (row * phases.length + q));
        }
      }
    }

    // These checks observe every sampled source row, without turning finite observations into a topology proof.
    for (let row: number = 0; row < sampleStations.length; row++) {
      for (let i: number = 0; i < loop.pieces.length; i++) {
        const next: number = (i + 1) % loop.pieces.length;
        same(
          samples[i]!,
          3 * ((row + 1) * clocks[i]!.length - 1),
          samples[next]!,
          3 * row * clocks[next]!.length,
          "Original loop has a mismatched boundary in its actual grid.",
        );
      }
      if (poles.includes(sampleStations[row]!)) {
        for (let i: number = 0; i < loop.pieces.length; i++)
          for (let q: number = 0; q < clocks[i]!.length; q++)
            same(
              samples[0]!,
              3 * row * clocks[0]!.length,
              samples[i]!,
              3 * (row * clocks[i]!.length + q),
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
    for (
      let pieceIndex: number = 0;
      pieceIndex < loop.pieces.length;
      pieceIndex++
    ) {
      const piece: IAutoMovieConstructionProfileLoop["pieces"][number] =
        loop.pieces[pieceIndex]!;
      const values: number[] = phases.get(piece.id)!;
      const points: Float64Array = samples[pieceIndex]!;
      const width: number = 3 * clocks[pieceIndex]!.length;
      for (let i: number = 1; i < stations.length; i++)
        for (let j: number = 1; j < values.length; j++) {
          const row: number = 2 * i - 1;
          const column: number = 2 * j - 1;
          const centre: number = row * width + 3 * column;
          const stationError: number = Math.max(
            deviation(
              points,
              centre - 3,
              centre - 3 - width,
              centre - 3 + width,
            ),
            deviation(points, centre, centre - width, centre + width),
            deviation(
              points,
              centre + 3,
              centre + 3 - width,
              centre + 3 + width,
            ),
          );
          const phaseError: number = Math.max(
            deviation(
              points,
              centre - width,
              centre - width - 3,
              centre - width + 3,
            ),
            deviation(points, centre, centre - 3, centre + 3),
            deviation(
              points,
              centre + width,
              centre + width - 3,
              centre + width + 3,
            ),
          );
          const diagonal: number = Math.max(
            deviation(points, centre, centre - width - 3, centre + width + 3),
            deviation(points, centre, centre - width + 3, centre + width - 3),
          );
          const cross: boolean =
            diagonal > tolerance &&
            stationError <= tolerance &&
            phaseError <= tolerance;
          if (stationError > tolerance || cross) {
            nextStations.add(sampleStations[row]!);
            changed = true;
          }
          if (phaseError > tolerance || cross) {
            nextPhases.get(piece.id)!.add(clocks[pieceIndex]![column]!);
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

/**
 * Ordered endpoint and midpoint query marks, without changing any original
 * source support.
 */
function interleave(values: readonly number[]): number[] {
  const result: number[] = [values[0]!];
  for (let i: number = 1; i < values.length; i++)
    result.push(middle(values[i - 1]!, values[i]!), values[i]!);
  return result;
}

/** One finite midpoint-to-chord observation in world millimetres. */
function deviation(
  points: Float64Array,
  point: number,
  a: number,
  b: number,
): number {
  const value: number = Math.hypot(
    points[point]! - (points[a]! / 2 + points[b]! / 2),
    points[point + 1]! - (points[a + 1]! / 2 + points[b + 1]! / 2),
    points[point + 2]! - (points[a + 2]! / 2 + points[b + 2]! / 2),
  );
  if (!Number.isFinite(value))
    fail("Original profile chord observation is not finite.");
  return value;
}

/**
 * Binary64 evaluation budget for a queried source boundary; never a source fit
 * or global certificate.
 */
function same(
  a: Float64Array,
  left: number,
  b: Float64Array,
  right: number,
  message: string,
): void {
  for (let k: number = 0; k < 3; k++) {
    const x: number = a[left + k]!;
    const y: number = b[right + k]!;
    if (
      Math.abs(x - y) >
      32 * Number.EPSILON * Math.max(1, Math.abs(x), Math.abs(y))
    )
      fail(message);
  }
}

/**
 * Explicit source/numeric admission leaves original callback failures
 * untouched.
 */
function fail(message: string): never {
  throw new AutoMovieLoftAdmissionError(message);
}
