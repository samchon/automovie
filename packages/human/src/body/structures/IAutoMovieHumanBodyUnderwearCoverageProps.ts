import type { IAutoMovieHumanBodyBasis } from "./IAutoMovieHumanBodyBasis";
import type { IAutoMovieHumanBodyUnderwear } from "./IAutoMovieHumanBodyUnderwear";
import type { IAutoMovieHumanBodyUnderwearTable } from "./IAutoMovieHumanBodyUnderwearTable";
import type { IAutoMovieHumanBodyUnderwearRest } from "./IAutoMovieHumanBodyUnderwearRest";

/**
 * What the underwear coverage field is built from: the rule table, the style,
 * the basis's named skin points and the body at rest.
 *
 * @evidence contracts/common.md#principled-implementation A coverage table, closed style, named basis points and shaped rest geometry define a field before pose.
 * @evidence contracts/common.md#clear-and-simple-design The field receives only basis identity and skin landmarks rather than the complete basis.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The rest geometry is supplied by the current document, without borrowing a fixture's covered vertex set.
 * @evidence contracts/common.md#meaningful-documentation Members distinguish the table, style, restricted basis view and rest authority.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The garment coverage inputs declares data and signatures without implementing runtime algorithms.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The garment coverage inputs declaration shares no computations across consumers.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The garment coverage inputs type has no runtime acquisition, retention or release operation.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanBodyUnderwearCoverageProps {
  /** The rule table. */
  table: IAutoMovieHumanBodyUnderwearTable;

  /** The style the document wears. */
  style: IAutoMovieHumanBodyUnderwear["style"];

  /** The basis whose named skin points the rules name. */
  basis: Pick<IAutoMovieHumanBodyBasis, "id" | "skinLandmarks">;

  /** The document's body at rest. */
  rest: IAutoMovieHumanBodyUnderwearRest;
}
