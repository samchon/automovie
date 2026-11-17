import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";
import type { IAutoMovieModelPart } from "../model/IAutoMovieModelPart";

/**
 * Model-frame vertex collections sharing one set of transformed point objects.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Model-frame vertex collections sharing one set of transformed point objects. Every point is in model metres after part and attached-bone rest placement; complete coordinate triples are read in source order and trailing partial triples are ignored.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts parts and all deliberately share point objects while owning their new collections; mutating a point through either view changes the other view, but not the input mesh coordinates.
 * @evidence contracts/development/design.md#principled-representation Every point is in model metres after part and attached-bone rest placement; complete coordinate triples are read in source order and trailing partial triples are ignored.
 * @evidence contracts/development/design.md#minimal-and-owned-surface autoMovieModelPartPoints prepares per-part and combined vertices for subject description; the map is keyed by the original model part objects, not their ids.
 */
export namespace IAutoMovieModelPartPoints {
  /**
   * Every vertex of every part of one model, placed in the model's own frame.
   *
   * A primitive part is tessellated by the engine's kernel and a mesh part read
   * as stated; each vertex is moved by the part's own transform and, for a part
   * attached to a bone of the model's skeleton, then by that bone's world rest
   * placement (position and rotation, unit scale). A bone the rest pose does not
   * resolve leaves its parts unattached. Positions are read as whole `x, y, z`
   * triples and a trailing partial triple is ignored. Units are model metres.
   *
   * The rest pose is resolved at most once per call, on the first attached part.
   * `parts` is keyed by the part objects of `model.parts`, in part order, and
   * `all` holds every part's points concatenated in that order.
   *
   * @evidence contracts/development/design.md#principled-representation Every point is in model metres after part and attached-bone rest placement; complete coordinate triples are read in source order and trailing partial triples are ignored.
   * @evidence contracts/development/design.md#minimal-and-owned-surface autoMovieModelPartPoints prepares per-part and combined vertices for subject description; the map is keyed by the original model part objects, not their ids.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts parts and all deliberately share point objects while owning their new collections; mutating a point through either view changes the other view, but not the input mesh coordinates.
   * @evidence contracts/development/common.md#meaningful-documentation Model-frame vertex collections sharing one set of transformed point objects. Every point is in model metres after part and attached-bone rest placement; complete coordinate triples are read in source order and trailing partial triples are ignored.
   */
  export type IResult = {
    /**
     * New mutable map keyed by the exact input part objects, in model.parts order. Each value is a new point array; a vertexless part retains an empty entry.
     */
    parts: Map<IAutoMovieModelPart, IAutoMovieVector3[]>;
    /**
     * New mutable concatenation of per-part points in part/vertex order. Its point objects are the same objects as the map's arrays, so edits to a point are visible through both collections.
     */
    all: IAutoMovieVector3[];
  };
}
