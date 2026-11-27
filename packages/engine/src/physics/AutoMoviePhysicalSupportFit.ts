import type {
  IAutoMovieChoosePhysicalSupportFit,
  IAutoMoviePhysicalJoint,
  IAutoMovieRigidTransform,
} from "@automovie/interface";

import { Quaternion } from "../math/Quaternion";
import { physicalJointRelativeRotation } from "./internal/physicalJointRelativeRotation";

/** Chooses an admissible support fit using the existing residual and continuity rules. */
export namespace AutoMoviePhysicalSupportFit {
  /**
   * Choose one bounded support fit among candidates fitted from different seeds.
   *
   * A warm seed keeps temporal continuity but can trap the bounded fit in a poor
   * local solution that it then carries into every later replan; an authored seed
   * restarts from the declared posture each time. Candidates are ranked by the
   * fit's own contract: a fit whose largest residual meets the declared tolerance
   * is admissible. Among admissible fits the one closest to the completed
   * reference, summed squared joint rotation angle, wins, so an equally valid
   * solution never jumps. Without an admissible fit the smallest residual wins.
   * Ties keep the earlier candidate, so callers list the authored-seed fit
   * first.
   */
  export function choose<
    Fit extends {
      targets: Readonly<Record<string, IAutoMovieRigidTransform>>;
      residuals: Readonly<Record<string, number>>;
    },
  >(input: IAutoMovieChoosePhysicalSupportFit.IInput<Fit>): Fit {
    if (!input.candidates.length)
      throw new Error("Missing physical support fit candidates");
    const scored: { fit: Fit; error: number; distance: number }[] =
      input.candidates.map(
        (fit: Fit): { fit: Fit; error: number; distance: number } => ({
          fit,
          error: Math.max(0, ...Object.values(fit.residuals)),
          distance: input.reference
            ? input.joints.reduce(
                (sum: number, joint: IAutoMoviePhysicalJoint): number =>
                  sum + angle(fit.targets, input.reference!, joint) ** 2,
                0,
              )
            : 0,
        }),
      );
    const admissible: typeof scored = scored.filter(
      (entry: (typeof scored)[number]): boolean => entry.error <= input.tolerance,
    );
    const pool: typeof scored = admissible.length ? admissible : scored;
    return pool.reduce(
      (
        best: (typeof scored)[number],
        entry: (typeof scored)[number],
      ): (typeof scored)[number] =>
        (
          admissible.length
            ? entry.distance < best.distance
            : entry.error < best.error
        )
          ? entry
          : best,
    ).fit;
  }
}

/** Geodesic angle between one joint's relative rotations in two pose records. */
function angle(
  first: Readonly<Record<string, IAutoMovieRigidTransform>>,
  second: Readonly<Record<string, IAutoMovieRigidTransform>>,
  joint: IAutoMoviePhysicalJoint,
): number {
  const difference: IAutoMovieRigidTransform["rotation"] = Quaternion.multiply(
    physicalJointRelativeRotation(first, joint),
    Quaternion.inverse(physicalJointRelativeRotation(second, joint)),
  );
  return (
    2 *
    Math.atan2(
      Math.hypot(difference.x, difference.y, difference.z),
      Math.abs(difference.w),
    )
  );
}
