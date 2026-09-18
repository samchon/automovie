/**
 * Cells one domain may hold, so a lattice cannot silently cost a gigabyte.
 *
 * @evidence requirements/effects-and-simulation/budgets-and-bounded-work.md#effects-budget-refusal Bounds lattice admission with an explicit cell ceiling.
 * @evidence specifications/simulation-effects-and-sound/budget-admission.md#effect-budget-refusal-and-compatibility Defines the compatible maximum accepted lattice population.
 */
export const FLUID_MAX_CELLS = 65_536;
