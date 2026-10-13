/**
 * The lanes of the GPU queue, highest priority first.
 *
 * @evidence contracts/common.md#principled-implementation The ui, cli and bulk alternatives name the existing GPU queue's interactive, command and background scheduling roles.
 * @evidence contracts/common.md#clear-and-simple-design One closed lane set is shared by queue admission and status counts.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Lane names encode scheduling roles rather than particular documents or viewers.
 * @evidence contracts/common.md#meaningful-documentation The declaration lists scheduling priority from interactive work to background warming.
 */
export type HumanViewerLane = "ui" | "cli" | "bulk";
