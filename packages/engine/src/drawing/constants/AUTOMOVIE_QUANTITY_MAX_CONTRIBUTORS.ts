/**
 * How many owners one quantity finding may name.
 *
 * The same bound, for the same reason, as the render report's contributor list:
 * a take-off has to name the few owners worth acting on and count the rest, or
 * the artifact somebody orders material from grows with the building until
 * nobody reads it. What the bound leaves out is counted and summed, never
 * dropped, so the named owners and the total always reconcile.
 *
 * @evidence requirements/interior/deliverables-and-quantities.md#interior-quantities-waste Bounds each take-off's named owner sample while preserving the count and value of every omitted contributor.
 * @evidence specifications/interior-space/deliverables-and-validation.md#interior-space-drawing-schedule-quantity Sets the canonical contributor-list limit to eight before omitted owners are separately counted and summed.
 */
export const AUTOMOVIE_QUANTITY_MAX_CONTRIBUTORS = 8;
