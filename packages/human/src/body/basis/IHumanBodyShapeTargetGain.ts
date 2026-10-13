/**
 * One planned row-target application inside `applyHumanBodyShapeRows`.
 *
 * The planner records every active channel endpoint and corrective first, in application order, so an unavailable source target refuses before the first buffer write. The gain is already non-negative: a negative channel weight selects the negative endpoint and contributes its absolute value.
 *
 * @evidence contracts/common.md#principled-implementation Target identity and nonnegative gain preserve the planned endpoint/corrective application order before any source buffer write.
 * @evidence contracts/common.md#clear-and-simple-design A two-field plan entry separates missing-target admission from the subsequent row-offset accumulation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A negative channel selects its negative endpoint and absolute gain rather than reversing an unrelated positive source target.
 * @evidence contracts/common.md#meaningful-documentation Members name endpoint/corrective rows and nonnegative multiplier meaning; prose explains pre-write refusal.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Shape-target plan typing performs no sparse row accumulation or availability scan.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A planned target/gain entry stores no completed shaped-buffer result across requests.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Plan metadata retains no offset buffer or active channel-application resource.
 * @author Samchon
 */
export interface IHumanBodyShapeTargetGain {
  /** Basis row-target name: a channel endpoint or a corrective target. */
  target: string;

  /** Non-negative multiplier applied to every offset of `target`. */
  gain: number;
}
