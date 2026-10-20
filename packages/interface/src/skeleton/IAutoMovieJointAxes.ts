import { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";
import { AutoMovieJointTwistPlacement } from "./AutoMovieJointTwistPlacement";

/**
 * The bone-local axes the three clinical angles rotate about.
 *
 * Lets a rig whose bone frames are not aligned to the default clinical planes,
 * such as a T-pose arm pointing along its local X, declare which local axis
 * flexion, abduction and twist each turn about, so flexion stays anatomically
 * sagittal instead of rolling the bone along its length.
 *
 * A rig declares them on the bone itself, {@link IAutoMovieBone.axes}, which
 * takes precedence over the per-bone table a host passes to the engine, such
 * as `HUMANOID_JOINT_AXES`; a bone that declares none reads that table, then
 * `DEFAULT_JOINT_AXES`.
 *
 * Each axis is a direction in the bone's local frame; any nonzero length is
 * accepted and normalized before use. The three must be finite, longer than
 * `1e-9`, and mutually orthogonal, the normalized axes' dot products within
 * `1e-6` of zero, in either handedness; otherwise `normalizeJointAxes` throws,
 * `validateJointAxesBasis` reports an issue, and `validateModel` refuses a
 * bone that declares them. `DEFAULT_JOINT_AXES` maps flexion to X, abduction
 * to Z and twist to Y, and `HUMANOID_JOINT_AXES` remaps the arms and turns
 * hip, ankle and toe flexion to −X, so positive flexion swings the thigh
 * forward and lifts the toes.
 *
 * @evidence contracts/common.md#principled-implementation An orthogonal basis per bone in which `jointToQuaternion` composes three axis-angle rotations and `decomposeJointRotation` inverts them by projecting onto the same axes, which is exact only for an orthogonal basis; the validators enforce that premise and the decomposer corrects a left-handed triple's twist sign.
 * @evidence contracts/common.md#clear-and-simple-design Three direction vectors and the composition order in one record per bone, so a rig overrides only the bones whose frames differ, on the bone or in a host table, and every composer and inverse reads the same declaration.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A skewed or degenerate basis is refused rather than orthogonalized, so a malformed declaration cannot silently change which motion an angle names.
 * @evidence contracts/common.md#meaningful-documentation States why a rig declares axes, where it declares them and the precedence over a host table, the frame and normalization of each axis, the orthogonality tolerance and the refusal paths, the defaults, and the composition order with its default.
 */
export interface IAutoMovieJointAxes {
  /** Bone-local axis flexion turns about, the sagittal hinge. */
  flexion: IAutoMovieVector3;

  /** Bone-local axis abduction turns about, the frontal hinge. */
  abduction: IAutoMovieVector3;

  /** Bone-local axis twist turns about, the bone's long axis. */
  twist: IAutoMovieVector3;

  /**
   * Where the axial rotation sits relative to the swing, which fixes the
   * composition order; omitted, `"proximal"`.
   */
  twistPlacement?: AutoMovieJointTwistPlacement;
}
