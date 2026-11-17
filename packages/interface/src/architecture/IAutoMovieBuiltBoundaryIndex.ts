import type { IAutoMovieBoundaryFace } from "./IAutoMovieBoundaryFace";

/**
 * Declared boundary identities and individually admitted faces of one building.
 *
 * validateBuiltBoundaries creates the containers and validateBuiltOpenings
 * borrows them. ids includes every declared string, even blank or duplicated
 * declarations. faces contains only individually passing faces; the last passing
 * face for a repeated id wins. Faces remain references to authored records.
 * A missing face skips opening containment but does not itself reject an opening
 * hull. The shared violation collector decides complete building admission.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines partial admission, duplicate identity handling, borrowed face ownership and missing-face behavior.
 * @evidence contracts/development/design.md#principled-representation Readonly collections expose the same boundary-id namespace with a partial face map; they do not imply complete building admission.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Boundary production and opening consumption share this index with an explicit mutable producer view.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Missing faces remain missing, and collection readonlyness does not freeze authored face objects.
 */
export interface IAutoMovieBuiltBoundaryIndex {
  /** Every declared boundary id, including invalid declarations. */
  ids: ReadonlySet<string>;

  /** Borrowed individually passing faces; absent ids have no containment geometry. */
  faces: ReadonlyMap<string, IAutoMovieBoundaryFace>;
}

/** Producer-owned mutable collection view of the same boundary index. */
export namespace IAutoMovieBuiltBoundaryIndex {
  /**
   * Fresh mutable containers returned by validateBuiltBoundaries.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States producer ownership while preserving the base's borrowed face records.
   * @evidence contracts/development/design.md#principled-representation Mutable Set and Map refine the base lookup capabilities without changing admission meaning.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Preserves existing producer mutation while opening validation consumes only the base view.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Mutability describes collection operations and does not certify an admitted building.
   */
  export interface IMutable extends IAutoMovieBuiltBoundaryIndex {
    /** Newly allocated declaration-id set; caller owns subsequent mutation. */
    ids: Set<string>;

    /** Newly allocated map whose authored face values remain borrowed. */
    faces: Map<string, IAutoMovieBoundaryFace>;
  }
}
