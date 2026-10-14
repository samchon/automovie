import type {
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

/**
 * One admitted bone's position-dependent twist decomposition for skinning.
 *
 * @evidence contracts/common.md#principled-implementation Rest head/axis/length, posed head, parent-carried swing and local twist describe one admitted distributed-twist bone for skinHumanBodySurface.
 * @evidence contracts/common.md#clear-and-simple-design A single internal carrier shares the bone decomposition among affected vertices while each vertex supplies only its rest position.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Positive finite axis length and admitted unit rotations remain producer premises; this type establishes no clinical twist capacity or tissue volume preservation.
 * @evidence contracts/common.md#meaningful-documentation Members give metre frames, axis direction, swing/twist roles and the hemisphere reference used by vertex-specific blends.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The decomposition carrier performs no quaternion splitting or vertex traversal.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The schema represents a shared bone result while the skinning invocation owns computation and reuse.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The carrier itself acquires no skin buffer, persistent cache or task.
 * @author Samchon
 */
export interface IHumanBodyTwistSpread {
  /** Rest bone head in body metres. */
  head: IAutoMovieVector3;

  /** The same bone head after its admitted pose, in body metres. */
  posedHead: IAutoMovieVector3;

  /** Unit rest direction from the bone head toward its unique child's head. */
  axis: IAutoMovieVector3;

  /** Positive head-to-child distance in metres. */
  length: number;

  /** Parent-carried swing before applying the vertex's local twist fraction. */
  base: IAutoMovieQuaternion;

  /** Local unit twist about the rest axis. */
  twist: IAutoMovieQuaternion;

  /** Parent-aligned whole-bone rotation used to choose a consistent quaternion sign. */
  reference: IAutoMovieQuaternion;
}
