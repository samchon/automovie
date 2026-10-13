import type {
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

/**
 * The rigid motion that carries a face part from the neutral frame onto the posed head of a shaped body: `point(p) = R (p + shift) + t`.
 *
 * @evidence contracts/common.md#principled-implementation The rigid carry composes posed rotation with inverse rest rotation and applies shaped-minus-neutral anchor shift before posed translation.
 * @evidence contracts/common.md#clear-and-simple-design One transform exposes point and direction operations so generated rigid parts share the same bone carry while normals omit translation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The transform derives from actual head rest and posed frames rather than fitting a face to separately generated body geometry.
 * @evidence contracts/common.md#meaningful-documentation Documentation supplies the point formula, inverse-rest rotation, rest-shape shift and the distinct treatment of directions.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The rigid head carry fields and operation signatures specify data and signatures; numerical producers own their traversal strategy.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Request equivalence is not implemented by the rigid head carry fields and operation signatures; consuming operations decide dependency-sensitive reuse.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The rigid head carry fields and operation signatures acquire no external resource or running task; their containing value owns ordinary data retention.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanPersonHeadTransform {
  /** The change of orientation from rest to pose, `posed.rotation * inverse(rest.rotation)`. */
  rotation: IAutoMovieQuaternion;

  /** The rest-frame translation alone, metres: the anchor's shaped minus neutral position. */
  shift: IAutoMovieVector3;

  /**
   * Carry a neutral-frame point onto the posed head, in metres. The returned vector is owned by the caller.
   *
   * @evidence contracts/common.md#principled-implementation Point carry first applies shaped-minus-neutral anchor shift, then the rest-to-pose rigid rotation and posed bone offset.
   * @evidence contracts/common.md#clear-and-simple-design The point operation shares the transform's precomputed direction rotation while adding the translations that positions require.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The same rigid bone carry applies to every point without vertex-specific alignment or a fitted correction.
   * @evidence contracts/common.md#meaningful-documentation The member states neutral-to-posed frame conversion, metre units and ownership of the returned vector.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This point signature chooses no matrix evaluation; the head-transform factory precomputes its rotation basis.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Per-point result caching is not declared; the implementing transform shares only invariant rotation and translation coefficients.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The point method declaration acquires no state and returns an ordinary caller-owned vector through its implementation.
   */
  point(p: IAutoMovieVector3): IAutoMovieVector3;

  /**
   * Rotate a direction by the rest-to-pose orientation without translation, preserving length. The returned vector is owned by the caller.
   *
   * @evidence contracts/common.md#principled-implementation A rigid orientation rotates directions without anchor or posed translation, preserving a unit normal's length under admitted bone frames.
   * @evidence contracts/common.md#clear-and-simple-design A separate direction operation exposes the position-versus-normal distinction while sharing the same precomputed rotation.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Directions are rotated by the actual head carry rather than replaced with a constant normal after posing.
   * @evidence contracts/common.md#meaningful-documentation The member documents rest-to-pose rotation, omitted translation, length preservation and returned vector ownership.
   * @evidenceExclude contracts/performance.md#efficient-algorithms A direction method signature implements no numeric loop; the transform factory owns its constant-size matrix multiplication.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Invariant basis reuse belongs to the head-transform closure; this direction declaration stores no query results.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Direction calls are synchronous in the supplied implementation and the type owns no retained task or external handle.
   */
  direction(n: IAutoMovieVector3): IAutoMovieVector3;
}
