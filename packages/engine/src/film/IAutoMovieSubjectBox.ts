import { IAutoMovieVector3 } from "@automovie/interface";

/**
 * The world-space axis-aligned box a camera must contain to show a subject.
 *
 * Structurally the same record a compiled formation states its bounds in, so a
 * unit's own bounds pass straight through here without a conversion that could
 * disagree with them. It is spelled separately because a subject is not only a
 * formation: two actors, a prop and a crowd together, or one figure, all reduce
 * to the same box, and the framing solve reads nothing else.
 *
 * @evidence requirements/asset-authoring/representations-bounds-and-lod.md#asset-bounds-state-motion IAutoMovieSubjectBox carries the subject's current world-space minimum and maximum rather than substituting rest geometry for live extent.
 * @evidence specifications/asset-and-representation/bounds-proxies-and-lod.md#asset-spec-dynamic-bounds-invariants IAutoMovieSubjectBox realizes dynamic-bounds invariants: The world-space axis-aligned box a camera must contain to show a subject. Structurally the same record a compiled formation states its bounds in, so a unit's own bounds pass straight through here without a conversion that could disagree with them. It is spelled separately because a subject is not only a formation: two actors, a prop and a crowd together, or one figure, all reduce to the same box, and the framing solve reads nothing else.
 * @author Samchon
 */
export interface IAutoMovieSubjectBox {
  /**
   * Minimum world corner.
   *
   * @evidence requirements/asset-authoring/representations-bounds-and-lod.md#asset-bounds-state-motion IAutoMovieSubjectBox.min exposes state-dependent asset extent: Minimum world corner.
   * @evidence specifications/asset-and-representation/bounds-proxies-and-lod.md#asset-spec-dynamic-bounds-invariants IAutoMovieSubjectBox.min realizes dynamic-bounds invariants: Minimum world corner.
   */
  min: IAutoMovieVector3;

  /**
   * Maximum world corner.
   *
   * @evidence requirements/asset-authoring/representations-bounds-and-lod.md#asset-bounds-state-motion IAutoMovieSubjectBox.max exposes state-dependent asset extent: Maximum world corner.
   * @evidence specifications/asset-and-representation/bounds-proxies-and-lod.md#asset-spec-dynamic-bounds-invariants IAutoMovieSubjectBox.max realizes dynamic-bounds invariants: Maximum world corner.
   */
  max: IAutoMovieVector3;
}
