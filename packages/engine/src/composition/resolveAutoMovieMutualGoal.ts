import type { IAutoMovieVector3 } from "@automovie/interface";

import { Vector3 } from "../math/Vector3";

/**
 * The point where two people's hands meet when both reach for it: a
 * handshake's clasp, a handover's exchange, a high five.
 *
 * Neither person's goal is the other's hand, which moves; both aim at one
 * shared point both can reach comfortably, the way joint-action studies find
 * people converge on it. Each person has a comfortable reach, the
 * shoulder-to-hand distance of the family's working elbow flexion, and the
 * point is where both arms are at it at once: in the vertical plane through
 * the two acting shoulders, the lower of the two points that lie one
 * comfortable reach from each shoulder, so the hands meet below the line
 * between the shoulders. For two equal people that is the midpoint between
 * them, where human-human handovers take place (Hansen et al. 2017,
 * Human-human handover tasks and how distance and object mass matter,
 * Perceptual and Motor Skills 124(1), reviewed by Kopnarski et al. 2023,
 * Front. Psychol. 14:1147296), `sqrt(reach^2 - h^2)` below the shoulders at
 * the horizontal half gap `h`. Between people of unequal stature the same
 * rule moves the point up and toward the taller one, who reaches down more
 * steeply and less far forward while the shorter one reaches forward: the
 * exchange height rises with stature (Sutiphotinun et al. 2020, reviewed by
 * Kopnarski 2023). The rule for unequal partners is provisional, as no study
 * of the clasp point of partners of unequal stature or arm length was
 * located; it replaces a horizontal division with a mean height that left
 * the taller partner's arm straight at the end of its reach.
 *
 * Shoulders farther apart than the two comfortable reaches leave no such
 * point, so both arms extend by one common factor of their comfortable
 * reaches and the hands meet on the line between the shoulders; shoulders
 * nearer than the difference of the reaches shorten both the same way. An
 * action that has its own preferred contact height (`height`, as an object
 * is handed over at chest height) passes it: the point then lies at that
 * height where both arms are the same fraction of their comfortable reaches
 * (by bisection along the horizontal line between the shoulders, on which
 * one distance grows as the other shrinks), and the height is moved to the
 * nearest one inside the band both straight arms reach there.
 *
 * A meeting is refused, not stretched, when it lies beyond a straight arm:
 * the error gives both limits and the widest horizontal shoulder gap the
 * pair can close, so the author moves the people instead of receiving an arm
 * torn off its shoulder.
 *
 * @param input Both sides' acting shoulders and reaches.
 * @returns The meeting point and each side's shoulder distance to it.
 * @throws {Error} When a reach is not positive or exceeds its limit, the shoulders coincide, or the point lies beyond a limit.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the rule with its sources, the wide and the preferred-height cases, the frame and units, and the refusal.
 * @evidence contracts/development/implementation.md#principled-implementation The midpoint of equal arms (Hansen 2017) generalised to the one point at which both arms hold their comfortable reach: the intersection of two spheres in the shoulders' vertical plane.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One common extension factor, one two-circle intersection, and for a preferred height one bisection and one band.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts An unreachable meeting is refused with the feasible gap, never clamped onto an arm; a preferred height only moves inside both arms' reach.
 * @evidence contracts/development/implementation.md#efficient-algorithms Closed form; a preferred height adds a fixed 50-step bisection, and its refusal another.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function of its input.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Allocates its result only.
 */
export function resolveAutoMovieMutualGoal(input: {
  /** One person. */ a: resolveAutoMovieMutualGoal.ISide;
  /** The other person. */ b: resolveAutoMovieMutualGoal.ISide;
  /**
   * The height the action itself prefers for the contact, world metres, when
   * it has one (an object handed over at chest height): the point lies at it,
   * or at the nearest height both straight arms reach.
   */
  height?: number;
}): resolveAutoMovieMutualGoal.IGoal {
  const a: resolveAutoMovieMutualGoal.ISide = input.a;
  const b: resolveAutoMovieMutualGoal.ISide = input.b;
  for (const side of [a, b])
    if (!(side.reach > 0 && side.limit >= side.reach))
      throw new Error(
        `A mutual goal needs 0 < reach <= limit, but had reach ${side.reach} and limit ${side.limit}`,
      );
  const span: IAutoMovieVector3 = Vector3.subtract(b.shoulder, a.shoulder);
  const apart: number = Vector3.length(span);
  if (!(apart > 1e-9))
    throw new Error("A mutual goal needs two shoulders at different places");
  const gap: number = Math.hypot(span.x, span.z);
  const refuse = (closable: number): Error =>
    new Error(
      `The hands cannot meet: no point lies within both arms' reach of ${a.limit.toFixed(3)} m and ${b.limit.toFixed(3)} m at a shoulder gap of ${gap.toFixed(3)} m; bring the shoulders within about ${closable.toFixed(3)} m of each other`,
    );
  const done = (
    point: IAutoMovieVector3,
  ): resolveAutoMovieMutualGoal.IGoal => ({
    point,
    distance: [
      Vector3.length(Vector3.subtract(point, a.shoulder)),
      Vector3.length(Vector3.subtract(point, b.shoulder)),
    ],
  });

  if (input.height === undefined) {
    // The common factor both comfortable reaches are scaled by: 1 while the
    // two spheres intersect, else the nearest factor at which they touch.
    const factor: number = Math.min(
      Math.max(1, apart / (a.reach + b.reach)),
      apart / Math.abs(a.reach - b.reach),
    );
    const most: number = Math.min(a.limit / a.reach, b.limit / b.reach);
    if (factor > most) {
      const widest: number = most * (a.reach + b.reach);
      throw refuse(Math.sqrt(Math.max(0, widest * widest - span.y * span.y)));
    }
    const axis: IAutoMovieVector3 = Vector3.scale(span, 1 / apart);
    const reach: number = factor * a.reach;
    const along: number =
      (reach * reach - factor * factor * b.reach * b.reach + apart * apart) /
      (2 * apart);
    const off: number = Math.sqrt(Math.max(0, reach * reach - along * along));
    // Downward across the line between the shoulders; one shoulder straight
    // above the other leaves no such direction and no offset to place.
    const down: IAutoMovieVector3 = Vector3.subtract(
      { x: 0, y: -1, z: 0 },
      Vector3.scale(axis, -axis.y),
    );
    const length: number = Vector3.length(down);
    return done(
      Vector3.add(
        Vector3.add(a.shoulder, Vector3.scale(axis, along)),
        length > 1e-9
          ? Vector3.scale(down, off / length)
          : { x: 0, y: 0, z: 0 },
      ),
    );
  }

  // A preferred height: along the horizontal line between the shoulders, the
  // place where both arms are the same fraction of their comfortable reaches.
  const preferred: number = input.height;
  const meet = (g: number): { share: number; low: number; high: number } => {
    const excess = (t: number): number =>
      Math.hypot(t, preferred - a.shoulder.y) * b.reach -
      Math.hypot(g - t, preferred - b.shoulder.y) * a.reach;
    let lo: number = 0;
    let hi: number = g;
    if (excess(lo) >= 0) hi = lo;
    else if (excess(hi) <= 0) lo = hi;
    else
      for (let i: number = 0; i < 50; i++) {
        const mid: number = (lo + hi) / 2;
        if (excess(mid) < 0) lo = mid;
        else hi = mid;
      }
    const t: number = (lo + hi) / 2;
    // The heights each straight arm reaches at its horizontal distance.
    const reachA: number = Math.sqrt(Math.max(0, a.limit * a.limit - t * t));
    const reachB: number = Math.sqrt(
      Math.max(0, b.limit * b.limit - (g - t) * (g - t)),
    );
    const beyond: boolean = t > a.limit || g - t > b.limit;
    return {
      share: g > 1e-9 ? t / g : 0,
      low: beyond
        ? Infinity
        : Math.max(a.shoulder.y - reachA, b.shoulder.y - reachB),
      high: beyond
        ? -Infinity
        : Math.min(a.shoulder.y + reachA, b.shoulder.y + reachB),
    };
  };
  const { share, low, high } = meet(gap);
  if (low > high) {
    // The widest closable gap, by bisection: the shared band only narrows as
    // the gap widens.
    let lo: number = 0;
    let hi: number = a.limit + b.limit;
    for (let i: number = 0; i < 50; i++) {
      const mid: number = (lo + hi) / 2;
      const band = meet(mid);
      if (band.low <= band.high) lo = mid;
      else hi = mid;
    }
    throw refuse(lo);
  }
  return done({
    x: a.shoulder.x + share * span.x,
    y: Math.min(high, Math.max(low, preferred)),
    z: a.shoulder.z + share * span.z,
  });
}

/**
 * Companion types of {@link resolveAutoMovieMutualGoal}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Documents each member's unit and frame.
 * @evidence contracts/development/design.md#principled-representation A world shoulder with two reach lengths per side; a world point with two distances.
 * @evidence contracts/development/design.md#minimal-and-owned-surface What a two-person reaching law passes and reads.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No body type: any rig supplies a shoulder and two lengths.
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
