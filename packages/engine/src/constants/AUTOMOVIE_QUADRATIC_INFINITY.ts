/**
 * The interval endpoint the engine's conic expansion treats as unbounded.
 *
 * Assembly writes this signed sentinel for a null endpoint; admission requires
 * every authored finite coefficient and endpoint to have strictly smaller
 * magnitude. Conic expansion omits only unbounded sides. Changing this boundary
 * requires admission, assembly and expansion to agree. Repository history
 * preserves the preceding Clarabel bridge and its matching 1e30 convention.
 *
 */
export const AUTOMOVIE_QUADRATIC_INFINITY: number = 1e30;
