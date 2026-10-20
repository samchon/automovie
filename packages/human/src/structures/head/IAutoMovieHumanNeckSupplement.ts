/** Unloaded neck section dimensions. */
export interface IAutoMovieHumanNeckSupplement {
  /** Convex tape perimeter of the simple neck cut, mm; the jaw outline is not this boundary. */
  circumferenceAtMidTubeMm: number;

  /** Fore-aft depth divided by transverse breadth at the neck cut; dimensionless. */
  depthToBreadthRatio: number;

  /** Tape perimeter at the upper neck end, mm; its ratio to the mid-cut controls the longitudinal change. */
  upperCircumferenceMm: number;
}
