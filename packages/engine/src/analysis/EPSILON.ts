/** Distances shorter than this are the same point.  * @evidence requirements/interior/acoustics-and-sound-boundaries.md#interior-acoustic-analysis-boundary `AUTOMOVIE_SABINE_CONSTANT` fixes the metric coefficient that converts room volume and absorption area into a declared Sabine reverberation time.
 * @evidence specifications/interior-space/lighting-acoustics-and-environment.md#interior-space-acoustic-boundary-scenario The constant pins the supported metric-unit Sabine equation instead of implying an impulse-response simulation.
 * @author Samchon
 */
export const EPSILON = 1e-12;
