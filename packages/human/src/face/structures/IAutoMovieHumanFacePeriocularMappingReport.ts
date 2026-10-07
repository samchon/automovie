import type { IHumanFacePeriocularMappingReading } from "../anatomy/eye/structures/IHumanFacePeriocularMappingReading";

/** Diagnostic mapping of one actual constructed tissue, separate from unchanged physical admission.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanFacePeriocularMappingReport {
  /** Actual generated tissue identity. */
  subject: string;

  /** Actual source, pre-offset and offset observations. */
  reading: IHumanFacePeriocularMappingReading;
}
