import type { AutoMovieHumanoidBone } from "@automovie/interface";

/**
 * One existing source coupling's scalar degree addition, kept separate from final post-pelvis clinical coordinates.
 *
 * @evidence contracts/common.md#principled-implementation Coupling ID, existing bone, closed degree axis and signed increment preserve source scalar coordination separately from final frame-derived angles.
 * @evidence contracts/common.md#clear-and-simple-design One contribution carrier records the cause and destination of each coupling addition without embedding pose reconstruction.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Added scalar degrees cannot substitute for post-pelvis clinical coordinate admission or biological capacity.
 * @evidence contracts/common.md#meaningful-documentation Members identify source coupling, receiving bone/axis and signed degree units.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Contribution typing performs no joint-coordinate composition or coupling evaluation.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Scalar increment records store no equivalent pose resolution cache.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Contribution metadata acquires no frame buffers or ongoing coordination task.
 * @author Samchon
 */
export interface IHumanBodyCouplingContribution {
  /** Source coupling identity. */
  coupling: string;

  /** Existing rig bone receiving the addition. */
  bone: AutoMovieHumanoidBone;

  /** Existing degree axis receiving the addition. */
  axis: "flexion" | "abduction" | "twist";

  /** Existing signed scalar increment, degrees. */
  degrees: number;
}
