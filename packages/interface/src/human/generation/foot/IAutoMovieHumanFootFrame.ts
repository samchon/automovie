import type { AutoMovieVector3Tuple } from "../../../geometry/AutoMovieVector3Tuple";

/**
 * Calibration-millimetre foot dimensions and the map from normalized foot coordinates into the left frame.
 *
 * The interface package owns these declarations; AutoMovieHumanFootFrame in Human supplies their runtime values.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Calibration-millimetre foot dimensions and the map from normalized foot coordinates into the left frame. Member comments specify the individual units, frames and optional-value meanings.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The namespace groups only IDimensions, IFrame declarations; it adds no runtime state, fixture dispatch or alternate implementation. Each member retains its own concrete data or callable representation.
 * @evidence contracts/development/design.md#principled-representation IDimensions, IFrame separate the declared inputs, results and related quantities. Their numeric domains and geometric consistency remain the Human producers' and engine operators' runtime responsibility; the namespace introduces no additional frame or clock.
 * @evidence contracts/development/design.md#minimal-and-owned-surface AutoMovieHumanFootFrame exchanges the named IDimensions, IFrame contracts with its Human callers. Interface owns these type declarations without importing that implementation.
 */
export namespace IAutoMovieHumanFootFrame {
  /** A foot's dimensions in calibration millimetres.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation A foot's dimensions in calibration millimetres.
   * @evidence contracts/development/design.md#principled-representation `length`: Back of the heel to the tip of the longest toe. `breadth`: Greatest breadth across the metatarsal heads. `ankle`: Height of the lateral malleolus.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Read by AutoMovieHumanFootFrame.of.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `length`, `breadth`, `ankle`; callers supply the complete record.
   */
  export interface IDimensions {
    /** Back of the heel to the tip of the longest toe. */
    length: number;

    /** Greatest breadth across the metatarsal heads. */
    breadth: number;

    /** Height of the lateral malleolus. */
    ankle: number;
  }

  /** A foot's frame: its scales and the map from normalised coordinates.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation A foot's frame: its scales and the map from normalised coordinates.
   * @evidence contracts/development/design.md#principled-representation `L`: Foot length, mm. `B`: Foot breadth, mm. `H`: Lateral malleolus height, mm.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Returned by AutoMovieHumanFootFrame.of. Read by AutoMovieHumanFootAchilles.knots, AutoMovieHumanFootColumn.knots, AutoMovieHumanFootColumn.centre. Also types AutoMovieHumanFootConstruction.k, AutoMovieHumanFootBones.frame.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `L`, `B`, `H`, `ring`, `at`, `lateral`; callers supply the complete record.
   */
  export interface IFrame {
    /** Foot length, mm. */
    L: number;

    /** Foot breadth, mm. */
    B: number;

    /** Lateral malleolus height, mm. */
    H: number;

    /** Ankle ring height, mm. */
    ring: number;

    /**
     * World point of normalised foot coordinates `[a, u, y mm]`, left frame.
     *
     * @evidence contracts/development/common.md#meaningful-documentation World point of normalised foot coordinates `[a, u, y mm]`, left frame.
     */
    at: (a: number, u: number, y: number) => AutoMovieVector3Tuple;

    /** The foot's lateral direction, left frame. */
    lateral: AutoMovieVector3Tuple;
  }
}
