/** Three complete rows in the transformed scalar coordinate. */
export interface IAutoMovieLoftSectionBoundaryControls {
  /** Eight log-extents and logit-shoulders. */
  value: number[];

  /** Their first physical station derivatives. */
  slope: number[];

  /** Their second physical station derivatives. */
  curvature: number[];
}
