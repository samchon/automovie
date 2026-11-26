import type { IAutoMovieResolvedJointAngles } from "@automovie/interface";

/**
 * The squared distance of one joint's clinical angles from the anatomical
 * neutral, `flexion² + abduction² + twist²`, in square degrees.
 *
 * All-zero clinical angles are the standing pose the ROM table is written
 * about, so a smaller value is less articulation. {@link reachPose} sums it over
 * the shoulder and elbow as the least-effort tie-break among arm poses whose
 * ROM overshoot is equal. The value is only meaningful for clinical angles;
 * rest-relative angles have a different origin.
 *
 * @param joint Resolved clinical angles in degrees.
 */
export function clinicalDeviation(
  joint: IAutoMovieResolvedJointAngles,
): number {
  return (
    joint.flexion * joint.flexion +
    joint.abduction * joint.abduction +
    joint.twist * joint.twist
  );
}
