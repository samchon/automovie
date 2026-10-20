/** One authored value and its constraint pin; no solver is supplied. */
export interface IAutoMovieHumanBodyControl {
  /** Length in mm or unitless shape coordinate, as specified by the named field. */
  value: number | null;

  /** Whether the known authored value is fixed; unknown values cannot pin. */
  pinned: boolean;
}
