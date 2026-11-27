import {
  Quaternion,
  AutoMovieEngineMotionSampling,
} from "@automovie/engine";
import type {
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import {
  type AutoMovieArchetype,
  AutoMovieArchetypeFrame,
  AutoMovieArchetypeRefusal,
} from "../../core";
import type { AutoMovieArchetypeSeesaw } from "../AutoMovieArchetypeSeesaw";

/** A unit scale: the rides move rigid frames. */
const ONE: IAutoMovieVector3 = { x: 1, y: 1, z: 1 };

/** The pivot axis: the beam rocks about `+X`. */
const AXIS: IAutoMovieVector3 = { x: 1, y: 0, z: 0 };

/**
 * A seesaw rocked by its riders' push-offs on the ride's clock: the beam model
 * (`createSeesaw.beam`) turns about the pivot axis, positive lowering the front
 * end at `+z`.
 *
 * The beam is held level while the riders sit, then let go at settle: its front
 * end drops to the ground, the rest angle whose sine is the pivot height over
 * half the beam. Each push-off is a rider's legs driving the low end up: the
 * beam turns from that limit to the other one over `swing` seconds on a
 * minimum-jerk profile, so it leaves and reaches each end at rest.
 *
 * @param seesaw The installed seesaw post.
 * @param placement Its world placement.
 * @param ride The push-off seconds and each rock's duration.
 * @returns The beam's angle, its frame and the low end at each ride second.
 * @throws {AutoMovieArchetypeRefusal} For push-offs out of order, or closer
 *   than one rock.
 */
export function rideSeesaw(
  seesaw: AutoMovieArchetype<
    AutoMovieArchetypeSeesaw.Affordance,
    AutoMovieArchetypeSeesaw.Dimension
  >,
  placement: IAutoMovieTransform,
  ride: AutoMovieArchetypeSeesaw.IRideParams,
): AutoMovieArchetypeSeesaw.IRideResult {
  const limit: number =
    Math.asin(seesaw.dimensions.pivot! / (seesaw.dimensions.length! / 2)) /
    Quaternion.DEG2RAD;
  ride.pushes.forEach((at: number, index: number): void => {
    const before: number = index === 0 ? ride.settle : ride.pushes[index - 1]!;
    if (!(at >= before + ride.swing && ride.swing > 0))
      throw new AutoMovieArchetypeRefusal({
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
    const drop: number = AutoMovieEngineMotionSampling.minimumJerkShare(
      (seconds - ride.settle) / ride.swing,
    );
    if (drop < 1) return limit * drop;
    let from: number = limit;
    for (const at of ride.pushes) {
      if (seconds <= at) break;
      const share: number = AutoMovieEngineMotionSampling.minimumJerkShare((seconds - at) / ride.swing);
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
      AutoMovieArchetypeFrame.compose(placement, {
        scale: ONE,
        translation: { x: 0, y: seesaw.dimensions.pivot!, z: 0 },
        rotation: Quaternion.fromAxisAngle(AXIS, angle(seconds)),
      }),
  };
}
