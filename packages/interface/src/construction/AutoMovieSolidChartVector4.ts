/**
 * Paired surface-chart coordinates in solver order `[part.u, part.v, host.u, host.v]`.
 *
 * A coordinate, first-rate or second-rate vector uses the same four slots;
 * coordinate units belong to each source chart, and rates divide them by the
 * trace parameter or its square. The host face index is carried separately.
 * TraceSolve copies input guesses before Newton updates; a returned rate array
 * is mutable and belongs to its intersection point.
 *
 * @evidence contracts/development/design.md#principled-representation Four fixed slots match the surface-equality Jacobian; chart units are not interchangeable with world millimetres.
 * @evidence contracts/development/design.md#minimal-and-owned-surface TraceSolve uses this ordering for guesses, solved preimages and implicit parameter rates.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Tuple arity excludes missing coordinates, while finite values, valid host indices and regular source jets remain solver premises.
 * @evidence contracts/development/common.md#meaningful-documentation States slot order, chart/rate units and input-copy versus result ownership.
 */
export type AutoMovieSolidChartVector4 = [number, number, number, number];
