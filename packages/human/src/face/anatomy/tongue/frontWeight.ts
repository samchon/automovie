/**
 * How much of the tongue's forward shaping reaches a given station.
 *
 * The smoothstep is inverted so the weight is one at the root and falls to zero
 * by the tip, with zero slope at both ends. That last part is why it is a cubic
 * rather than a straight line: a linear falloff leaves a crease where the
 * shaping stops, and the surface is sampled finely enough to show it.
 *
 * @author Samchon
 */
export const frontWeight = (v: number): number => 1 - v * v * (3 - 2 * v);
