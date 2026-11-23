/**
 * An observed closed loop whose source preimage is followed toward increasing
 * section coordinates. This identifies a geometric source component, not an
 * anatomical label or a permission to cap it.
 */
export interface IAutoMovieRecoveryTerminalSeed {
  /**
   * A plane explicitly present in coordinatesMm, in signed physical
   * millimetres.
   */
  coordinateMm: number;

  /** Zero-based closed-loop ordinal in that plane's actual source observation. */
  loopIndex: number;
}
