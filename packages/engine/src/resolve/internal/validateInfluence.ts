/*
 * Require a finite solver influence within the closed unit interval.
 */
export function validateInfluence(label: string, influence: number): void {
  if (influence < 0)
    throw new Error(
      `world driver ${label} influence must be between 0 and 1, but was ${influence}`,
    );
  if (influence > 1)
    throw new Error(
      `world driver ${label} influence must be between 0 and 1, but was ${influence}`,
    );
}
