/**
 * Authored whole-film clock shared by the viewer and encoder, in seconds.
 *
 * @evidence contracts/common.md#implementation-and-ownership The production owns this positive duration; render admission requires a whole frame count at the configured rate.
 * @evidence contracts/common.md#authoring-interface Change this value with the complete authored performance and requested delivery duration.
 */
export const durationSeconds: number = 15;
