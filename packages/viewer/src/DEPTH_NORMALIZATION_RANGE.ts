

/**
 * Metric range (meters) the depth pass normalizes onto (#1167). Depth grays are
 * LINEAR in camera-space distance over `[0, range]` (white at the lens, black
 * at `range` and beyond) and deliberately decoupled from the camera's near/far
 * clip planes, so the same world depth maps to the same gray across shots,
 * cuts, and chunks (per-camera clip planes vary; this range does not).
 */
export const DEPTH_NORMALIZATION_RANGE = 20;
