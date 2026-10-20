/**
 * Authored metre dimensions of the procedural block figure used by the proportions editor, including radii. These are conventional construction controls, not measured adult anatomy or clinically admitted measurements. Hip height and segment lengths are independent, and the builder checks no consistency, positivity or living-body feasibility.
 *
 * @evidence contracts/common.md#principled-implementation Named scalar dimensions control a fixed humanoid-bone primitive construction in metres; torsoLength is a layout scale and not independently measured final torso span.
 * @evidence contracts/common.md#clear-and-simple-design Eleven construction inputs expose the current editor's gross proportions without introducing vertex coordinates or a second morph document.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No measured population or anatomical validity is established by these inputs; independent hip/leg dimensions can place feet away from the floor, and owner admission remains absent.
 * @evidence contracts/common.md#meaningful-documentation The comment states metre units, conventional provenance and missing range/combination admission; member comments identify local construction effects.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This pure input interface chooses no primitive assembly, shortest-arc or rendering algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The input fields implement no model cache or equality/reuse policy.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources This dimensional record owns no worker, timer or GPU handle; the builder/page own resulting model data and uploads.
 */
export interface IHumanoidParams {
  /** Pelvis height off the floor (≈ leg length). */
  hipHeight: number;

  /** Torso layout scale distributed among spine, chest and shoulder offsets. */
  torsoLength: number;

  /** Neck length (chest top → head). */
  neckLength: number;

  /** Distance between the two shoulder sockets. */
  shoulderWidth: number;

  /** Distance between the two hip sockets. */
  hipWidth: number;

  /** Upper-arm (shoulder → elbow) length. */
  upperArmLength: number;

  /** Forearm (elbow → wrist) length. */
  lowerArmLength: number;

  /** Thigh (hip → knee) length. */
  thighLength: number;

  /** Shin (knee → ankle) length. */
  shinLength: number;

  /** Limb (arm/leg) capsule radius: "stockiness". */
  limbRadius: number;

  /** Head sphere radius. */
  headRadius: number;
}
