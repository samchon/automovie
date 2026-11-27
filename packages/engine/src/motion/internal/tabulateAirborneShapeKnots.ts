
import { AutoMovieEngineKinematics } from "../../kinematics/AutoMovieEngineKinematics";
import { Quaternion } from "../../math/Quaternion";

/**
 * Sample increasing knot seconds and their posed mass parts over a flight.
 *
 * @param grid Finite flight endpoints and an already validated uniform interval
 *   count. The turn in radians is a shortest-arc bound on the sampled frames.
 *   Infinity disables refinement.
 * @param maxKnots Maximum count representable by the caller's packed table.
 * @param read Pure pose evaluation at a second inside the span.
 * @returns Fresh parallel arrays of knot seconds and poses. Every accepted pair
 *   meets the turn bound when at least four uniform intervals were requested.
 * @throws {Error} If the grid cannot advance in representable seconds, a
 *   measured turn is nonfinite, or the table cannot hold the required knots.
 */
export function tabulateAirborneShapeKnots(
  grid: IGrid,
  maxKnots: number,
  read: (
    seconds: number,
    uniformIndex?: number,
  ) => AutoMovieEngineKinematics.IPosedBody,
): IKnots {
  const times: number[] = [grid.from];
  const knots: AutoMovieEngineKinematics.IPosedBody[] = [read(grid.from, 0)];
  const spacing: number = (grid.to - grid.from) / grid.intervals;
  const refine: boolean = grid.intervals >= 4;
  const pending: IKnot[] = [];
  for (let k: number = 1; k <= grid.intervals; ++k) {
    const end: number =
      k === grid.intervals ? grid.to : grid.from + k * spacing;
    if (!(end > times[times.length - 1]! && end <= grid.to))
      throw new Error(
        "A tabulated shape history needs distinct uniform knot times",
      );
    pending.push([end, read(end, k)]);
    while (pending.length !== 0) {
      const right: IKnot = pending.pop()!;
      const left: number = times[times.length - 1]!;
      const angle: number = refine
        ? maximumTurn(knots[knots.length - 1]!, right[1])
        : 0;
      if (angle <= grid.turn) {
        times.push(right[0]);
        knots.push(right[1]);
        continue;
      }
      const available: number =
        maxKnots - knots.length - pending.length - (grid.intervals - k);
      const required: number = Math.max(2, Math.ceil(angle / grid.turn));
      if (available < 2 || required > available)
        throw new Error(
          "A tabulated shape history turn bound needs too many knots",
        );

      // A constant-speed turn needs exactly this many pieces. Divide that
      // minimum between the children, then measure each actual child turn.
      const fraction: number = Math.floor(required / 2) / required;
      const middle: number = left + (right[0] - left) * fraction;
      if (!(middle > left && middle < right[0]))
        throw new Error(
          `A tabulated shape history cannot resolve a ${angle} radian turn between ${left} and ${right[0]} seconds (limit ${grid.turn})`,
        );
      pending.push(right, [middle, read(middle)]);
    }
  }
  return { times, knots };
}

/** Uniform starting grid and the measured endpoint angle bound in radians. */
interface IGrid {
  readonly from: number;
  readonly to: number;
  readonly intervals: number;
  readonly turn: number;
}

/** Parallel owned arrays of increasing seconds and sampled poses. */
interface IKnots {
  times: number[];
  knots: AutoMovieEngineKinematics.IPosedBody[];
}

/** A posed shape at one representable second. */
type IKnot = readonly [seconds: number, pose: AutoMovieEngineKinematics.IPosedBody];

/** Greatest shortest-arc angle in radians among matching principal frames. */
function maximumTurn(
  a: AutoMovieEngineKinematics.IPosedBody,
  b: AutoMovieEngineKinematics.IPosedBody,
): number {
  let largest: number = 0;
  for (let i: number = 0; i < a.parts.length; ++i) {
    const angle: number = Quaternion.angle(
      a.parts[i]!.inertiaRotation,
      b.parts[i]!.inertiaRotation,
    );
    largest = Math.max(largest, angle);
  }
  return largest;
}
