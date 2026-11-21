/**
 * Largest admitted deviation of a unit quaternion's length from 1, and of a
 * displayed matrix basis from a rigid one, when placed inspection reads native
 * frames.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the two uses of the tolerance and its unitless scale.
 */
export const AUTOMOVIE_PLACED_FRAME_TOLERANCE: number = 1e-6;
