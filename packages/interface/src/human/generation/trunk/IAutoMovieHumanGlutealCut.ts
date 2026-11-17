/**
 * Horizontal original-source cut points with physical station and polar-phase provenance.
 *
 * The interface package owns these declarations; AutoMovieHumanGlutealCut in Human supplies their runtime values.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Horizontal original-source cut points with physical station and polar-phase provenance. Member comments specify the individual units, frames and optional-value meanings.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The namespace groups only IPoint, CreateResult declarations; it adds no runtime state, fixture dispatch or alternate implementation. Each member retains its own concrete data or callable representation.
 * @evidence contracts/development/design.md#principled-representation IPoint, CreateResult separate the declared inputs, results and related quantities. Their numeric domains and geometric consistency remain the Human producers' and engine operators' runtime responsibility; the namespace introduces no additional frame or clock.
 * @evidence contracts/development/design.md#minimal-and-owned-surface AutoMovieHumanGlutealCut exchanges the named IPoint, CreateResult contracts with its Human callers. Interface owns these type declarations without importing that implementation.
 */
export namespace IAutoMovieHumanGlutealCut {
  /** One horizontal-cut point and the actual source chart that produced it.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation One horizontal-cut point and the actual source chart that produced it.
   * @evidence contracts/development/design.md#principled-representation `point`: World X/Z in calibration millimetres. `station`: Physical station of the identical original source, calibration mm. `phase`: Original local polar phase, radians.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Returned by AutoMovieHumanGlutealCut.records. Also types AutoMovieHumanGlutealCut.cut, AutoMovieHumanGlutealCut.points.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `point`, `station`, `phase`; callers supply the complete record.
   */
  export interface IPoint {
    /** World X/Z in calibration millimetres. */
    point: [number, number];
    /** Physical station of the identical original source, calibration mm. */
    station: number;
    /** Original local polar phase, radians. */
    phase: number;
  }

  /** Result of AutoMovieHumanGlutealCut.create. Preserve the existing point-only consumer without preparing another field or solving another cut.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation Preserve the existing point-only consumer without preparing another field or solving another cut.
   * @evidence contracts/development/design.md#principled-representation Preserve the existing point-only consumer without preparing another field or solving another cut. Alternatives are [number, number][]; string.
   * @evidence contracts/development/design.md#minimal-and-owned-surface IAutoMovieHumanGlutealCut.CreateResult is the canonical exchange used by AutoMovieHumanGlutealCut.create.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The representation is used by AutoMovieHumanGlutealCut.create for preserve the existing point-only consumer without preparing another field or solving another cut.
   */
  export type CreateResult = [number, number][] | string;
}
