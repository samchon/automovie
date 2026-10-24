/** A construction path sampled by the same evaluation that emitted skin vertices. */
export interface IAutoMovieHumanConstructionPath {
  /** Owning skin chain, slash, then a stable named guide address. */
  id: string;

  /** Points in the calibration's registered millimetre frame. */
  points: [number, number, number][];

  /** Whether the final point connects back to the first. */
  closed: boolean;
}
