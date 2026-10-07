import type { IAutoMovieHumanFaceBasis } from "../../face/structures/IAutoMovieHumanFaceBasis";
import type { IAutoMovieHumanFaceBasisDocument } from "../../face/structures/IAutoMovieHumanFaceBasisDocument";
import type { IAutoMovieHumanPersonHeadTransform } from "./IAutoMovieHumanPersonHeadTransform";

/**
 * What resolving a person's jaw and eye bones reads: the face basis, the
 * face document's shape and expression, and the head transform that placed
 * the face on the body.
 *
 * @evidence contracts/common.md#principled-implementation The bones are read from the face's own articulation resolver and carried by the head transform; nothing else is needed.
 * @evidence contracts/common.md#clear-and-simple-design Three members.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Each member is its owner's value; motions are not restated here.
 * @evidence contracts/common.md#meaningful-documentation States each member.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The carrier defines no part.
 * @evidenceExclude contracts/modeling.md#parameter-channels The document's channels are the face owner's; the carrier defines none.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The carrier emits no geometry.
 * @evidenceExclude contracts/modeling.md#spatial-conventions The carrier adds no coordinate; the head transform states its frame.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The carrier builds no boundary.
 * @evidenceExclude contracts/modeling.md#rendered-observation Internal input that is not observed.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The face basis owns anatomical values.
 * @evidenceExclude contracts/anatomy.md#permitted-range Face document admission precedes this carrier.
 * @evidenceExclude contracts/anatomy.md#parametric-authority The face document is admitted by its owner; the carrier adds no input.
 * @author Samchon
 */
export interface IAutoMovieHumanPersonFaceBonesProps {
  /** The face basis. */
  basis: IAutoMovieHumanFaceBasis;

  /** The face document's shape and expression. */
  document: Pick<IAutoMovieHumanFaceBasisDocument, "shape" | "expression">;

  /** The head transform that placed the face on the body. */
  head: IAutoMovieHumanPersonHeadTransform;
}
