/** One compiled material identity exposed by a subject description. */
export interface IAutoMovieSubjectMaterial {
  /** Stable material id inside its model. */
  id: string;

  /** Human-readable compiled material name, or null when unnamed. */
  name: string | null;
}
