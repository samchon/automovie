/**
 * A request refused because its GPU waiting lane is full; the server answers
 * 503 with the queue owner's reason. The active request keeps its GPU slot.
 *
 * @evidence contracts/common.md#principled-implementation The queue's declared waiting capacity determines refusal; this identity does not interrupt a running capture.
 * @evidence contracts/common.md#clear-and-simple-design A distinct Error subtype carries queue backpressure to the existing HTTP classifier.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Carries the queue owner's refusal without dropping existing work or choosing a subject-specific capacity.
 * @evidence contracts/common.md#meaningful-documentation States waiting-lane capacity, HTTP refusal and continued active-request ownership.
 * @evidence requirements/rendering/headless-and-platform-determinism.md#rendering-process-isolation The queue's declared waiting capacity determines refusal; this identity does not interrupt a running capture.
 * @evidence specifications/editorial-render-and-delivery/render-schedule-state-and-headless.md#spec-render-headless-platform A distinct Error subtype carries queue backpressure to the existing HTTP classifier.
 */
export class HumanViewerQueueFullError extends Error {}
