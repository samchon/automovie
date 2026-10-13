/**
 * The lanes of the GPU queue, highest priority first.
 *
 * @evidence contracts/common.md#principled-implementation The ui, cli and bulk alternatives name the existing GPU queue's interactive, command and background scheduling roles.
 * @evidence contracts/common.md#clear-and-simple-design One closed lane set is shared by queue admission and status counts.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Lane names encode scheduling roles rather than particular documents or viewers.
 * @evidence contracts/common.md#meaningful-documentation The declaration lists scheduling priority from interactive work to background warming.
 *
 * @evidence requirements/operations-and-recovery/resource-budgets-and-backpressure.md#operations-priority-fairness The ui, cli and bulk alternatives name the existing GPU queue's interactive, command and background scheduling roles.
 * @evidence specifications/execution-and-recovery/resource-budgets-and-backpressure.md#execution-priority-fairness Lane names encode scheduling roles rather than particular documents or viewers.
 */
export type HumanViewerLane = "ui" | "cli" | "bulk";
