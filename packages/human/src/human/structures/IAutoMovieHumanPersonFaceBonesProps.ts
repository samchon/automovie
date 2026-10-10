import type { IAutoMovieHumanFaceBasis } from "../../face/structures/IAutoMovieHumanFaceBasis";
import type { IAutoMovieHumanFaceBasisDocument } from "../../face/structures/IAutoMovieHumanFaceBasisDocument";
import type { IAutoMovieHumanPersonHeadTransform } from "./IAutoMovieHumanPersonHeadTransform";

/**
 * What resolving a person's jaw and eye bones reads: the face basis, the
 * face document's shape and expression, and the head transform that placed
 * the face on the body.
 *
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
