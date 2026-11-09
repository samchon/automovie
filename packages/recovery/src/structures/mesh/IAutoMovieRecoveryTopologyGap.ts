/**
 * Physical slicing interval for which no supported surface topology is published.
 *
 * @evidence contracts/development/design.md#principled-representation The two measured section coordinates delimit the slab that reconstruction must leave open.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One interval record keeps its physical limits beside the unresolved cause.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The interval supplies neither replacement geometry nor a topology repair.
 * @evidence contracts/development/common.md#meaningful-documentation Members document physical units, ownership and optional-state meaning.
 */
export interface IAutoMovieRecoveryTopologyGap {
  /** Lower section coordinate along the slicing axis, millimetres. */
  beforeMm: number;

  /** Upper section coordinate along the slicing axis, millimetres. */
  afterMm: number;

  /** Why reconstruction cannot consume this interval as supported topology. */
  reason: string;
}
