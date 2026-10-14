/**
 * The beat id a shot id names: the text after a leading `shot:`, or the whole
 * id when it has no such prefix.
 *
 * The interface defines a beat's computed shot as `shot.id = "shot:" + beat`,
 * and an unprefixed id comes from a hand-authored shot that is its own beat.
 * The caption plan and the pose-keypoint plan label their frames with it, so
 * the two sidecars name the same beat for the same frame.
 *
 * @evidence contracts/common.md#principled-implementation Removing the fixed prefix inverts the `"shot:" + beat` construction exactly, and any other id is returned whole because no prefix was added to it.
 * @evidence contracts/common.md#clear-and-simple-design Both sidecar planners map shots to beats through this one function instead of each spelling the prefix rule.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The prefix is the interface's shot-id contract, a defined convention rather than a special case, and no id is otherwise rewritten.
 * @evidence contracts/common.md#meaningful-documentation The doc states both mappings, the contract the prefix comes from, and which planners rely on it.
 * @evidenceExclude contracts/performance.md#efficient-algorithms One prefix test and slice of a short id choose no algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A prefix test per frame is cheaper than caching the mapping by shot id.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The beat id is a slice of the shot id handed back to the planner, and nothing is retained.
 */
export const shotBeat: (shotId: string) => string = (shotId: string): string =>
  shotId.startsWith("shot:") ? shotId.slice("shot:".length) : shotId;
