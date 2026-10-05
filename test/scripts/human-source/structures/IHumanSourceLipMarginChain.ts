/**
 * The vermilion margin chains of the lips region and the record of how they
 * were joined: each chain runs along the jaw axis from one commissure join to
 * the other through its anchors.
 *
 * @author Samchon
 */
export interface IHumanSourceLipMarginChain {
  /** Upper chain vertices on the lips surface, negative join first. */
  upper: number[];

  /** Lower chain vertices on the lips surface, negative join first. */
  lower: number[];

  /** Chain record, written to the generation manifest. */
  record: Record<string, unknown>;
}
