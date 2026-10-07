import type { IAutoMovieHumanBasisNormalTransport } from "../../common/basis/IAutoMovieHumanBasisNormalTransport";

/**
 * One skin half as normal-transport admission reads it: its emitted triangle
 * vertex indices and its compiled fixed-source normal transport, if any.
 *
 * @evidence contracts/common.md#principled-implementation Admission needs exactly the emitted incidence and the compiled transport record of each half.
 * @evidence contracts/common.md#clear-and-simple-design Two members.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The transport is the basis's own compiled record; absence is preserved, never synthesized.
 * @evidence contracts/common.md#meaningful-documentation States both members and what absence means.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The half is an existing skin; this view defines no part.
 * @evidenceExclude contracts/modeling.md#parameter-channels Not a shaping channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The view emits no geometry.
 * @evidenceExclude contracts/modeling.md#spatial-conventions Indices and lineage records carry no frame or unit.
 * @evidence contracts/modeling.md#shared-boundaries Face and body halves are admitted together over one shared subdivision tree.
 * @evidenceExclude contracts/modeling.md#rendered-observation Internal source lineage that is not observed directly.
 * @evidenceExclude contracts/anatomy.md#anatomical-source Carries no anatomical value.
 * @evidenceExclude contracts/anatomy.md#permitted-range Admits numerical lineage, not a biological range.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Compiled or derived lineage, not a caller's shaping input.
 * @author Samchon
 */
export interface IAutoMovieHumanPersonNormalTransportHalf {
  /** Flat emitted triangle vertex index triples. */
  indices: readonly number[];

  /** Compiled fixed-source normal transport, or none. */
  transport?: IAutoMovieHumanBasisNormalTransport;
}
