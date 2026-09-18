/**
 * One ordered transformation applied while converting external motion.
 *
 * @evidence requirements/external-inputs/conversion-receipts-and-determinism.md#external-conversion-receipt-mapping Requires every coordinate, unit, time, resample, and retarget operation to be recorded.
 * @evidence specifications/interchange-and-adoption/conversion-receipts-and-determinism.md#interchange-receipt-element-mapping Types one ordered activity in the transform ledger.
 * @author Samchon
 */
export interface IAutoMovieExternalMotionTransformActivity {
  /**
   * Closed motion conversion activity discriminator.
   *
   * @evidence requirements/external-inputs/conversion-receipts-and-determinism.md#external-conversion-receipt-mapping Distinguishes the exact transformation performed on source elements.
   * @evidence specifications/interchange-and-adoption/conversion-receipts-and-determinism.md#interchange-receipt-element-mapping Records normalization, retargeting, trimming, and channel conversion as explicit activities.
   */
  kind:
    | "basis-normalization"
    | "hierarchy-collapse"
    | "retarget"
    | "translation-scale"
    | "time-trim"
    | "channel-conversion"
    | "event-remap";
  /**
   * Stable source element identities consumed by this activity.
   *
   * @evidence requirements/external-inputs/conversion-receipts-and-determinism.md#external-conversion-receipt-mapping Requires source-to-result element correspondence to remain inspectable.
   * @evidence specifications/interchange-and-adoption/conversion-receipts-and-determinism.md#interchange-receipt-element-mapping Carries the source side of one transform-ledger relation.
   */
  source: string[];
  /**
   * Stable result element identities produced by this activity.
   *
   * @evidence requirements/external-inputs/conversion-receipts-and-determinism.md#external-conversion-receipt-mapping Requires result identities, splits, and merges to be recorded.
   * @evidence specifications/interchange-and-adoption/conversion-receipts-and-determinism.md#interchange-receipt-element-mapping Carries the result side of one transform-ledger relation.
   */
  target: string[];
  /**
   * Serializable parameters that fully characterize the activity.
   *
   * @evidence requirements/external-inputs/conversion-receipts-and-determinism.md#external-conversion-receipt-mapping Requires the applied coordinate, unit, time, and retarget facts in the receipt.
   * @evidence specifications/interchange-and-adoption/conversion-receipts-and-determinism.md#interchange-receipt-element-mapping Makes every transform replayable from ordered activity data.
   */
  parameters: Record<string, string | number | boolean | null>;
}
