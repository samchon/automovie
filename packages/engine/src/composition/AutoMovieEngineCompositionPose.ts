import { type IAutoMovieResolveMutualGoal, type IAutoMovieResolveRelationalGoal, type IAutoMovieFramingGoal, type IAutoMovieResolveFraming, type IAutoMovieVector3 } from "@automovie/interface";
import { resolveAutoMovieMutualGoal as resolveAutoMovieMutualGoalImplementation } from "./internal/resolveAutoMovieMutualGoal";
import { resolveAutoMovieRelationalGoal as resolveAutoMovieRelationalGoalImplementation } from "./internal/resolveAutoMovieRelationalGoal";
import { resolveAutoMovieFraming as resolveAutoMovieFramingImplementation } from "./internal/resolveAutoMovieFraming";

/** Public operations for Auto Movie Engine Composition Pose. */
export namespace AutoMovieEngineCompositionPose {
  /**
   * The point where two people's hands meet when both reach for it: a handshake's
   * clasp, a handover's exchange, a high five.
   *
   * Neither person's goal is the other's hand, which moves; both aim at one
   * shared point both can reach comfortably, the way joint-action studies find
   * people converge on it. Each person has a comfortable reach, the
   * shoulder-to-hand distance of the family's working elbow flexion, and the
   * point is where both arms are at it at once: in the vertical plane through the
   * two acting shoulders, the lower of the two points that lie one comfortable
   * reach from each shoulder, so the hands meet below the line between the
   * shoulders. For two equal people that is the midpoint between them, where
   * human-human handovers take place (Hansen et al. 2017, Human-human handover
   * tasks and how distance and object mass matter, Perceptual and Motor Skills
   * 124(1), reviewed by Kopnarski et al. 2023, Front. Psychol. 14:1147296),
   * `sqrt(reach^2 - h^2)` below the shoulders at the horizontal half gap `h`.
   * Between people of unequal stature the same rule moves the point up and toward
   * the taller one, who reaches down more steeply and less far forward while the
   * shorter one reaches forward: the exchange height rises with stature
   * (Sutiphotinun et al. 2020, reviewed by Kopnarski 2023). The rule for unequal
   * partners is provisional, as no study of the clasp point of partners of
   * unequal stature or arm length was located; it replaces a horizontal division
   * with a mean height that left the taller partner's arm straight at the end of
   * its reach.
   *
   * Shoulders farther apart than the two comfortable reaches leave no such point,
   * so both arms extend by one common factor of their comfortable reaches and the
   * hands meet on the line between the shoulders; shoulders nearer than the
   * difference of the reaches shorten both the same way. An action that has its
   * own preferred contact height (`height`, as an object is handed over at chest
   * height) passes it: the point then lies at that height where both arms are the
   * same fraction of their comfortable reaches (by a bracketed crossing along the
   * horizontal line between the shoulders, on which one distance grows as the
   * other shrinks), and the height is moved to the nearest one inside the band
   * both straight arms reach there.
   *
   * A meeting is refused, not stretched, when it lies beyond a straight arm: the
   * error gives both limits and the widest horizontal shoulder gap the pair can
   * close, so the author moves the people instead of receiving an arm torn off
   * its shoulder.
   *
   * @param input Both sides' acting shoulders and reaches.
   * @returns The meeting point and each side's shoulder distance to it.
   * @throws {Error} When a reach is not positive or exceeds its limit, the
   *   shoulders coincide, or the point lies beyond a limit.
   */
  export function mutualGoal(input: IAutoMovieResolveMutualGoal.IInput): IAutoMovieResolveMutualGoal.IGoal {
    return resolveAutoMovieMutualGoalImplementation(input);
  }

  /**
   * Realize a relational goal at one instant: read the target subject's region
   * from its actual pose (at the window's start for `freeze`, at the instant for
   * `track`), then bend the performer's prior pose toward it by the whole-body
   * fit ({@link fitPhysicalWholeBodyTarget}) from its held support, inside every
   * declared ROM, with an optional approach for the effector. Outside the window
   * the prior is returned unchanged with no residual.
   *
   * Bodies are engine-level: a physical profile, a pose at any instant (the
   * production's shape prior, such as an authored or keyed pose) and named
   * regions; no figure package is needed.
   *
   * @param input The performer, the goal, the bodies and the instant.
   * @returns The performer's fitted pose and residual report.
   */
  export function relationalGoal(input: IAutoMovieResolveRelationalGoal.IInput): IAutoMovieResolveRelationalGoal.IResult {
    return resolveAutoMovieRelationalGoalImplementation(input);
  }
  /** Resolve a camera pose that meets a framing goal. */
  export function resolveFraming(goal: IAutoMovieFramingGoal, state: Readonly<Record<string, { center: IAutoMovieVector3; radius: number }>>): IAutoMovieResolveFraming.ICamera {
    return resolveAutoMovieFramingImplementation(goal, state);
  }

}
