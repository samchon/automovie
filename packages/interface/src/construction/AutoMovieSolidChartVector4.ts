/**
 * Paired surface-chart coordinates in solver order `[part.u, part.v, host.u,
 * host.v]`.
 *
 * A coordinate, first-rate or second-rate vector uses the same four slots;
 * coordinate units belong to each source chart, and rates divide them by the
 * trace parameter or its square. The host face index is carried separately.
 * TraceSolve copies input guesses before Newton updates; a returned rate array
 * is mutable and belongs to its intersection point.
 */
export type AutoMovieSolidChartVector4 = [number, number, number, number];
