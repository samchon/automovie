/**
 * Numerical rest-detail filtering after skinning on one connected surface.
 *
 * This basis policy is not an anatomical document channel or a tissue law.
 * The consumer is `createHumanBodyPosedSurface`; the surface admission owns
 * its numerical bounds. Rest and posed samples use the same topology and
 * metre frame. Omission from a surface keeps its earlier deformation path.
 *
 * @evidence contracts/common.md#principled-implementation Declares safe-integer sweep and ring counts and bounded dimensionless mask parameters for the explicitly defined iterative filter; it does not represent tissue measurements.
 * @evidence contracts/common.md#clear-and-simple-design One optional surface policy with the four values its preparation consumes; body document channels and pose data remain separate.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No person, region coordinate or vertex is addressed by the policy, and admission owns its bounds instead of per-consumer clamps.
 * @evidence contracts/common.md#meaningful-documentation Describes the numerical role, consumer, absent-option behavior and each field's unit and bound.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping This policy defines no part or group; it belongs to an existing connected surface.
 * @evidenceExclude contracts/modeling.md#parameter-channels These are numerical filtering controls, not independent anatomical traits or human document channels.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The policy emits no geometry and changes no primitive population.
 * @evidence contracts/modeling.md#spatial-conventions The sweep and ring values are counts and width/decay are dimensionless ratios; the consumer's two surfaces share the existing metre frame.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The declaration constructs no boundary; its consumer owns fixed support.
 * @evidenceExclude contracts/modeling.md#rendered-observation This numerical policy owns no part or joint; the consumer's changed surface still requires actual-output observation.
 * @evidenceExclude contracts/anatomy.md#anatomical-source It carries no biological measurement or fitted physiological coefficient.
 * @evidenceExclude contracts/anatomy.md#permitted-range Its bounds make numerical counters and blending well-defined, not clinical body states admissible.
 * @evidenceExclude contracts/anatomy.md#parametric-authority It is basis compiler policy, not an additional authored human measurement, motion or sculpting input.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanBodyBasisSurfaceMush {
  /** Positive safe integer count of half-step, equal-neighbour Laplacian sweeps. */
  iterations: number;

  /** Largest-influence deficit at which filtering is full, in (0, 1]. */
  blendWidth: number;

  /** Nonnegative safe integer count of graph rings over which the mask spreads. */
  spreadRings: number;

  /** Fraction of a neighbouring mask carried per ring, in [0, 1). */
  spreadDecay: number;
}
