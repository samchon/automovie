/**
 * Require a finite solver influence within the closed unit interval.
 *
 * @evidence requirements/actors/skeleton-rig-and-retargeting.md#actor-rig-control-drivers Rejects driver influence values that cannot define a bounded deterministic blend.
 * @evidence specifications/performance-motion-and-staging/rig-deformation-and-retargeting.md#performance-rig-rom-control-driver-graph Enforces the legal influence domain of world-space driver evaluation.
 */
export const validateInfluence = (label: string, influence: number): void => {
  if (!Number.isFinite(influence))
    throw new Error(
      `world driver ${label} influence must be finite, but was ${influence}`,
    );
  if (influence < 0)
    throw new Error(
      `world driver ${label} influence must be between 0 and 1, but was ${influence}`,
    );
  if (influence > 1)
    throw new Error(
      `world driver ${label} influence must be between 0 and 1, but was ${influence}`,
    );
};
