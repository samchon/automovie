/**
 * Authored whole-film clock shared by the viewer and encoder, in seconds.
 *
 * Render admission requires a positive whole frame count at the configured rate.
 * Change this value with the complete performance and requested delivery duration.
 */
export const durationSeconds: number = 60;
