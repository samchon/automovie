

/** Data and callback contracts shared by the ScanJointRom operations. */
export namespace IAutoMovieScanJointRom {
  /**
     * What a fault is measured on: one clinical axis, or the combined swing.
     *
     * @evidence contracts/development/common.md#meaningful-documentation States the two kinds of part a fault can name.
     * @evidence contracts/development/design.md#principled-representation A closed union of the three clinical axis names a joint pose carries and `swing`, the coupling of flexion and abduction that belongs to no single axis.
     * @evidence contracts/development/design.md#minimal-and-owned-surface Four literals, one for each check the scan runs; the gate maps each to its message and the ranking ignores it.
     * @evidence contracts/development/design.md#prohibited-design-shortcuts String literals rather than `string`, so a caller's switch over the parts is checked for exhaustiveness.
     */
    export type Part = "flexion" | "abduction" | "twist" | "swing";
}
