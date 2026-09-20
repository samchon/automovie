/**
 * Sources, and separately drains, one domain may declare.
 *
 * @evidence requirements/effects-and-simulation/budgets-and-bounded-work.md#effects-budget-refusal Bounds declared flow work before execution.
 * @evidence specifications/simulation-effects-and-sound/budget-admission.md#effect-budget-refusal-and-compatibility Fixes the supported source and drain population ceiling.
 */
export const FLUID_MAX_FLOWS = 256;
