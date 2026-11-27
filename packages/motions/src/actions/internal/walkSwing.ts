import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanWalkFoot,
  IAutoMovieMotionHumanWalkGait,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanFoot } from "../../posture/internal/HumanFoot";
import { WALK_TICK } from "./WALK_TICK";
import { walkFoot } from "./walkFoot";
import { walkLocomoteSwings } from "./walkLocomoteSwings";
import { walkSteps } from "../../gait/internal/walkSteps";

/** The alternatives of `Swing2`'s site. */
type Swing2 = "off" | "on";

/** Swing endpoints in action seconds. */
type Swing = Pick<
  NonNullable<IAutoMovieMotionHumanWalkFoot.IScheduled["swing"]>,
  Swing2
>;

/** A swing evaluated at its normalized time from toe-off to heel strike. */
type ReadSwing = (share: number) => IAutoMovieMotionHumanWalkFoot.IFoot;

/** Reader prepared for the recorded arrival of this toe-off. */
interface IArrival {
  /** Heel-strike time in action seconds. */
  on: number;

  /** The owner's prepared swing. */
  read: ReadSwing;
}
/** The alternatives of `WalkSwingGait`'s site. */
type WalkSwingGait = "lift" | "stiff" | "swing" | "toeClearance" | "width";

/**
 * Prepare every swing of a plan from the stance reader that owns its endpoints:
 * for each swing the departure, its two predecessors a `WALK_TICK` apart, the
 * arrival and the other foot's stance at mid-swing are read once as the plan is
 * made, and the returned lookup hands back the swing's prepared reader, which
 * evaluates it at any share.
 *
 * @param body The plan's fixed body.
 * @param gait The gait's lift, straight leg and landing rule.
 * @param at The stance endpoint reader, in action seconds.
 * @param swings Every swing of the plan, from its step schedule.
 * @param closing Whether a foot's swing landing at a second lands in its
 *   closing stance, which it sets down into at rest whatever the gait; none
 *   when absent.
 * @returns The lookup of a scheduled swing's prepared share reader.
 */
export function walkSwing(
  body: IAutoMovieMotionHumanBody,
  gait: Pick<IAutoMovieMotionHumanWalkGait, WalkSwingGait>,
  at: (side: AutoMovieHumanSide, seconds: number) => walkFoot.IEnd,
  swings: readonly walkLocomoteSwings.ISwing[],
  closing: (side: AutoMovieHumanSide, on: number) => boolean = (): boolean =>
    false,
): (side: AutoMovieHumanSide, swing: Swing) => ReadSwing {
  const readers: Record<AutoMovieHumanSide, Map<number, IArrival>> = {
    left: new Map(),
    right: new Map(),
  };
  for (const swing of swings)
    readers[swing.side].set(swing.off, {
      on: swing.on,
      read: prepare(body, gait, at, closing, swing.side, swing),
    });
  return (side: AutoMovieHumanSide, swing: Swing): ReadSwing => {
    const prepared: IArrival | undefined = readers[side].get(swing.off);
    if (prepared === undefined || prepared.on !== swing.on)
      throw new Error(
        `walkSwing: the ${side} swing from ${swing.off} s to ${swing.on} s is not one of the plan's scheduled swings.`,
      );
    return prepared.read;
  };
}

/**
 * Prepare one swing from its endpoints.
 *
 * @param body The plan's fixed body.
 * @param gait The gait's lift, straight leg and landing rule.
 * @param at The stance endpoint reader, in action seconds.
 * @param closing Whether a swing landing at a second lands in its foot's
 *   closing stance.
 * @param side The swinging foot.
 * @param swing The swing's toe-off and heel strike.
 * @returns The swing's share reader.
 */
function prepare(
  body: IAutoMovieMotionHumanBody,
  gait: Pick<IAutoMovieMotionHumanWalkGait, WalkSwingGait>,
  at: (side: AutoMovieHumanSide, seconds: number) => walkFoot.IEnd,
  closing: (side: AutoMovieHumanSide, on: number) => boolean,
  side: AutoMovieHumanSide,
  swing: Swing,
): ReadSwing {
  // The swing departs from the stance's own end, its left limit at the
  // toe-off: the stance's last two readings, a tick and two ticks before,
  // give its rates by a backward difference and its end one tick on. Read
  // at the toe-off itself the foot is already the swing's, which the
  // stance's rule no longer holds (a sprint's settled foot there stood
  // 4.8 degrees and 12.6 mm off its stance a tick before), and the rates
  // read across that seam carried the swing's foot past upright and its
  // ankle away behind the running hip.
  const before: walkFoot.IEnd = at(side, swing.off - WALK_TICK);
  const earlier: walkFoot.IEnd = at(side, swing.off - 2 * WALK_TICK);
  const from: walkFoot.IEnd = {
    ankle: Vector3.add(
      before.ankle,
      Vector3.subtract(before.ankle, earlier.ankle),
    ),
    rotation: Quaternion.normalize(
      Quaternion.multiply(
        Quaternion.multiply(
          before.rotation,
          Quaternion.inverse(earlier.rotation),
        ),
        before.rotation,
      ),
    ),
    toes: 2 * before.toes - earlier.toes,
  };
  const to: walkFoot.IEnd = at(side, swing.on);
  const bow: IAutoMovieVector3 | undefined = passing(
    side,
    (gait.width ?? walkSteps.WIDTH) * body.measure.hipHeight,
    from.ankle,
    to.ankle,
    at(side === "left" ? "right" : "left", (swing.off + swing.on) / 2),
  );
  return walkFoot.prepareSwing(body, side, {
    from,
    velocity: Vector3.scale(
      Vector3.subtract(before.ankle, earlier.ankle),
      1 / WALK_TICK,
    ),
    rates: {
      pitch:
        (HumanFoot.pitch(before.rotation) - HumanFoot.pitch(earlier.rotation)) /
        WALK_TICK,
      toes: (before.toes - earlier.toes) / WALK_TICK,
    },
    to,
    ...(bow === undefined ? {} : { bow }),
    seconds: swing.on - swing.off,
    lift: gait.lift,
    ...(gait.toeClearance === undefined
      ? {}
      : { clearance: gait.toeClearance }),
    stiff: gait.stiff === side,
    // A walking foot sets down at rest; a running one strikes moving,
    // except into a closing stance, which lands flat to bear a body coming
    // to stand (`walkFoot.prepareStance`).
    settles: gait.swing <= 1 || closing(side, swing.on),
  });
}

/**
 * How far a swing bows out from the stance foot it passes: on a curve the
 * straight chord between a foot's footprints cuts in toward the other foot, so
 * where it passes the stance foot it is brought out to the nearer of the two
 * widths the footprints themselves stood beside it at, and to no less than the
 * gait's step width, which a tight curve's footprints may close below. A
 * straight walk's chord keeps its width and does not bow.
 *
 * @param side The swinging foot.
 * @param width The gait's step width, metres.
 * @param from Its departing ankle, world metres.
 * @param to Its landing ankle, world metres.
 * @param stance The other foot's stance as the swing passes it.
 * @returns The bow's amplitude on the swing's raised-cosine profile, horizontal
 *   world metres, or undefined when the chord keeps its width or never passes
 *   the stance foot.
 */
function passing(
  side: AutoMovieHumanSide,
  width: number,
  from: IAutoMovieVector3,
  to: IAutoMovieVector3,
  stance: walkFoot.IEnd,
): IAutoMovieVector3 | undefined {
  const heading: number = HumanFoot.heading(stance.rotation);
  const r: number = (heading * Math.PI) / 180;
  const forward: IAutoMovieVector3 = { x: Math.sin(r), y: 0, z: Math.cos(r) };
  // The swinging foot's own side of the stance foot.
  const sign: number = side === "left" ? 1 : -1;
  const out: IAutoMovieVector3 = {
    x: sign * Math.cos(r),
    y: 0,
    z: -sign * Math.sin(r),
  };
  const along: (p: IAutoMovieVector3) => number = (
    p: IAutoMovieVector3,
  ): number =>
    (p.x - stance.ankle.x) * forward.x + (p.z - stance.ankle.z) * forward.z;
  const aside: (p: IAutoMovieVector3) => number = (
    p: IAutoMovieVector3,
  ): number => (p.x - stance.ankle.x) * out.x + (p.z - stance.ankle.z) * out.z;
  const a0: number = along(from);
  const a1: number = along(to);
  if (!(a0 < 0 && a1 > 0)) return undefined;
  const u: number = -a0 / (a1 - a0);
  const d0: number = aside(from);
  const d1: number = aside(to);
  const short: number =
    Math.max(Math.min(d0, d1), width) - (d0 + (d1 - d0) * u);
  if (!(short > 0)) return undefined;
  // The swing lays the bow on its lift's raised-cosine profile over the
  // chord's progress (`walkFoot.prepareSwing`), so it is scaled to reach the
  // shortfall at the passing point, kept off the chord's ends.
  const at: number = Math.min(0.75, Math.max(0.25, u));
  return Vector3.scale(out, short / Math.sin(Math.PI * at) ** 2);
}
