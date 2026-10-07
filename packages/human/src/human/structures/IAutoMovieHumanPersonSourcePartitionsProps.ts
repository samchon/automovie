import type { IAutoMovieHumanPersonSourceSurface } from "./IAutoMovieHumanPersonSourceSurface";

/**
 * The two complementary skin surfaces whose source partitions are admitted
 * together: the face's and the body's.
 *
 * @evidence contracts/common.md#principled-implementation A source partition is valid only as one half of a compatible pair, so both halves are read together.
 * @evidence contracts/common.md#clear-and-simple-design Two members.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Both surfaces are the bases' own; neither is substituted.
 * @evidence contracts/common.md#meaningful-documentation States both members.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The carrier names two existing skins and defines no part.
 * @evidenceExclude contracts/modeling.md#parameter-channels Not a shaping channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The carrier emits no geometry.
 * @evidenceExclude contracts/modeling.md#spatial-conventions The carrier adds no coordinate; each surface states its own frame.
 * @evidence contracts/modeling.md#shared-boundaries Face and body skins are the two sides of one shared source boundary.
 * @evidenceExclude contracts/modeling.md#rendered-observation Internal source lineage that is not observed directly.
 * @evidenceExclude contracts/anatomy.md#anatomical-source Carries no anatomical value.
 * @evidenceExclude contracts/anatomy.md#permitted-range Admits numerical lineage, not a biological range.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Compiled or derived lineage, not a caller's shaping input.
 * @author Samchon
 */
export interface IAutoMovieHumanPersonSourcePartitionsProps {
  /** The face's skin surface. */
  face: IAutoMovieHumanPersonSourceSurface;

  /** The body's skin surface. */
  body: IAutoMovieHumanPersonSourceSurface;
}
