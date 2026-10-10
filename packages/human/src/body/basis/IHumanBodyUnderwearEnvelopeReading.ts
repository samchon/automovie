/** One reading of the shared union-of-qualified-balls envelope. */
export interface IHumanBodyUnderwearEnvelopeReading {
  /** Distance to the nearest qualified centre, metres. */
  distance: number;
  /** Owned nearest-centre coordinates, metres in the posed frame. */
  centre: number[];
  /** Unit distance gradient; zero only at a centre itself. */
  gradient: number[];
}
