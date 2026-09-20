/**
 * Absolute steps one seek may integrate.
 *
 * @evidence requirements/effects-and-simulation/budgets-and-bounded-work.md#effects-budget-refusal Bounds seek reconstruction before unbounded integration begins.
 * @evidence specifications/simulation-effects-and-sound/budget-admission.md#effect-budget-refusal-and-compatibility Defines the compatible maximum seek workload.
 */
export const FLUID_MAX_STEPS = 100_000;
