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
 * `pose` paints the current rows while `currentPose` reads the latest draft at event time; `clinical` and `coupled` are the package's own readings of the draft, printed beside the sliders rather than folded into them. Omitted `currentPose` uses the painted rows at event time; omitted `clinical` or `coupled` means the corresponding resolved reading was not supplied, rather than an independently measured clinical state.
 *
 * @evidence contracts/common.md#principled-implementation Authored sparse joint rows remain separate from resolved clinical coordinates and coupling contributions, so readback does not silently become an authored motion command.
 * @evidence contracts/common.md#clear-and-simple-design The row renderer receives a basis, selected bone, painted rows and latest-draft access; the panel keeps document publication and numerical pose resolution.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Optional clinical and coupled readings do not establish measured personal capacity, and the interface supplies no patched resolver or special pose result.
 * @evidence contracts/common.md#meaningful-documentation Comments identify degree-valued authored rows, package-resolved readback and optional latest-draft access, including each omitted-state meaning.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This pose-input structure implements neither slider construction nor rig resolution; the renderer and Human resolver own those algorithms.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The properties carry current readback without deciding when pose resolution can be reused or invalidated.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources DOM elements and basis data are supplied by the panel; this declaration creates no listener or retained renderer handle.
 *
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

  /**
   * Read the latest draft at event time, including edits still building. Without this getter, edits use the painted `pose` rows.
   *
   * @evidence contracts/common.md#principled-implementation Late draft lookup preserves newer sparse joint edits that may arrive after the slider rows were painted.
   * @evidence contracts/common.md#clear-and-simple-design The optional getter exposes authored joint rows alone, keeping the surrounding document and transaction state with their panel owner.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The getter supplies actual pending rows rather than overwriting them with the renderer's earlier snapshot.
   * @evidence contracts/common.md#meaningful-documentation Event-time access and the absent-getter fallback to painted rows are stated beside this optional callback.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This getter signature chooses no storage or lookup algorithm for the panel's current pose.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Reading the latest draft has no declared memoization or cross-event sharing semantics.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The borrowed readonly row view acquires no independent worker, listener or disposal obligation.
   */
  currentPose?: () => readonly IAutoMovieJointPose[];

  /** The package's coupled additions for this draft; absent when the caller evaluated none. */
  coupled?: readonly ReturnType<
    typeof resolveHumanBodyCouplings
  >["contributions"][number][];

  /**
   * Receive replacement sparse rows after a slider edit; the panel owns document admission and publication.
   *
   * @evidence contracts/common.md#principled-implementation The edit callback sends authored sparse coordinates to the document owner instead of treating displayed clinical readback as the command.
   * @evidence contracts/common.md#clear-and-simple-design Passing replacement rows keeps slider-local assembly separate from the panel's full-document commit operation.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts This edit handoff does not declare geometry publication successful or bypass the panel's admission path.
   * @evidence contracts/common.md#meaningful-documentation The callback comment locates document admission and publication in the panel and identifies its input as replacement sparse rows.
   * @evidenceExclude contracts/performance.md#efficient-algorithms No document merge or build strategy is selected by this edit-notification signature.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Slider edits are effectful notifications and the member declares no coalescing or cached result reuse.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Replacement row data is handed to the panel without transferring renderer or transport handles.
   */
  onChange: (pose: IAutoMovieJointPose[]) => void;
}
