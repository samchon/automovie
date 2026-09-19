/**
 * Spray emitters one domain may declare.
 *
 * @evidence requirements/effects-and-simulation/budgets-and-bounded-work.md#effects-budget-refusal Bounds decorative emitter work independently of the conserved solve.
 * @evidence specifications/simulation-effects-and-sound/budget-admission.md#effect-budget-refusal-and-compatibility Fixes the supported spray-emitter population ceiling.
 */
export const FLUID_MAX_SPRAYS = 32;
