import type {
  IAutoMovieHumanBodyBasis,
  resolveHumanBodyCouplings,
} from "@automovie/human";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieJointPose,
} from "@automovie/interface";

/**
 * Inputs of `renderBodyPoseControls`: the selected bone's clinical sliders.
 *
 * `pose` paints the current rows while `currentPose` reads the latest draft at
 * event time; `clinical` and `coupled` are the package's own readings of the
 * draft, printed beside the sliders rather than folded into them.
 *
 * @evidence requirements/actors/body-authoring/contract.md#actor-body-editor Supplies the joint, its draft rows and the package's readings that the clinical sliders bind and display.
 * @evidence specifications/asset-and-representation/body-authoring/contract.md#body-spec-editor-view Separates the painted rows from the latest draft and from the displayed coupling and resolved readings.
 * @author Samchon
 */
export interface IBodyPoseControlsProps {
  /** Document the controls are created in. */
  dom: Document;

  /** Element whose children the controls replace. */
  container: HTMLElement;

  /** Admitted basis declaring each joint's neutral and constraint. */
  basis: IAutoMovieHumanBodyBasis;

  /** Bone whose three clinical axes are shown. */
  bone: AutoMovieHumanoidBone;

  /** Current sparse joint rows painted into the sliders, in degrees. */
  pose: readonly IAutoMovieJointPose[];

  /** Current-draft coordinates returned by the body's shared rig resolver. */
  clinical?: readonly IAutoMovieJointPose[];

  /** Read the latest draft at event time, including edits still building. */
  currentPose?: () => readonly IAutoMovieJointPose[];

  /** The package's coupled additions for this draft; absent when the caller evaluated none. */
  coupled?: readonly ReturnType<
    typeof resolveHumanBodyCouplings
  >["contributions"][number][];

  /** Receive the new sparse rows after a slider edit. */
  onChange: (pose: IAutoMovieJointPose[]) => void;
}
