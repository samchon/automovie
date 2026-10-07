/**
 * The recorded facts of one subject used by the conversion: the age read from
 * the subject's source and whether that age is approximate.
 *
 * @author Samchon
 */
export interface IHumanSourceSubjectFacts {
  /** Age in years, or null when the source records none. */
  ageYears?: number | null;

  /** Whether the recorded age is approximate. */
  ageApproximate?: boolean;
}
