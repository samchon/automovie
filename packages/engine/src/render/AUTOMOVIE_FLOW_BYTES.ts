/**
 * Device bytes of one vertex's free-surface flow vector: two 32-bit floats.
 *
 * A drawn water surface carries this attribute beside position, normal and
 * texture coordinate, and a ripple shader scrolls along it. Leaving it out
 * would understate the one buffer a pond has that a wall does not.
 */
export const AUTOMOVIE_FLOW_BYTES = 8;
