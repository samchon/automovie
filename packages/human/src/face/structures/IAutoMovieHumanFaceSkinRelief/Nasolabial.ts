import type { IAutoMovieHumanFaceNasolabialRelief } from "../IAutoMovieHumanFaceNasolabialRelief";

/** Anatomical sides in the basis frame (+X left), each independently omitted.
 *
 * @author Samchon
 */
export interface Nasolabial {
  /** Relief on the anatomical left. */
  left?: IAutoMovieHumanFaceNasolabialRelief;

  /** Relief on the anatomical right. */
  right?: IAutoMovieHumanFaceNasolabialRelief;
}
