import type { IAutoMovieHumanBodyBasis } from "./IAutoMovieHumanBodyBasis";
import type { IAutoMovieHumanBodyUnderwear } from "./IAutoMovieHumanBodyUnderwear";
import type { IAutoMovieHumanBodyUnderwearRest } from "./IAutoMovieHumanBodyUnderwearRest";

/**
 * What the underwear coverage field is built from: the rule table, the style,
 * the basis's named skin points and the body at rest.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanBodyUnderwearCoverageProps {
  /** The rule table. */
  table: IAutoMovieHumanBodyUnderwear.ITable;

  /** The style the document wears. */
  style: IAutoMovieHumanBodyUnderwear["style"];

  /** The basis whose named skin points the rules name. */
  basis: Pick<IAutoMovieHumanBodyBasis, "id" | "skinLandmarks">;

  /** The document's body at rest. */
  rest: IAutoMovieHumanBodyUnderwearRest;
}
