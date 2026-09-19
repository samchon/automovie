/**
 * Radians of arc each drafted chord spans.
 *
 * Vector drafting has no curves, only chords, so the only honest choice is a
 * fixed one: a constant density means the same arc yields the same chords on
 * every machine and every run, and a drawing's digest stays a property of the
 * design rather than of how large the arc happened to be.
 *
 * @evidence requirements/interior/deliverables-and-quantities.md#interior-drawing-views Fixes every bulged opening arc to the same angular sampling density so repeated drawing derivations yield identical chords.
 * @evidence specifications/interior-space/deliverables-and-validation.md#interior-space-drawing-schedule-quantity Sets the deterministic `PI / 16` subdivision used to convert profile arcs into canonical outline segments.
 */
export const AUTOMOVIE_DRAWING_ARC_STEP = Math.PI / 16;
