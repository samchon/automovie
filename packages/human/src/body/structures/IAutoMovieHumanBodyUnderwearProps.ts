import type { IAutoMovieHumanBodyUnderwear } from "./IAutoMovieHumanBodyUnderwear";
import type { IAutoMovieHumanBodyUnderwearRest } from "./IAutoMovieHumanBodyUnderwearRest";

/**
 * One admitted garment choice and the body's shaped rest coverage authority.
 *
 * @evidence contracts/common.md#principled-implementation An admitted garment choice and shaped rest authority supply one coverage evaluation.
 * @evidence contracts/common.md#clear-and-simple-design The small input record binds clothing choice to the rest shape it covers.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The document's own rest surface remains authoritative rather than a separate clothing template mesh.
 * @evidence contracts/common.md#meaningful-documentation Members document closed style, optional fabric colour and source-aligned rest positions.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The garment evaluation inputs declares data and signatures without implementing runtime algorithms.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The garment evaluation inputs declaration shares no computations across consumers.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The garment evaluation inputs type has no runtime acquisition, retention or release operation.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanBodyUnderwearProps {
  /** Closed style and optional linear fabric colour. */
  underwear: IAutoMovieHumanBodyUnderwear;

  /** Source-aligned shaped rest positions and landmarks. */
  rest: IAutoMovieHumanBodyUnderwearRest;
}
