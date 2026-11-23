import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";
import type { IAutoMovieModelPart } from "../model/IAutoMovieModelPart";

/** Model-frame vertex collections sharing one set of transformed point objects. */
export namespace IAutoMovieModelPartPoints {
  /**
   * Every vertex of every part of one model, placed in the model's own frame.
   *
   * A primitive part is tessellated by the engine's kernel and a mesh part read
   * as stated; each vertex is moved by the part's own transform and, for a part
   * attached to a bone of the model's skeleton, then by that bone's world rest
   * placement (position and rotation, unit scale). A bone the rest pose does
   * not resolve leaves its parts unattached. Positions are read as whole `x, y,
   * z` triples and a trailing partial triple is ignored. Units are model
   * metres.
   *
   * The rest pose is resolved at most once per call, on the first attached
   * part. `parts` is keyed by the part objects of `model.parts`, in part order,
   * and `all` holds every part's points concatenated in that order.
   */
  export type IResult = {
    /**
     * New mutable map keyed by the exact input part objects, in model.parts
     * order. Each value is a new point array; a vertexless part retains an
     * empty entry.
     */
    parts: Map<IAutoMovieModelPart, IAutoMovieVector3[]>;
    /**
     * New mutable concatenation of per-part points in part/vertex order. Its
     * point objects are the same objects as the map's arrays, so edits to a
     * point are visible through both collections.
     */
    all: IAutoMovieVector3[];
  };
}
