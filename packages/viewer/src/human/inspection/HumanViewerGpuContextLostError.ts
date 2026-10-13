/**
 * A display could not finish because its own WebGL context was lost. Native
 * context restoration can redraw the last completed model and clear this
 * display failure; a numerical or source refusal has no such recovery.
 */
export class HumanViewerGpuContextLostError extends Error {}
