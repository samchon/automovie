import type {
  AutoMovieHumanoidBone,
  IAutoMovieQuaternion,
} from "@automovie/interface";

/**
 * One source bone/site supplies a public humanoid frame; no duplicate rig is solved.
 *
 * @evidence contracts/common.md#principled-implementation A source bone's optional named site and rest-local rotation determine one public humanoid frame through the same anatomical graph.
 * @evidence contracts/common.md#clear-and-simple-design Projection metadata attaches output identity to the source node, avoiding a separately solved public rig.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A missing site explicitly means bone-local origin, not a guessed geometric registration or silent alternate source.
 * @evidence contracts/common.md#meaningful-documentation Field comments identify public skin/goal ownership, local-origin omission and the source-owned orientation convention.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Projection metadata defines frame-composition operands without performing quaternion products.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work One source relationship does not memoize projected frames across changing poses.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Public-frame descriptors own no frame-map allocation or renderer resource.
 * @author Samchon
 */
export interface IAutoMovieHumanBodySourceProjection {
  /** Sole public goal/skin identity supplied by this source projection. */
  bone: AutoMovieHumanoidBone;

  /** Named source site supplying the public frame's origin; absence uses the bone-local origin. */
  site?: string;

  /** Source-owned rest-local orientation convention of the public frame. */
  rotation: IAutoMovieQuaternion;
}
