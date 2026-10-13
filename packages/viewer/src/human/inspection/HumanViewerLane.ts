/**
 * The lanes of the GPU queue, highest base priority first.
 *
 * @evidence contracts/common.md#principled-implementation The closed ui/cli/bulk alternatives are the priorities createHumanViewerQueue selects; patience temporarily advances waiting CLI work and quiet time gates bulk starts.
 * @evidence contracts/common.md#clear-and-simple-design One lane identity is shared by scheduling input and queue status; queue capacity and fairness remain in the scheduler rather than in caller-defined numeric priorities.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No label, document or fixture changes priority; the scheduler applies the same three-lane rules and never preempts an active callback merely because UI work arrives.
 * @evidence contracts/common.md#meaningful-documentation Names the three GPU waiting lanes in base priority order; this union alone promises neither starvation freedom for bulk work nor physical cancellation.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The literal union executes no scheduling; the queue's bounded arrays, selection and cancellation scans own processing cost.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Lane identity does not merge requests with different effects or cancellation authority; createHumanViewerQueue keeps their task records separate.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Three string alternatives acquire no GPU slot or listener; per-lane waiting limits and active-task retention are enforced by the queue owner.
 */
export type HumanViewerLane = "ui" | "cli" | "bulk";
