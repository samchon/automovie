/** How hard each constraint family pulls, each in `[0, 1]`. */
export interface IAutoMovieSoftStiffness {
  /** Row and column neighbours: resists stretching. */
  structural: number;

  /** Diagonal neighbours: resists shearing, which is what makes cloth drape. */
  shear: number;

  /** Second neighbours along a row or column: resists folding too sharply. */
  bend: number;
}
