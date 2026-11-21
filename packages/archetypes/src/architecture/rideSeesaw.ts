import { Quaternion, minimumJerk } from "@automovie/engine";
import type {
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { type Archetype, ArchetypeFrame, ArchetypeRefusal } from "../core";
import type { createSeesaw } from "./createSeesaw";

/** A unit scale: the rides move rigid frames. */
const ONE: IAutoMovieVector3 = { x: 1, y: 1, z: 1 };

/** The pivot axis: the beam rocks about `+X`. */
const AXIS: IAutoMovieVector3 = { x: 1, y: 0, z: 0 };

/**
 * A seesaw rocked by its riders' push-offs on the ride's clock: the beam
 * model (`createSeesaw.beam`) turns about the pivot axis, positive lowering
 * the front end at `+z`.
 *
 * The beam is held level while the riders sit, then let go at settle:
 * its front end drops to the ground, the rest angle whose sine is the
 * pivot height over half the beam. Each push-off is a rider's legs
 * driving the low end up: the beam turns from that limit to the other one
 * over `swing` seconds on a minimum-jerk profile, so it leaves and reaches
 * each end at rest.
 *
 * @param seesaw The installed seesaw post.
 * @param placement Its world placement.
 * @param ride The push-off seconds and each rock's duration.
 * @returns The beam's angle, its frame and the low end at each ride second.
 * @throws {ArchetypeRefusal} For push-offs out of order, or closer than one rock.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the clock, the rest limits, the push-off rule and the start.
 * @evidence contracts/development/implementation.md#principled-implementation The beam's limits are its ground contacts; each authored push-off starts one rest-to-rest rock between them.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Admit the push-offs, then read the rock a second falls in.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The rock duration is the author's input; the limits are geometry.
 * @evidence contracts/development/implementation.md#efficient-algorithms One scan of the push-offs per read.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each read is independent arithmetic.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Retains the push-off list while the caller keeps the ride.
 */
export function rideSeesaw(
  seesaw: Archetype<createSeesaw.Affordance, createSeesaw.Dimension>,
  placement: IAutoMovieTransform,
  ride: rideSeesaw.IParams,
): rideSeesaw.IRide {
  const limit: number =
    Math.asin(seesaw.dimensions.pivot! / (seesaw.dimensions.length! / 2)) /
    Quaternion.DEG2RAD;
  ride.pushes.forEach((at: number, index: number): void => {
    const before: number = index === 0 ? ride.settle : ride.pushes[index - 1]!;
    if (!(Number.isFinite(at) && at >= before + ride.swing && ride.swing > 0))
      throw new ArchetypeRefusal({
        kind: "parameter",
        archetype: "seesaw",
        axis: "pushes",
        value: ride.pushes,
        feasible: null,
        reason: "each push-off starts after the previous rock has ended",
        fix: "space the push-offs at least one rock apart",
      });
  });
  const angle = (seconds: number): number => {
    // Held level until it is let go, the front end then drops to the ground.
    if (seconds <= ride.settle) return 0;
    const drop: number = minimumJerk.share(
      (seconds - ride.settle) / ride.swing,
    );
    if (drop < 1) return limit * drop;
    let from: number = limit;
    for (const at of ride.pushes) {
      if (seconds <= at) break;
      const share: number = minimumJerk.share((seconds - at) / ride.swing);
      const to: number = -from;
      if (share < 1) return from + (to - from) * share;
      from = to;
    }
    return from;
  };
  return {
    limit,
    angle,
    beam: (seconds: number): IAutoMovieTransform =>
      ArchetypeFrame.compose(placement, {
        scale: ONE,
        translation: { x: 0, y: seesaw.dimensions.pivot!, z: 0 },
        rotation: Quaternion.fromAxisAngle(AXIS, angle(seconds)),
      }),
  };
}

/**
 * The seesaw ride's parameters and readers.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Each member states its unit and clock.
 * @evidence contracts/development/design.md#principled-representation Seconds and degrees.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The playground test reads these members.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The push-offs are explicit instants, not a period.
 */
export namespace rideSeesaw {
  /**
   * When the riders push off and how long a rock takes.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its unit.
   * @evidence contracts/development/design.md#principled-representation Ride seconds.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Read by `rideSeesaw`.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Push-offs alternate ends by order.
   */
  export interface IParams {
    /** The ride second the beam, held level while the riders sit, is let go; its front end then drops to the ground over one rock. */
    settle: number;

    /** Ride seconds of each push-off, ascending, each at least one rock after the previous one or the release; the first raises the front end. */
    pushes: readonly number[];

    /** Seconds a rock from one end to the other takes. */
    swing: number;
  }

  /**
   * One rocking seesaw's readers.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its unit and clock.
   * @evidence contracts/development/design.md#principled-representation Degrees and world frames over ride seconds.
   * @evidence contracts/development/design.md#minimal-and-owned-surface What a rider's composition and the test read.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No reader stores a pose.
   */
  export interface IRide {
    /** The beam's angle with an end on the ground, degrees. */
    limit: number;

    /**
     * The beam's angle at a ride second, degrees, positive with the front end down.
     *
     * @param seconds Ride seconds.
     * @returns The angle.
     */
    angle(seconds: number): number;

    /**
     * The beam model's world frame at a ride second.
     *
     * @param seconds Ride seconds.
     * @returns The frame.
     */
    beam(seconds: number): IAutoMovieTransform;
  }
}
