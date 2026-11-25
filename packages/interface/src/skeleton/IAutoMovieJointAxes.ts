import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";
import type { AutoMovieJointRotationOrder } from "./AutoMovieJointRotationOrder";
import type { AutoMovieJointTwistPlacement } from "./AutoMovieJointTwistPlacement";

/**
 * The bone-local axes the three clinical angles rotate about.
 *
 * Lets a rig whose bone frames are not aligned to the default clinical planes,
 * such as a T-pose arm pointing along its local X, declare which local axis
 * flexion, abduction and twist each turn about, so flexion stays anatomically
 * sagittal instead of rolling the bone along its length.
 *
 * A rig declares them on the bone itself, {@link IAutoMovieBone.axes}, which
 * takes precedence over the per-bone table a host passes to the engine, such as
 * `HUMANOID_JOINT_AXES`; a bone that declares none reads that table, then
 * `DEFAULT_JOINT_AXES`.
 *
 * Each axis is a direction in the bone's local frame; any nonzero length is
 * accepted and normalized before use. The three must be finite, longer than
 * `1e-9`, and mutually orthogonal, the normalized axes' dot products within
 * `1e-6` of zero, in either handedness; otherwise `normalizeJointAxes` throws,
 * `validateJointAxesBasis` reports an issue, and `validateModel` refuses a bone
 * that declares them. `DEFAULT_JOINT_AXES` maps flexion to X, abduction to Z
 * and twist to Y, and `HUMANOID_JOINT_AXES` remaps the arms and turns hip,
 * ankle and toe flexion to −X, so positive flexion swings the thigh forward and
 * lifts the toes.
 */
export interface IAutoMovieJointAxes {
  /** Bone-local axis flexion turns about, the sagittal hinge. */
  flexion: IAutoMovieVector3;

  /** Bone-local axis abduction turns about, the frontal hinge. */
  abduction: IAutoMovieVector3;

  /** Bone-local axis twist turns about, the bone's long axis. */
  twist: IAutoMovieVector3;

  /**
   * Where the axial rotation sits relative to the swing, which fixes the legacy
   * composition order. Without `rotationOrder`, proximal (the default) composes
   * twist, abduction, flexion, and distal composes abduction, flexion, twist.
   * With an explicit order, this field may be omitted or distal.
   */
  twistPlacement?: AutoMovieJointTwistPlacement;

  /**
   * Explicit clinical order. Omit for the legacy order selected by twist
   * placement.
   */
  rotationOrder?: AutoMovieJointRotationOrder;
}
