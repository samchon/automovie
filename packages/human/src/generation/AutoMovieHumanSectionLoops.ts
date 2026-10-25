import { AutoMovieHumanSplineCurve } from "../lofting/AutoMovieHumanSplineCurve";
import type { IAutoMovieHumanLoftChain } from "../lofting/IAutoMovieHumanLoftChain";
import type { IAutoMovieHumanBodyCalibration } from "./IAutoMovieHumanBodyCalibration";

/**
 * Removal of the loops the section fitter leaves inside a chain.
 *
 * A skin outline never folds back over itself away from a contact ring, yet
 * the fitted sections do where a cut runs close to a fold: on the f1
 * calibration the upper head's layers 0.8 to 3.2 mm above the 1595.5 mm
 * ring, where both upper helices leave the head, close a loop of zero
 * radius at each ear (a blade standing forward from the helix root), and
 * most layers of each auricle rim carry one (the rim's ripples and
 * facets). Those loops are the fit's overshoot about a sharp corner of the
 * observations, not anatomy.
 *
 * A loop is a stretch where the outline's tangent turns by more than
 * {@link TURN} within {@link SPAN} mm of arc either side of a point whose
 * radius of curvature is below {@link RADIUS}, or turns outward by more
 * than {@link SPIKE} there: a spike, the section of a blade, whose outline
 * runs out and straight back. A point where the outline also stalls, its
 * phase speed under {@link STALL} of the section's median, is a kink: the
 * control points bunch and the outline bends by 20 to 30 degrees within a
 * tenth of a millimetre, a corner that the stacked layers trace as a crease
 * (the blade standing forward from each helix root of f1 is the kink of the
 * upper head's layers 0.8 to 2.4 mm above the 1595.5 mm ring, at x 32 mm).
 * A deep notch, such as the axilla or the crotch just off their rings,
 * turns inward by about half a turn and is kept, and no control point
 * moves more than {@link MOVE} from its fit: judged by radius alone, the
 * rule moved the axillary section 11 mm. Each interior layer of a spline chain is smoothed locally
 * until no loop is left: the four control points shaping the section at
 * its tightest loop each move halfway toward the mean of their two
 * neighbours, and the step repeats at the new tightest loop. Everywhere
 * else the section keeps its fitted control points. End layers, which the
 * events share, are kept. Station slopes are kept and reconciled with the
 * moved values by `AutoMovieHumanStationContinuity`.
 */
export namespace AutoMovieHumanSectionLoops {
  /**
   * Calibration whose interior sections carry no loop.
   *
   * @param calibration Merged calibration; not modified.
   * @returns A copy with the looping layers smoothed.
   */
  export function apply(
    calibration: IAutoMovieHumanBodyCalibration,
  ): IAutoMovieHumanBodyCalibration {
    return {
      ...calibration,
      chains: calibration.chains.map(untangle),
    };
  }
}

/** Radius of curvature below which a point may close a loop, mm. */
const RADIUS: number = 0.5;

/** Tangent turn over the window that makes a loop, radians. */
const TURN: number = 1.25 * Math.PI;

/** Outward tangent turn over the window that makes a spike, radians. */
const SPIKE: number = 0.75 * Math.PI;

/** Largest move of a control point from its fit, mm. */
const MOVE: number = 2;

/** Share of the median phase speed below which the outline stalls. */
const STALL: number = 0.3;

/** Arc either side of a tight point over which its turn is read, mm. */
const SPAN: number = 2;

/** Samples per control point when searching a section. */
const DENSITY: number = 8;

/** Largest number of local smoothing steps per layer. */
const STEPS: number = 400;

/** One chain with its interior layers' loops smoothed away. */
function untangle(chain: IAutoMovieHumanLoftChain): IAutoMovieHumanLoftChain {
  if (chain.basis !== "spline") return chain;
  const N: number = chain.order;
  const last: number = chain.layers.length - 1;
  return {
    ...chain,
    layers: chain.layers.map(
      (
        layer: IAutoMovieHumanLoftChain.ILayer,
        k: number,
      ): IAutoMovieHumanLoftChain.ILayer => {
        if (k === 0 || k === last) return layer;
        const c: number[] = [...layer.coefficients];
        const kept: number[] = [];
        for (let step: number = 0; step < STEPS; step++) {
          const phase: number | null = loop(c, N, kept);
          if (phase === null) break;

          // The control points of the span at the loop and its two
          // neighbours, each moved halfway to its neighbours' mean.
          const first: number = Math.floor((phase / (2 * Math.PI)) * N) - 1;
          const before: number[] = [...c];
          let moved: number = 0;
          for (let d: number = 0; d < 4; d++) {
            const j: number = (((first + d) % N) + N) % N;
            const a: number = (j + N - 1) % N;
            const b: number = (j + 1) % N;
            for (const offset of [0, N])
              c[offset + j] =
                0.5 * before[offset + j]! +
                0.25 * (before[offset + a]! + before[offset + b]!);
            moved = Math.max(
              moved,
              Math.hypot(
                c[j]! - layer.coefficients[j]!,
                c[N + j]! - layer.coefficients[N + j]!,
              ),
            );
          }
          // The rule never moves a control point further than MOVE from
          // its fit: a stall that needs more is a real shape, such as the
          // pinch bridge just above the axillary ring.
          if (moved > MOVE) {
            c.splice(0, c.length, ...before);
            kept.push(phase);
          }
        }
        return { ...layer, coefficients: c };
      },
    ),
  };
}

/** A sample whose radius of curvature is below {@link RADIUS}. */
interface ITight {
  /** Sample index. */
  i: number;

  /** Radius of curvature, mm. */
  radius: number;

  /** Whether the outline stalls there. */
  stall: boolean;
}

/**
 * Phase of a section's tightest loop, or null without one.
 *
 * Samples at {@link DENSITY} per control point give the tangent angle and
 * the radius of curvature (second derivative by central differences of the
 * exact first). Among the points below {@link RADIUS}, tightest first, the
 * first whose tangent turns by more than {@link TURN} within {@link SPAN} mm
 * of arc either side is the loop.
 */
function loop(
  coefficients: readonly number[],
  N: number,
  kept: readonly number[],
): number | null {
  const M: number = DENSITY * N;
  const h: number = (2 * Math.PI) / M;
  const p: [number, number, number, number][] = Array.from(
    { length: M },
    (_: unknown, i: number): [number, number, number, number] =>
      AutoMovieHumanSplineCurve.evaluate(coefficients, N, i * h),
  );

  // Arc length of each sample step and the signed tangent turn across it.
  const ds: number[] = p.map(
    (q: [number, number, number, number], i: number): number => {
      const r: [number, number, number, number] = p[(i + 1) % M]!;
      return Math.hypot(r[0] - q[0], r[1] - q[1]);
    },
  );
  const turn: number[] = p.map(
    (q: [number, number, number, number], i: number): number => {
      const r: [number, number, number, number] = p[(i + 1) % M]!;
      return Math.atan2(q[2] * r[3] - q[3] * r[2], q[2] * r[2] + q[3] * r[3]);
    },
  );

  // Outward turns carry the sign of the whole outline's turn (+2pi when
  // the phases run counter-clockwise).
  const sense: number =
    turn.reduce((sum: number, t: number): number => sum + t, 0) < 0 ? -1 : 1;

  // Median phase speed, against which a stall is read.
  const speeds: number[] = p
    .map((q: [number, number, number, number]): number =>
      Math.hypot(q[2], q[3]),
    )
    .sort((a: number, b: number): number => a - b);
  const median: number = speeds[speeds.length >> 1]!;

  const tight: ITight[] = [];
  for (let i: number = 0; i < M; i++) {
    const q: [number, number, number, number] = p[i]!;
    const a: [number, number, number, number] = p[(i + 1) % M]!;
    const b: [number, number, number, number] = p[(i + M - 1) % M]!;
    const ddx: number = (a[2] - b[2]) / (2 * h);
    const ddz: number = (a[3] - b[3]) / (2 * h);
    const cross: number = Math.abs(q[2] * ddz - q[3] * ddx);
    const speed: number = Math.hypot(q[2], q[3]);
    // A stationary point is a cusp: radius zero.
    const radius: number =
      speed < 1e-9 ? 0 : cross > 0 ? speed ** 3 / cross : Infinity;
    if (radius < RADIUS)
      tight.push({ i, radius, stall: speed < STALL * median });
  }
  tight.sort((a: ITight, b: ITight): number => a.radius - b.radius);

  for (const { i, stall } of tight) {
    // A kept shape stays within two control spans of where it was kept.
    if (
      kept.some(
        (t: number): boolean =>
          Math.abs(Math.atan2(Math.sin(i * h - t), Math.cos(i * h - t))) <
          (4 * Math.PI) / N,
      )
    )
      continue;
    if (stall) return i * h;
    // Signed turn over SPAN mm of arc on both sides of the point.
    let total: number = 0;
    let arc: number = 0;
    for (let j: number = i; arc < SPAN && j < i + M / 2; j++) {
      total += turn[j % M]!;
      arc += ds[j % M]!;
    }
    arc = 0;
    for (let j: number = i - 1; arc < SPAN && j > i - M / 2; j--) {
      total += turn[(j + M) % M]!;
      arc += ds[(j + M) % M]!;
    }
    if (Math.abs(total) > TURN || sense * total > SPIKE) return i * h;
  }
  return null;
}
