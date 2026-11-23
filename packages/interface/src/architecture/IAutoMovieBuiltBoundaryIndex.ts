import type { IAutoMovieBoundaryFace } from "./IAutoMovieBoundaryFace";

/**
 * Declared boundary identities and individually admitted faces of one building.
 *
 * ValidateBuiltBoundaries creates the containers and validateBuiltOpenings
 * borrows them. ids includes every declared string, even blank or duplicated
 * declarations. faces contains only individually passing faces; the last
 * passing face for a repeated id wins. Faces remain references to authored
 * records. A missing face skips opening containment but does not itself reject
 * an opening hull. The shared violation collector decides complete building
 * admission.
 */
export interface IAutoMovieBuiltBoundaryIndex {
  /** Every declared boundary id, including invalid declarations. */
  ids: ReadonlySet<string>;

  /**
   * Borrowed individually passing faces; absent ids have no containment
   * geometry.
   */
  faces: ReadonlyMap<string, IAutoMovieBoundaryFace>;
}

/** Producer-owned mutable collection view of the same boundary index. */
export namespace IAutoMovieBuiltBoundaryIndex {
  /** Fresh mutable containers returned by validateBuiltBoundaries. */
  export interface IMutable extends IAutoMovieBuiltBoundaryIndex {
    /** Newly allocated declaration-id set; caller owns subsequent mutation. */
    ids: Set<string>;

    /** Newly allocated map whose authored face values remain borrowed. */
    faces: Map<string, IAutoMovieBoundaryFace>;
  }
}
