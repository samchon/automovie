/**
 * Sabine's constant in metric units, `0.161 s*m^-1`.
 *
 * It is the constant of the equation `T60 = 0.161 * V / A`, not a property of
 * any room or material, which is why it lives in the solver rather than in a
 * table a production would have to supply.
 *
 * @evidence requirements/interior/acoustics-and-sound-boundaries.md#interior-acoustic-analysis-boundary `AUTOMOVIE_SABINE_CONSTANT` fixes the metric coefficient that converts room volume and absorption area into a declared Sabine reverberation time.
 * @evidence specifications/interior-space/lighting-acoustics-and-environment.md#interior-space-acoustic-boundary-scenario The constant pins the supported metric-unit Sabine equation instead of implying an impulse-response simulation.
 */
export const AUTOMOVIE_SABINE_CONSTANT = 0.161;
