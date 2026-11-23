/** What a fault is measured on: one clinical axis, or the combined swing. */
export namespace IAutoMovieScanJointRom {
  /**
   * What a fault is measured on: one clinical axis, or the combined swing.
   *
   * A closed union of the three clinical axes and their combined swing, one
   * literal for each reported check. The gate maps it to a message and audits
   * to a fault location; it remains exhaustively checkable rather than string.
   */
  export type Part = "flexion" | "abduction" | "twist" | "swing";
}
