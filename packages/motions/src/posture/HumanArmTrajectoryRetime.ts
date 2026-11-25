import { Vector3, bracketedRoot } from "@automovie/engine";
import type { IAutoMovieMotionHumanArmGeometry } from "@automovie/interface";

import { HumanArmGeometry as G } from "./HumanArmGeometry";
import type { HumanArmTrajectoryClear } from "./HumanArmTrajectoryClear";
import { HumanArmTrajectoryModel as M } from "./HumanArmTrajectoryModel";
import { HumanArmTrajectoryTerms as T } from "./HumanArmTrajectoryTerms";
import { HumanArmTrajectoryTravel as V } from "./HumanArmTrajectoryTravel";

/** A laid transport and the joint blend's sampled shares on the action clock. */
interface ITransport {
  from: number;
  to: number;
  detours: readonly HumanArmTrajectoryClear.IDetour[];
  laid: { effector: boolean; shares: readonly number[] };
}

/** One interior waypoint retimed along the shared joint blend. */
interface IRetimed {
  at: number;
  displacement: number;
  coordinates: number[][];
}

/** Arm probe positions and joint transforms in world coordinates. */
type Placed = IAutoMovieMotionHumanArmGeometry.IPlaced;

/**
 * Redistribute one refused speed step across an adjacent interval of the same
 * joint blend. The pace comes from the path with the initial hand shape.
 * Opening a digit on the action clock can add travel at a live waypoint. Keep
 * the action clock, digit and parent frames, pace, and end coordinates. Balance
 * the two affected steps with the remaining motion budget at one interior
 * waypoint, then require the complete trajectory model's admission.
 *
 * @param c The existing trajectory context, with the authored frames and pace.
 * @param x The arm coordinates on the action clock. A successful retiming
 *   replaces one interior row per arm.
 * @param reading The model's evaluation of those coordinates.
 * @param transports The laid transports with their original path shares.
 * @param blend The joint path's original interpolation between its endpoints.
 * @returns The model evaluation of the kept coordinates.
 * @evidence contracts/development/common.md#meaningful-documentation States which step is adjusted, the quantities held, and the evaluation used.
 * @evidence contracts/development/implementation.md#principled-implementation A share inside the two neighbouring shares preserves path order. The maximum parent-local probe step is continuous in that share and the equality of the two speed margins is bracketed before applying the Illinois method (Dowell and Jarratt 1971, DOI 10.1007/BF01934364).
 * @evidence contracts/development/implementation.md#clear-and-simple-structure The laid course supplies its path and the model supplies the bounds and clearance.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Replaces a waypoint only when both changed steps meet their original physical speed bounds and the complete model admits the trajectory.
 * @evidence contracts/development/implementation.md#efficient-algorithms After inspecting the model's refusal flags, at most two one-variable roots each place one waypoint per arm in each evaluation. The existing trajectory evaluation recomputes only the changed waypoint and any dependent intervals.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Existing placements are used for fixed neighbours. Incremental admission reuses the entries whose dependencies are unchanged.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The trial placements and candidate rows live only during the retiming attempt.
 */
export function HumanArmTrajectoryRetime(
  c: M.IContext,
  x: number[][][],
  reading: M.IEvaluation,
  transports: readonly ITransport[],
  blend: (
    from: readonly number[],
    to: readonly number[],
    share: number,
  ) => number[],
): M.IEvaluation {
  const refused: number = reading.worst.at;
  if (
    reading.worst.term !== "speed" ||
    reading.worst.value <= M.TOLERANCE ||
    reading.failing.some(
      (failed: boolean, k: number): boolean =>
        failed && k !== refused && k !== refused + 1,
    )
  )
    return reading;

  const t: ITransport | undefined = transports.find(
    (item: ITransport): boolean => item.from <= refused && refused < item.to,
  );
  if (t === undefined || t.laid.effector || t.detours.length > 0)
    return reading;

  const step = (a: number, k: number, before: Placed, after: Placed): number =>
    Math.max(
      ...T.SPEED.map(
        (probe: number): number =>
          1000 *
          Vector3.length(
            V.step(
              c.frames[a]![k]!,
              c.frames[a]![k + 1]!,
              before.probes[probe]![0],
              after.probes[probe]![0],
            ),
          ),
      ),
    ) -
    M.stepLimit(c, k) -
    M.TOLERANCE;
  const frozen = (a: number, k: number): Placed =>
    G.placed(
      c.setups[a]!,
      { ...c.frames[a]![k]!, tip: c.frames[a]![t.from]!.tip },
      x[a]![k]!,
      false,
    );

  // The fixed digit shape must leave enough pace on the refused step.
  if (
    x.some(
      (_, a: number): boolean =>
        !(step(a, refused, frozen(a, refused), frozen(a, refused + 1)) <= 0),
    )
  )
    return reading;

  const trials: IRetimed[] = [];
  for (const k of [refused, refused + 1]) {
    if (k <= t.from || k >= t.to) continue;
    const low: number = t.laid.shares[k - 1]!;
    const high: number = t.laid.shares[k + 1]!;
    const coordinates = (share: number): number[][] =>
      x.map((arm: number[][], a: number): number[] =>
        M.ranged(c, a, blend(arm[t.from]!, arm[t.to]!, share)),
      );
    const margins = (q: readonly number[][]): [number, number] => {
      let incoming: number = -Infinity;
      let outgoing: number = -Infinity;
      q.forEach((row: number[], a: number): void => {
        const trial: Placed = G.placed(
          c.setups[a]!,
          c.frames[a]![k]!,
          row,
          false,
        );
        incoming = Math.max(
          incoming,
          step(a, k - 1, reading.placed[a]![k - 1]!, trial),
        );
        outgoing = Math.max(
          outgoing,
          step(a, k, trial, reading.placed[a]![k + 1]!),
        );
      });
      return [incoming, outgoing];
    };
    const difference = (share: number): number => {
      const [incoming, outgoing]: [number, number] = margins(
        coordinates(share),
      );
      return incoming - outgoing;
    };

    if (!(low < high && difference(low) < 0 && difference(high) > 0)) continue;

    // The root is a unitless share in [0, 1].
    const share: number = bracketedRoot(difference, low, high, Number.EPSILON);
    if (!(share > low && share < high)) continue;
    const moved: number[][] = coordinates(share);
    if (margins(moved).some((margin: number): boolean => !(margin <= 0)))
      continue;
    trials.push({
      at: k,
      displacement: Math.abs(share - t.laid.shares[k]!),
      coordinates: moved,
    });
  }

  // The smallest change to the original path share is tried first.
  trials.sort(
    (a: IRetimed, b: IRetimed): number => a.displacement - b.displacement,
  );
  for (const trial of trials) {
    const laid: boolean[] = c.times.map(
      (_, k: number): boolean => k === trial.at,
    );
    const candidate: number[][][] = x.map(
      (arm: number[][], a: number): number[][] =>
        arm.map((row: number[], k: number): number[] =>
          laid[k] ? trial.coordinates[a]! : row,
        ),
    );
    const verdict: M.IEvaluation = M.evaluate(c, candidate, { reading, laid });
    if (
      !Number.isFinite(verdict.objective) ||
      !Number.isFinite(verdict.violation) ||
      !Number.isFinite(verdict.worst.value) ||
      verdict.worst.value > M.TOLERANCE ||
      verdict.failing.some(Boolean)
    )
      continue;
    x.forEach((arm: number[][], a: number): void => {
      arm[trial.at] = trial.coordinates[a]!;
    });
    return verdict;
  }
  return reading;
}
