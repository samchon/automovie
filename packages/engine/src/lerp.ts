/**
 * Interpolate one scalar the one way every automovie cue interpolates.
 *
 * @evidence requirements/formations/budgets-and-validation.md#formation-determinism Gives translation, spacing, facing, and reform channels one identical linear interpolation rule.
 * @evidence specifications/performance-motion-and-staging/formation-motion-resolution-and-budgets.md#performance-formation-determinism-status-compatibility Prevents channel-specific arithmetic from producing divergent formation samples.
 */
export const lerp = (from: number, to: number, progress: number): number =>
  from * (1 - progress) + to * progress;
