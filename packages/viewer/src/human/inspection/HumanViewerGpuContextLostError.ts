/**
 * A display could not finish because its own WebGL context was lost. Native
 * context restoration can redraw the last completed model and clear this
 * display failure; a numerical or source refusal has no such recovery.
 *
 * @evidence contracts/common.md#principled-implementation The error identifies a native graphics failure independently of source or numerical errors, so restoration clears only the failure it actually repairs.
 * @evidence contracts/common.md#clear-and-simple-design One error identity connects the display completion check to its status recovery.
 * @evidence contracts/common.md#meaningful-documentation States the physical cause and the limit of context restoration.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Uses a distinct Error identity for native WebGL context loss; source or numerical refusals remain separate and cannot be cleared by graphics recovery.
 */
export class HumanViewerGpuContextLostError extends Error {}
