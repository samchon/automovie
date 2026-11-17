/**
 * One horizontal section of the trunk's column, canonical left half: the
 * measures the guides and sectors read, at one height, in calibration
 * millimetres in the body frame (forward +X, up +Y, left +Z).
 *
 * The front and the back quadrant each lie on `zeta^n + xi^n = 1` in
 * normalised coordinates `zeta = z / width` and `xi = (x - middle) / depth`,
 * with the section's squareness `n` per quadrant.
 *
 *
 * @evidence contracts/development/common.md#meaningful-documentation One horizontal section of the trunk's column, canonical left half: the measures the guides and sectors read, at one height, in calibration millimetres in the body frame (forward +X, up +Y, left +Z).
 * @evidence contracts/development/design.md#principled-representation `y`: Height, mm. `width`: Half width at the widest point. `middle`: Forward place of the widest point.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Returned by AutoMovieHumanShoulderGirdle.section. Also types AutoMovieHumanShoulderGirdle.s, AutoMovieHumanShoulderRing.s.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts `posterior`: Lateral share where the posterior axillary guide stands; absent, the guide's own constant.
 */
export interface IAutoMovieHumanTrunkSection {
  /** Height, mm. */
  y: number;

  /** Half width at the widest point. */
  width: number;

  /** Forward place of the widest point. */
  middle: number;

  /** Forward place of the front midline. */
  front: number;

  /** Forward place of the back midline. */
  back: number;

  /** Squareness of the front quadrant. */
  squareFront: number;

  /** Squareness of the back quadrant. */
  squareBack: number;

  /** Lateral share of the half width where the anterior axillary guide stands. */
  anterior: number;

  /** Lateral share where the posterior axillary guide stands; absent, the guide's own constant. */
  posterior?: number;

  /**
   * The front quadrant's displacement toward the back at a lateral place
   * (the inguinal fold), mm: the value and its first and second derivatives
   * in z.
   *
   * @evidence contracts/development/common.md#meaningful-documentation The front quadrant's displacement toward the back at a lateral place (the inguinal fold), mm: the value and its first and second derivatives in z.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This foldFront signature specifies the documented callback contract without an implementation body; AutoMovieHumanTrunkColumn and its section/fold builders and its supplied callbacks own the numerical method and its premises.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure The callable member exposes foldFront at the containing contract boundary; decomposition of its implementation remains with AutoMovieHumanTrunkColumn and its section/fold builders.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No constants, branches or fallback computation occur in this signature; the actual foldFront provider is responsible for satisfying the documented semantics.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This signature chooses no algorithm or allocation strategy; the runtime callback used or returned by AutoMovieHumanTrunkColumn and its section/fold builders determines the work per foldFront call.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The type itself coordinates no calls or caches; AutoMovieHumanTrunkColumn and its section/fold builders's runtime provider owns reuse and must preserve the documented source identity and effects.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no state or resources; the foldFront provider and the caller retaining its containing record own the callback and its captured dependencies.
   */
  foldFront: (z: number) => [number, number, number];

  /**
   * The back quadrant's displacement toward the front at a lateral place
   * (the gluteal cleft), mm, with its first and second derivatives in z.
   *
   * @evidence contracts/development/common.md#meaningful-documentation The back quadrant's displacement toward the front at a lateral place (the gluteal cleft), mm, with its first and second derivatives in z.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This foldBack signature specifies the documented callback contract without an implementation body; AutoMovieHumanTrunkColumn and its section/fold builders and its supplied callbacks own the numerical method and its premises.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure The callable member exposes foldBack at the containing contract boundary; decomposition of its implementation remains with AutoMovieHumanTrunkColumn and its section/fold builders.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No constants, branches or fallback computation occur in this signature; the actual foldBack provider is responsible for satisfying the documented semantics.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This signature chooses no algorithm or allocation strategy; the runtime callback used or returned by AutoMovieHumanTrunkColumn and its section/fold builders determines the work per foldBack call.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The type itself coordinates no calls or caches; AutoMovieHumanTrunkColumn and its section/fold builders's runtime provider owns reuse and must preserve the documented source identity and effects.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no state or resources; the foldBack provider and the caller retaining its containing record own the callback and its captured dependencies.
   */
  foldBack: (z: number) => [number, number, number];
}
