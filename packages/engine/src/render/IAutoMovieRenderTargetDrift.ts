/** Why a report no longer describes the target in front of a consumer.
 *
 * @evidence contracts/development/design.md#principled-representation Represent one exact target-field difference as a field path and reported/current string values; compareAutoMovieRenderTarget derives these rows from sealed target records.
 * @evidence contracts/development/design.md#minimal-and-owned-surface A small diagnostic row is independent of report status formatting and does not retain entire target snapshots.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The field is an actual renderer/setting/asset difference, not an expected fixture label or repaired current value.
 * @evidence contracts/development/common.md#meaningful-documentation Members distinguish the reported measurement target from the current target; strings are diagnostic spellings, not an authority to reseal either record.
 */
export interface IAutoMovieRenderTargetDrift {
  /** What changed: the renderer, one setting, or one asset's bytes. */
  field: string;

  /** The value the report was measured against. */
  reported: string;

  /** The value the current target carries. */
  current: string;
}
