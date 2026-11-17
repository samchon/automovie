import type { AutoMovieVector3Tuple } from "../AutoMovieVector3Tuple";

/**
 * An orthonormal frame: origin and three unit axes.
 *
 * @evidence contracts/development/design.md#principled-representation Sections are cut normal to one axis; the next two axes in cyclic order span the section plane.
 * @evidence contracts/development/design.md#minimal-and-owned-surface An origin and an axis triple, the whole of a rigid frame.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Orthonormality is a producer premise and is not re-checked.
 * @evidence contracts/development/common.md#meaningful-documentation States the in-plane axis convention at outline.
 */
export interface IAutoMovieMeshSectionFrame {
  /**
   * Section-frame origin in the input mesh's coordinate frame, millimetres.
   */
  origin: AutoMovieVector3Tuple;

  /**
   * Three orthonormal unit directions expressed in the mesh frame; outline assumes rather than validates orthonormality.
   */
  axes: [AutoMovieVector3Tuple, AutoMovieVector3Tuple, AutoMovieVector3Tuple];
}
