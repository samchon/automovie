import { IAutoMovieJointPose } from "@automovie/interface";
import { IAutoMovieRestFrame } from "../rom/IAutoMovieRestFrame";
import { toRigAngle } from "../rom/toRigAngle";

/**
 * A field-located malformed joint-axis basis issue.
 *
 * @evidence requirements/asset-authoring/rig-and-state.md#asset-invalid-rig-refusal Represents an actionable refusal for an unusable joint basis.
 * @evidence specifications/asset-and-representation/rig-deformation-and-state.md#asset-spec-rig-output-failures Encodes a field-located correction for one rejected rig basis.
 */
export interface IAutoMovieJointAxesIssue {
  /**
   * JSON-ish path to the offending axis field.
   *
   * @evidence requirements/asset-authoring/rig-and-state.md#asset-invalid-rig-refusal Locates the exact invalid control basis rather than falling back silently.
   * @evidence specifications/asset-and-representation/rig-deformation-and-state.md#asset-spec-rig-output-failures Identifies the rig field responsible for the validation failure.
   */
  path: string;

  /**
   * Human-readable correction requirement.
   *
   * @evidence requirements/asset-authoring/rig-and-state.md#asset-invalid-rig-refusal States the basis invariant that the rejected rig must satisfy.
   * @evidence specifications/asset-and-representation/rig-deformation-and-state.md#asset-spec-rig-output-failures Makes the rig refusal actionable for a correction round.
   */
  expected: string;

  /**
   * Offending value.
   *
   * @evidence requirements/asset-authoring/rig-and-state.md#asset-invalid-rig-refusal Retains the invalid axis data that caused refusal.
   * @evidence specifications/asset-and-representation/rig-deformation-and-state.md#asset-spec-rig-output-failures Returns the rejected input beside its field-located diagnosis.
   */
  value: unknown;
}

const readAngle = (
  joint: Pick<IAutoMovieJointPose, "flexion" | "abduction" | "twist">,
  axis: (typeof JOINT_AXES)[number],
  frame: IAutoMovieRestFrame[(typeof JOINT_AXES)[number]] | undefined,
): number => {
  const value = joint[axis];
  if (value !== null && !Number.isFinite(value))
    throw new Error(
      `jointToQuaternion ${axis} must be finite or null, but was ${value}`,
    );
  return toRigAngle(value, frame) ?? 0;
};
