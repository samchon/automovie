/**
 * Outward styling bias and its arc-length decay on a connected hair lock.
 * This direction field is authored kinematics, not a force or tissue law.
 *
 * @evidence contracts/common.md#principled-implementation Outward direction bias decays exponentially with integrated arc distance using nonnegative strength and positive metric reach.
 * @evidence contracts/common.md#clear-and-simple-design Two coefficients join the layer's direction evaluation; the integrator separately owns contact and centreline length.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Strength is a dimensionless direction weight, not a lift force or measured hair stiffness; tail entry can disable this bias.
 * @evidence contracts/common.md#meaningful-documentation Members state the nonnegative strength domain and positive metre decay distance, with authored kinematic meaning.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Strength and reach execute no exponential decay or outward direction evaluation.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The record coordinates no repeated field requests or evaluated-station cache.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources No integration state or force solver is acquired by this type; the layer owns its scalar values.
 * @author Samchon
 */
export interface IHumanFaceHairLayerLift {
  /** Nonnegative dimensionless outward direction weight. */
  strength: number;

  /** Positive exponential decay distance along the lock, metres. */
  reach: number;
}
