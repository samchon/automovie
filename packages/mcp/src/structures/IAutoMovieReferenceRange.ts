import type { IAutoMovieReferencePosition } from "./IAutoMovieReferencePosition";


/**
 * One inclusive-start, exclusive-end interval of the original source.
 *
 * @evidence contracts/common.md#principled-implementation Inclusive-start and exclusive-end endpoints represent original-source spans, including empty spans and EOF.
 * @evidence contracts/common.md#clear-and-simple-design The same interval type serves headings, selection and piece maps.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No normalized edition position substitutes for canonical source coordinates.
 * @evidence contracts/common.md#meaningful-documentation Members document endpoint inclusion and empty-span meaning.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This structural declaration chooses no runtime algorithm; its producer owns traversal and parsing costs.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The type shares a representation without coordinating completed or in-flight operations.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Caller-held values retain only their documented fields; implementations own handles and source-lifetime bounds.
 *
 * @author Samchon
 */
export interface IAutoMovieReferenceRange {

  /** First included source position; equal endpoints describe an empty span. */
  start: IAutoMovieReferencePosition;

  /** First excluded source position, including the position immediately at EOF. */
  end: IAutoMovieReferencePosition;
}
