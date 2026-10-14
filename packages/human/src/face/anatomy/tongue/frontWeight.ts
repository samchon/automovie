/**
 * How much of the tongue's forward shaping reaches a given station.
 *
 * The smoothstep is inverted so the weight is one at the anterior tip and falls to zero
 * at the posterior pole, with zero slope at both ends. That last part is why it is a cubic
 * rather than a straight line: a linear falloff leaves a crease where the
 * shaping stops, and the surface is sampled finely enough to show it.
 *
 * @author Samchon
 *
 * @evidence contracts/common.md#principled-implementation One minus cubic smoothstep gives unit anterior and zero posterior influence with zero endpoint derivatives on admitted [0,1] stations.
 * @evidence contracts/common.md#clear-and-simple-design Advance and jaw attachment share this fade so their posterior fixation agrees.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts This is authored kinematic weighting, not muscular measurement; callers supply resident stations and the polynomial performs no input clipping.
 * @evidence contracts/common.md#meaningful-documentation The comment explains endpoint direction and the cubic's zero slopes.
 * @evidence contracts/performance.md#efficient-algorithms Fixed cubic arithmetic uses constant work without allocation or traversal.
 * @evidence contracts/performance.md#reuse-equivalent-work Both consumers reuse one definition; independent cheap station evaluations need no result cache.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only a scalar escapes and no input, closure, mesh or handle is retained.
 */
export const frontWeight: (v: number) => number = (v: number): number =>
  1 - v * v * (3 - 2 * v);
