/**
 * A source bone retains its relative rest placement under its parent's motion.
 *
 * @evidence contracts/common.md#principled-implementation The fixed discriminator represents parent-carried relative rest placement and supplies no independent authored motion coordinate.
 * @evidence contracts/common.md#clear-and-simple-design A single-field record makes unsupported motion explicit without introducing empty axis arrays or a redundant identity transform.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Fixed carry cannot absorb authored requests unless another declared source driver actually consumes them.
 * @evidence contracts/common.md#meaningful-documentation The declaration and kind comment explain parent carry and the conditions under which another driver may own authored motion.
 * @evidenceExclude contracts/performance.md#efficient-algorithms A fixed-joint marker has no numeric algorithm or input-size-dependent traversal.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The fixed variant owns no repeated coordinate request or memoized parent transform.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources This literal-only joint record allocates no joint solver state or task.
 * @author Samchon
 */
export interface IAutoMovieHumanBodySourceFixedJoint {
  /** Parent carry only; authored motion on this bone is unsupported unless a declared driver consumes it elsewhere. */
  kind: "fixed";
}
