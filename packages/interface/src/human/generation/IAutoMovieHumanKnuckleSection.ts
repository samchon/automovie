import type { AutoMovieVector3Tuple } from "../../geometry/AutoMovieVector3Tuple";

/** Type contracts exchanged by AutoMovieHumanKnuckleSection; runtime evaluation remains in Human. */
export namespace IAutoMovieHumanKnuckleSection {
  /** A section's two measures, mm.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation A section's two measures, mm.
   * @evidence contracts/development/design.md#principled-representation `breadth`: Extent along the line from knuckle II to knuckle V. `girth`: Hull perimeter.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Returned by AutoMovieHumanKnuckleSection.measure. Also types AutoMovieHumanHandSkinTargets.skin.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `breadth`, `girth`; callers supply the complete record.
   */
  export interface IMeasure {
    /** Extent along the line from knuckle II to knuckle V. */
    breadth: number;

    /** Hull perimeter. */
    girth: number;
  }

  /** The mcps argument of AutoMovieHumanKnuckleSection.measure. Measure a mesh's knuckle section.
  @param positions Flat vertex positions, mm.
  @param indices Flat triangle indices.
  @param mcps Knuckles II, III and V.
  @param centre The wrist centre.
   *
 *
 * @evidence contracts/development/common.md#meaningful-documentation Measure a mesh's knuckle section.
 * @evidence contracts/development/design.md#principled-representation Measure a mesh's knuckle section. The outer tuple/array is readonly; nested element types determine whether their contents can change.
 * @evidence contracts/development/design.md#minimal-and-owned-surface IAutoMovieHumanKnuckleSection.MeasureMcps is the canonical exchange used by AutoMovieHumanKnuckleSection.measure.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The representation is used by AutoMovieHumanKnuckleSection.measure for measure a mesh's knuckle section.
 */
  export type MeasureMcps = readonly [
    AutoMovieVector3Tuple,
    AutoMovieVector3Tuple,
    AutoMovieVector3Tuple,
  ];
}
