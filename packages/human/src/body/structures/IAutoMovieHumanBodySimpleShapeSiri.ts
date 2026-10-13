/**
 * Siri's two-compartment density model as the table stores it: body fat
 * fraction = numerator / density − offset.
 *
 * @evidence contracts/common.md#principled-implementation Numerator and offset parameterize the two-compartment relation between fat fraction and density; the arithmetic owner inverts that relation.
 * @evidence contracts/common.md#clear-and-simple-design The density equation's two coefficients stay together in the mass table.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts This schema stores model coefficients, without asserting an individual's measured tissue composition.
 * @evidence contracts/common.md#meaningful-documentation The prose gives the equation and distinguishes its numerator and offset.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The two-compartment density coefficients definition supplies no executable processing strategy.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The two-compartment density coefficients type neither schedules requests nor caches results.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The two-compartment density coefficients declaration does not acquire or retain runtime resources.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanBodySimpleShapeSiri {
  /** The numerator of Siri's equation. */
  numerator: number;

  /** The offset of Siri's equation. */
  offset: number;
}
