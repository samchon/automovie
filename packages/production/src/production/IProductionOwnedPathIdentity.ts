

/**
 * One ancestor pathname paired with its observed directory dev/ino token.
 *
 * @evidence contracts/common.md#principled-implementation The owned reader compares these captured expected tokens with fresh directory observations around the byte read.
 * @evidence contracts/common.md#clear-and-simple-design Couples one ancestor address with its initial token so the owned reader can reacquire and compare that same directory around a byte read.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Type shape alone certifies neither native currentness nor successful cleanup; actual consumer predicates and host premises remain required.
 * @evidence contracts/common.md#meaningful-documentation Members identify the absolute native ancestor path and its initial decimal device/inode token; neither field independently proves current ownership or content equality.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The declaration executes no traversal, parsing or host mutation; its producer/consumer owns those costs.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The shape introduces no completed-result cache or cross-attempt identity reuse.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The call retains D path/token records for depth D and releases them after return/refusal.
 * @author Samchon
 */
export interface IProductionOwnedPathIdentity {
    /** Absolute ancestor path observed without following its final link. */
    file: string;

    /** Decimal device/inode pair captured from the initial directory stat. */
    identity: string;
}
