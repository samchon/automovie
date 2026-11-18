import { Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanWalkFoot,
  IAutoMovieMotionHumanWalkGait,
} from "@automovie/interface";

import { HumanFoot } from "../posture/HumanFoot";
import { walkFoot } from "./walkFoot";

/** Swing endpoints in action seconds. */
type Swing = Pick<NonNullable<IAutoMovieMotionHumanWalkFoot.IScheduled["swing"]>, "off" | "on">;

/** A swing evaluated at its normalized time from toe-off to heel strike. */
type ReadSwing = (share: number) => IAutoMovieMotionHumanWalkFoot.IFoot;

/** Reader prepared for the recorded arrival of this toe-off. */
interface IArrival {
  /** Heel-strike time in action seconds. */
  on: number;

  /** The owner's prepared swing. */
  read: ReadSwing;
}

/**
 * Prepare a swing from the stance reader that owns its endpoints: the
 * departure, its predecessor a `TICK` earlier and the arrival are read once,
 * and the returned reader evaluates the swing at any share of it.
 *
 * @param body The plan's fixed body.
 * @param gait The gait's lift, straight leg and landing rule.
 * @param at The stance endpoint reader, in action seconds, borrowing only the preparing observation's optional FK source.
 * @param closing Whether a foot's swing landing at a second lands in its closing stance, which it sets down into at rest whatever the gait; none when absent.
 * @returns A preparer that reads one swing's three endpoints and returns its random-access share reader.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States endpoint ownership, fixed body/gait inputs, action timebase, the preparing observation's FK loan and the three endpoint reads.
 * @evidence contracts/development/implementation.md#principled-implementation A swing leaves the stance with its ankle, pitch and toe rates read over one millisecond and joins the stance at heel strike; `walkFoot.prepareSwing` owns its interpolation and clearance.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Each preparation reads departure, its millisecond predecessor and arrival, then prepares the shared swing owner once for them.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Every endpoint, rate interval, lift, straight-leg and landing rule is read from its owner; nothing is replayed from another swing.
 * @evidence contracts/development/implementation.md#efficient-algorithms A preparation costs three endpoint reads and the swing's fixed decompositions; each share read then costs only the interpolation and clearance.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuse the reader only for the same side, toe-off and heel strike; the FK loan changes no endpoint.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The plan owns one reader per requested foot and toe-off. Each retains fixed swing terms, with no FK loan or arbitrary-time history.
 */
export function walkSwing(
  body: IAutoMovieMotionHumanBody,
  gait: Pick<IAutoMovieMotionHumanWalkGait, "lift" | "stiff" | "swing">,
  at: (side: "left" | "right", seconds: number, resolution?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[2]) => walkFoot.IEnd,
  closing: (side: "left" | "right", on: number) => boolean = (): boolean => false,
): (
  side: "left" | "right",
  swing: Swing,
  resolution?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[2],
) => ReadSwing {
  const readers: Record<AutoMovieHumanSide, Map<number, IArrival>> = { left: new Map(), right: new Map() };
  return (
    side: "left" | "right",
    swing: Swing,
    resolution?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[2],
  ): ReadSwing => {
    const retained: IArrival | undefined = readers[side].get(swing.off);
    if (retained?.on === swing.on) return retained.read;
    const from: walkFoot.IEnd = at(side, swing.off, resolution);
    const before: walkFoot.IEnd = at(side, swing.off - TICK, resolution);
    const read: ReadSwing = walkFoot.prepareSwing(body, side, {
      from,
      velocity: Vector3.scale(
        Vector3.subtract(from.ankle, before.ankle),
        1 / TICK,
      ),
      rates: {
        pitch:
          (HumanFoot.pitch(from.rotation) - HumanFoot.pitch(before.rotation)) /
          TICK,
        toes: (from.toes - before.toes) / TICK,
      },
      to: at(side, swing.on, resolution),
      seconds: swing.on - swing.off,
      lift: gait.lift,
      stiff: gait.stiff === side,
      // A walking foot sets down at rest; a running one strikes moving,
      // except into a closing stance, which lands flat to bear a body coming
      // to stand (`walkFoot.prepareStance`).
      settles: gait.swing <= 1 || closing(side, swing.on),
    });
    readers[side].set(swing.off, { on: swing.on, read });
    return read;
  };
}

/** Seconds before toe-off over which a stance's departure rates are read: a backward difference over a millisecond, far under a stance's tenths of a second, whose endpoints are settled to the reach owner's nanometre root tolerance. */
const TICK: number = 1e-3;
