/** One material directly used by the described subject. */
export interface IAutoMovieSubjectMaterial {
  /** Stable material id inside its model. */
  id: string;

  /** Human-readable compiled material name, or null when unnamed. */
  name: string | null;
}
