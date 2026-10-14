import type { IAutoMovieHumanFaceCanthusExtreme } from "./IAutoMovieHumanFaceCanthusExtreme";
import type { IAutoMovieHumanFaceCanthusVertex } from "./IAutoMovieHumanFaceCanthusVertex";

/**
 * How a canthus is registered: an extreme of the joined margin rows along a
 * head-frame axis, or one fixed skin vertex where no extreme definition
 * exists.
 *
 * @evidence contracts/common.md#principled-implementation The kind-discriminated union distinguishes a final-margin axis extreme from a fixed registered source vertex, preserving the reader's two actual correspondence strategies.
 * @evidence contracts/common.md#clear-and-simple-design Existing Extreme and Vertex owners supply their own fields; the union adds no competing corner coordinate.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A source vertex is used only without an extreme definition; the union supplies no nearest-point registration, per-person vertex edit or anatomical qualification.
 * @evidence contracts/common.md#meaningful-documentation The comment identifies both registration methods and the head-frame margin premise instead of an unspecified screen-space corner.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This erased union performs no extreme search or vertex reading.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The alternative type defines no cached corner or source-dependent measurement reuse.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources It acquires no margin buffers or source resource; the basis owns its registration value.
 *
 * @author Samchon
 */
export type AutoMovieHumanFaceCanthusDefinition =
  | IAutoMovieHumanFaceCanthusExtreme
  | IAutoMovieHumanFaceCanthusVertex;
