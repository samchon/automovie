import type { IAutoMovieHumanFacePeriocularLashRoots } from "./IAutoMovieHumanFacePeriocularLashRoots";

/**
 * One eye's upper and lower lid margins on the skin surface.
 *
 * Each margin is an ordered row of skin vertices from the medial to the
 * lateral end. Positions are read on the final shaped and posed Float32 skin,
 * so the margins follow every edit and expression.
 *
 * @evidence contracts/common.md#principled-implementation Ordered vertex rows on the shared skin define the margin as surface identity, so it follows shape and pose exactly.
 * @evidence contracts/common.md#clear-and-simple-design Three named members.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Roles come from the source producer's registration, never from asset names.
 * @evidence contracts/common.md#meaningful-documentation States what each member identifies and who supplies it.
 * @evidence contracts/modeling.md#spatial-conventions Rows index the named skin surface; order runs medial to lateral.
 * @evidenceExclude contracts/modeling.md#parameter-channels Registers identity; defines no channel.
 * @evidence contracts/modeling.md#part-identity-and-grouping Identifies the upper and lower margin of one eye.
 * @evidenceExclude contracts/modeling.md#emitted-geometry Emits no geometry.
 * @evidence contracts/modeling.md#shared-boundaries The margin is the boundary the globe contact, the lashes and both lids share.
 * @evidenceExclude contracts/modeling.md#rendered-observation The face builder's consumers own observation.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The source manifest records the CC0 data or mesh reading each entry comes from.
 * @evidenceExclude contracts/anatomy.md#permitted-range Registers identity; bounds no value.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Producer registration, not an authored control.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanFacePeriocularMargins {
  /** ID of the skin surface that carries the margins. */
  surface: string;

  /** Upper margin vertex indices, ordered medial to lateral. */
  upper: number[];

  /** Lower margin vertex indices, ordered medial to lateral. */
  lower: number[];

  /**
   * Optional anterior root rows on this surface. Omission leaves numerical
   * lashes unavailable; the posterior margin is not substituted for a root.
   */
  lashRoots?: IAutoMovieHumanFacePeriocularLashRoots;
}
