/**
 * One actual selected ANSUR II row and its outcome in the numerical census.
 * The public database's subject identifier preserves sample identity across
 * generations independently of BMI rounding or a viewer document name.
 *
 * @author Samchon
 */
export interface IAnsurCensusSubject {
  /** Sex-specific public database used to select the row. */
  sex: "female" | "male";

  /** Numeric subjectid column in that database. */
  subjectId: number;

  /** Whether the actual simple-tier solve produced a document. */
  outcome: "built" | "refused";
}
