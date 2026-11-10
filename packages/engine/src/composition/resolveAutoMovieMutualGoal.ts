import type { IAutoMovieVector3 } from "@automovie/interface";

import { Vector3 } from "../math/Vector3";

/**
 * The point where two people's hands meet when both reach for it: a
 * handshake's clasp, a handover's exchange, a high five.
 *
 * Neither person's goal is the other's hand, which moves; both aim at one
 * shared point both can reach comfortably, the way joint-action studies find
 * people converge on it. Horizontally it is the midpoint between the two
 * acting shoulders: human-human handovers take place at the midpoint between
 * the partners (Hansen et al. 2017, Human-human handover tasks and how
 * distance and object mass matter, Perceptual and Motor Skills 124(1), reviewed
 * by Kopnarski et al. 2023, Front. Psychol. 14:1147296), and each person then
 * travels the same horizontal share. Vertically it is the mean of the two
 * heights at which each person's hand would hang at that horizontal distance
 * with the arm at its comfortable reach `reach` (the shoulder-to-hand distance
 * of the family's working elbow flexion): `y = shoulder.y - sqrt(reach^2 -
 * h^2)` for a half gap `h`, or the shoulder's own height when `h` exceeds the
 * comfortable reach. A taller partner therefore raises the point, as the
 * exchange height rises with stature (Sutiphotinun et al. 2020, reviewed by
 * Kopnarski 2023), and either partner's comfortable reach is honoured on
 * average. When the partners' statures differ so much that this mean lies
 * beyond one straight arm (a child and a tall adult), the height moves to the
 * nearest one inside the band of heights both straight arms reach at that
 * horizontal distance, so the shorter partner reaches up or the taller down
 * only as far as the other cannot.
 *
 * A meeting is refused, not stretched, when no height lies within both
 * straight arms' reach: the error gives both limits and the widest shoulder
 * gap the pair can close (the band only narrows as the gap widens, so it is
 * found by bisection), so the author moves the people instead of receiving
 * an arm torn off its shoulder.
 *
 * @param input Both sides' acting shoulders and reaches.
 * @returns The meeting point and each side's shoulder distance to it.
 * @throws {Error} When a reach is not positive, a comfortable reach exceeds its limit, or the point lies beyond a limit.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the horizontal and vertical rules with their sources, the frame and units, and the refusal.
 * @evidence contracts/development/implementation.md#principled-implementation Midpoint location (Hansen 2017) and a comfortable-reach hand height from the right triangle of the arm, the shoulder height and the half gap.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One closed-form point projected into one reachable band, and one feasibility check.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts An unreachable meeting is refused with the feasible gap, never clamped onto an arm; the projection only moves the height inside both arms' reach.
 * @evidence contracts/development/implementation.md#efficient-algorithms Constant work; a refusal adds a fixed 50-step bisection.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function of its input.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Allocates its result only.
 */
export function resolveAutoMovieMutualGoal(input: {
  /** One person. */ a: resolveAutoMovieMutualGoal.ISide;
  /** The other person. */ b: resolveAutoMovieMutualGoal.ISide;
}): resolveAutoMovieMutualGoal.IGoal {
  for (const side of [input.a, input.b])
    if (!(side.reach > 0 && side.limit >= side.reach))
      throw new Error(
        `A mutual goal needs 0 < reach <= limit, but had reach ${side.reach} and limit ${side.limit}`,
      );
  const half: number =
    Math.hypot(
      input.b.shoulder.x - input.a.shoulder.x,
      input.b.shoulder.z - input.a.shoulder.z,
    ) / 2;
  const height = (side: resolveAutoMovieMutualGoal.ISide): number =>
    side.shoulder.y -
    Math.sqrt(Math.max(0, side.reach * side.reach - half * half));

  // The heights each straight arm can reach at that horizontal distance; the
  // comfortable mean is moved into the band both share.
  const band = (
    side: resolveAutoMovieMutualGoal.ISide,
    h: number,
  ): [number, number] => {
    const drop: number = Math.sqrt(
      Math.max(0, side.limit * side.limit - h * h),
    );
    return [side.shoulder.y - drop, side.shoulder.y + drop];
  };
  const shared = (h: number): [number, number] => {
    const [a0, a1] = band(input.a, h);
    const [b0, b1] = band(input.b, h);
    return [Math.max(a0, b0), Math.min(a1, b1)];
  };
  const [low, high] = shared(half);
  if (half > Math.min(input.a.limit, input.b.limit) || low > high) {
    // The widest closable gap, by bisection on the half gap: the shared band
    // only narrows as the gap widens.
    let lo: number = 0;
    let hi: number = Math.min(input.a.limit, input.b.limit);
    for (let i: number = 0; i < 50; i++) {
      const mid: number = (lo + hi) / 2;
      const [l, u] = shared(mid);
      if (l <= u) lo = mid;
      else hi = mid;
    }
    throw new Error(
      `The hands cannot meet: no height lies within both arms' reach of ${input.a.limit.toFixed(3)} m and ${input.b.limit.toFixed(3)} m at a shoulder gap of ${(2 * half).toFixed(3)} m; bring the shoulders within about ${(2 * lo).toFixed(3)} m of each other`,
    );
  }
  const point: IAutoMovieVector3 = {
    x: (input.a.shoulder.x + input.b.shoulder.x) / 2,
    y: Math.min(high, Math.max(low, (height(input.a) + height(input.b)) / 2)),
    z: (input.a.shoulder.z + input.b.shoulder.z) / 2,
  };
  const distance: [number, number] = [
    Vector3.length(Vector3.subtract(point, input.a.shoulder)),
    Vector3.length(Vector3.subtract(point, input.b.shoulder)),
  ];
  return { point, distance };
}

/**
 * Companion types of {@link resolveAutoMovieMutualGoal}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Documents each member's unit and frame.
 * @evidence contracts/development/design.md#principled-representation A world shoulder with two reach lengths per side; a world point with two distances.
 * @evidence contracts/development/design.md#minimal-and-owned-surface What a two-person reaching law passes and reads.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No body type: any rig supplies a shoulder and its arm lengths.
 */
export namespace resolveAutoMovieMutualGoal {
  /** One person's acting arm. */
  export interface ISide {
    /** The acting shoulder joint, world metres. */
    shoulder: IAutoMovieVector3;

    /** Comfortable shoulder-to-contact distance, metres; positive. */
    reach: number;

    /** Full shoulder-to-contact reach with the elbow straight, metres; at least `reach`. */
    limit: number;
  }

  /** The meeting. */
  export interface IGoal {
    /** Where the hands meet, world metres. */
    point: IAutoMovieVector3;

    /** Each shoulder's distance to it, metres: `a` first. */
    distance: [number, number];
  }
}
