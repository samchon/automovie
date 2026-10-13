import type { IAutoMovieHumanHeadReading } from "../../common/measure/IAutoMovieHumanHeadReading";
import type { IAutoMovieHumanPersonDocument } from "./IAutoMovieHumanPersonDocument";

/**
 * A solved head: the person with its head channels set, every head rule read on its skin at rest (the targets and the circumference check alike), and the departure from the standard head the solve chose.
 *
 * @evidence contracts/common.md#principled-implementation A solved document is accompanied by remeasured rest-skin rules and the solver's scaled channel norm; that convention omits displacement cross-effects and is not a certificate of a global minimum.
 * @evidence contracts/common.md#clear-and-simple-design The result groups authored output, observed readings and its departure metric so consumers can inspect secondary misses without rerunning the solve.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Readings are taken from the returned person's rest skin rather than copied from requested target values.
 * @evidence contracts/common.md#meaningful-documentation Comments define solved channel ownership, per-rule readings and the root-sum-square departure in metres of skin displacement.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The solved head document, measurements and departure result specify data and signatures; numerical producers own their traversal strategy.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Request equivalence is not implemented by the solved head document, measurements and departure result; consuming operations decide dependency-sensitive reuse.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The solved head document, measurements and departure result acquire no external resource or running task; their containing value owns ordinary data retention.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanPersonHeadSolution {
  /** The person with the solve's head channels set. */
  document: IAutoMovieHumanPersonDocument;

  /** Every head rule read on the solved person at rest, by rule name. */
  readings: Record<string, IAutoMovieHumanHeadReading>;

  /**
   * The solved channels' departure from the standard head: the root of the sum of squares of each channel's weight times its departure scale (`humanPersonHeadDeparture`), metres of skin displacement. Cross-effects between channels are not counted, and the reported norm does not prove global optimality.
   */
  departureMetres: number;
}
