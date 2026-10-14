

/**
 * Default 20-metre camera-space depth range for clamp(1 - viewZ / range, 0, 1): white at zero and black at the range or beyond. The shader's normalization is independent of near/far clips, while changing camera pose changes viewZ for the same world point; this constant does not certify identical raster bytes across shots or renderers.
 */
export const DEPTH_NORMALIZATION_RANGE = 20;
