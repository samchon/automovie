import { IAutoMovieJointConstraint, IAutoMovieJointPose } from "@automovie/interface";
import { validateJointRom } from "../rom/validateJointRom";
import { ViolationCollector } from "../validation/ViolationCollector";

/**
 * Total ROM overshoot of one joint's clinical angles in degrees, `0` when the
 * joint is clean. This is {@link validatePose}'s verdict reduced to a single
 * comparable number, taken through the same {@link validateJointRom} the gate
 * runs so the solver cannot grade itself by a kinder rule than the one that
 * will judge it.
 *
 * @evidence requirements/motion/constraints-and-inverse-kinematics.md#motion-range-of-motion Measures how far a candidate exceeds the rig's declared joint ranges.
 * @evidence specifications/performance-motion-and-staging/kinematics-contact-and-interaction.md#performance-contact-phase-weight-support Applies the same ROM verdict used to rank constrained IK candidates.
 * @author Samchon
 */
export const jointRomOvershoot = (
  joint: IAutoMovieJointPose,
  constraint: IAutoMovieJointConstraint | null,
): number => {
  if (constraint === null) return 0;
  const collector = new ViolationCollector();
  validateJointRom({ joint, constraint, path: "$candidate", collector });
  return collector.items.reduce(
    // A violation with no overshoot is not a free one. `validateJointRom` omits
    // the measure exactly when the angle is NOT FINITE, which is worse than any
    // distance past a limit and has no distance to report. Scoring it `0` would
    // rank a malformed candidate as perfectly legal and let it win the
    // selection outright, so it is scored as unusable instead.
    (total, item) => total + (item.overshoot ?? Number.POSITIVE_INFINITY),
    0,
  );
};
