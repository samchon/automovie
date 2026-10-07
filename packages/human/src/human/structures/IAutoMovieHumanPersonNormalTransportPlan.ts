import type { IAutoMovieHumanPersonNormalBinding } from "./IAutoMovieHumanPersonNormalBinding";
import type { IAutoMovieHumanPersonNormalCell } from "./IAutoMovieHumanPersonNormalCell";

/**
 * Admitted fixed source normal transport: every fixed normal cell in parent
 * order, and per skin half (face, then body) one binding per vertex, undefined
 * for an unused vertex. Returned arrays are owned.
 *
 * @evidence contracts/common.md#principled-implementation Transport is fully described by its fixed cells and each used vertex's binding into them.
 * @evidence contracts/common.md#clear-and-simple-design Two members.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Cells and bindings are admitted from compiled records; unused vertices stay undefined rather than defaulted.
 * @evidence contracts/common.md#meaningful-documentation States both members, their order and ownership.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The plan defines no part.
 * @evidenceExclude contracts/modeling.md#parameter-channels Not a shaping channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The plan emits no geometry.
 * @evidenceExclude contracts/modeling.md#spatial-conventions Lineage records carry no frame or unit.
 * @evidence contracts/modeling.md#shared-boundaries Both halves bind into one shared list of fixed cells.
 * @evidenceExclude contracts/modeling.md#rendered-observation Internal source lineage that is not observed directly.
 * @evidenceExclude contracts/anatomy.md#anatomical-source Carries no anatomical value.
 * @evidenceExclude contracts/anatomy.md#permitted-range Admits numerical lineage, not a biological range.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Compiled or derived lineage, not a caller's shaping input.
 * @author Samchon
 */
export interface IAutoMovieHumanPersonNormalTransportPlan {
  /** Every fixed normal cell, in parent order. */
  cells: IAutoMovieHumanPersonNormalCell[];

  /** Per half, face then body, each vertex's binding or undefined when unused. */
  bindings: (undefined | IAutoMovieHumanPersonNormalBinding)[][];
}
