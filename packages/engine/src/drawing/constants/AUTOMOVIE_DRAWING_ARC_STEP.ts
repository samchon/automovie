/**
 * Radians of arc each drafted chord spans.
 *
 * Vector drafting has no curves, only chords, so the only honest choice is a
 * fixed one: a constant density means the same arc yields the same chords on
 * every machine and every run, and a drawing's digest stays a property of the
 * design rather than of how large the arc happened to be.
 */
export const AUTOMOVIE_DRAWING_ARC_STEP = Math.PI / 16;
