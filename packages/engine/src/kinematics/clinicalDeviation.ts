import { IAutoMovieResolvedJointAngles } from "./IAutoMovieResolvedJointAngles";

/**
 * The squared distance of one joint's clinical angles from the anatomical
 * neutral, `flexion² + abduction² + twist²`, in square degrees.
 *
 * All-zero clinical angles are the standing pose the ROM table is written
 * about, so a smaller value is less articulation. {@link reachPose} sums it
 * over the shoulder and elbow as the least-effort tie-break among arm poses
 * whose ROM overshoot is equal. The value is only meaningful for clinical
 * angles; rest-relative angles have a different origin.
 *
 * @param joint Resolved clinical angles in degrees.
 *
 * @evidence contracts/common.md#principled-implementation A squared Euclidean norm of the three clinical coordinates, a quadratic least-effort prior centred on the anatomical neutral; it premises clinical angles, which `reachPose` guarantees by decomposing through the humanoid rest frame before scoring.
 * @evidence contracts/common.md#clear-and-simple-design One scoring term kept apart from `jointRomOvershoot` so the arm solve orders candidates by legality first and this effort second, and takes the shared resolved-angle record rather than its own shape.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Weighs the three axes equally for every bone; no bone, side or pose is special-cased.
 * @evidence contracts/common.md#meaningful-documentation States the formula, its unit, why zero is the neutral, which solve uses it and in what role, and that it is meaningless for rest-relative angles.
 * @evidence contracts/performance.md#efficient-algorithms Three multiplications and two additions with no allocation, called once per joint per swivel candidate.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Swivel candidates have different clinical angles, so their squared neutral distances are evaluated separately without a score cache.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Three squared angle values are summed directly, allocating no vector and retaining no candidate joint.
 */
export const clinicalDeviation: (
  joint: IAutoMovieResolvedJointAngles,
) => number = (joint: IAutoMovieResolvedJointAngles): number =>
  joint.flexion * joint.flexion +
  joint.abduction * joint.abduction +
  joint.twist * joint.twist;
