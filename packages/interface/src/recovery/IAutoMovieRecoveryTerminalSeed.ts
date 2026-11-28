/**
 * Address of a closed source loop chosen for terminal observation toward
 * increasing physical coordinates.
 */
export interface IAutoMovieRecoveryTerminalSeed {
  /** Original requested signed section coordinate in millimetres. */
  coordinateMm: number;

  /** Zero-based position of the selected closed loop at that station. */
  loopIndex: number;
}
