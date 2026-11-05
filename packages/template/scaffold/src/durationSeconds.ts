/**
 * Authored whole-film clock shared by the viewer and encoder, in seconds.
 *
 * The production owns this positive duration; render admission requires a whole
 * frame count at the configured rate. Change this value with the complete
 * authored performance and requested delivery duration.
 */
export const durationSeconds: number = 15;
