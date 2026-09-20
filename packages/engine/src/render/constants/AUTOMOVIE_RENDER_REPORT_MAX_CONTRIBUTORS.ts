/**
 * How many dominant owners one finding may list.
 *
 * This is the whole of what bounds the report. A finding names the few owners
 * worth editing and counts the rest, so a report over a fifty-thousand-slot
 * production is the same size as one over a single room. An unbounded list
 * would be a second copy of the inventory wearing a verdict, and the one
 * artifact that has to be read at a glance would become the one nobody reads.
 *
 * @evidence requirements/rendering/budgets.md#rendering-expansion-bounds Caps the owner expansion of every finding while retaining the omitted total.
 * @evidence specifications/editorial-render-and-delivery/render-budget-identity-and-recovery.md#spec-render-budget-preflight Implements the bounded dominant-owner report instead of copying the full inventory.
 */
export const AUTOMOVIE_RENDER_REPORT_MAX_CONTRIBUTORS = 8;
