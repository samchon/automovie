/**
 * Authored whole-film clock shared by the viewer and encoder, in seconds.
 *
 * @evidence contracts/development/implementation.md#principled-implementation The value is the authored film length in seconds; render admission requires it to give a whole frame count at the configured rate.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One constant serves the Viewer clock and render.config.ts.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The value comes from the commissioned duration, not from a check it was adjusted to pass.
 * @evidence contracts/development/common.md#meaningful-documentation The comment names the unit and the two consumers.
 */
export const durationSeconds: number = 15;
