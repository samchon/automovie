import type { IAutoMovieVector3 } from "@automovie/interface";

/**
 * The document's body at rest (its shape without its pose) that the
 * underwear's regions are read on.
 *
 * @evidence contracts/common.md#principled-implementation Per-surface XYZ arrays and named joint points describe the same shaped body before pose.
 * @evidence contracts/common.md#clear-and-simple-design The coverage owner receives rest geometry separately from performed skin.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Coverage follows the document's shape and no alternate raw garment asset is supplied.
 * @evidence contracts/common.md#meaningful-documentation Members give metres, basis surface order and landmark identity.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The garment rest geometry contract declares data and signatures without implementing runtime algorithms.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The garment rest geometry contract declaration shares no computations across consumers.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The garment rest geometry contract type has no runtime acquisition, retention or release operation.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanBodyUnderwearRest {
  /** Rest positions per basis surface, flat XYZ metres. */
  surfaces: number[][];

  /** Shaped joint landmarks by id. */
  landmarks: Record<string, IAutoMovieVector3>;
}
