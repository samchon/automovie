
/**
 * Balance a bitangent conic's signed normal extrema with numerical exchange. Initial source nodes bracket witnessed displacement peaks. Golden-section refinement locates each such peak between nodes, then its source coordinate joins the coefficient bisection and the two signed lobes are rebalanced. This implements the extrema/equioscillation criterion of Ghosh et al. (2007), sections 3.2–3.3 and 6, without treating a fixed grid maximum as a supremum. The returned tuple is [rho, refined maximum displacement in millimetres]. Finite peak brackets still do not certify that an arbitrary callback has no unwitnessed extrema; exhausted exchange or an invalid normal returns absent. Source endpoints have displacement zero by exact endpoint interpolation.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Balance a bitangent conic's signed normal extrema with numerical exchange. Initial source nodes bracket witnessed displacement peaks. Golden-section
 * @evidence contracts/development/design.md#principled-representation Balance a bitangent conic's signed normal extrema with numerical exchange. Initial source nodes bracket witnessed displacement peaks. Golden-section
 * @evidence contracts/development/design.md#minimal-and-owned-surface GhoshConicApproximationBalance share IAutoMovieGhoshConicApproximationBalance's canonical records; the referenced quantities retain one declaration owner.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The declared observation and coefficient identities remain separate from source coverage and numerical qualification.
 */

export namespace IAutoMovieGhoshConicApproximationBalance {
/**
 * Balance a bitangent conic's signed normal extrema with numerical exchange. Initial source nodes bracket witnessed displacement peaks. Golden-section refinement locates each such peak between nodes, then its source coordinate joins the coefficient bisection and the two signed lobes are rebalanced. This implements the extrema/equioscillation criterion of Ghosh et al. (2007), sections 3.2–3.3 and 6, without treating a fixed grid maximum as a supremum. The returned tuple is [rho, refined maximum displacement in millimetres]. Finite peak brackets still do not certify that an arbitrary callback has no unwitnessed extrema; exhausted exchange or an invalid normal returns absent. Source endpoints have displacement zero by exact endpoint interpolation.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Balance a bitangent conic's signed normal extrema with numerical exchange. Initial source nodes bracket witnessed displacement peaks. Golden-section
 * @evidence contracts/development/design.md#principled-representation Balance a bitangent conic's signed normal extrema with numerical exchange. Initial source nodes bracket witnessed displacement peaks. Golden-section
 * @evidence contracts/development/design.md#minimal-and-owned-surface GhoshConicApproximationBalance share IAutoMovieGhoshConicApproximationBalance's canonical records; the referenced quantities retain one declaration owner.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The declared observation and coefficient identities remain separate from source coverage and numerical qualification.
 */

export type Operation = (sample: (
    t: number,
  ) => {
 /** Dimensionless barycentric source-point coordinates in the endpoint tangent triangle. */
value: readonly number[];
 /** Source unit-normal coordinates in the endpoint tangent triangle, with inverse-millimetre units. */
normal: readonly number[] } | undefined,
domain: readonly [number, number],
bounds: readonly [number, number],
maximumExchanges: number,
roundoffMm: number) => readonly [number, number] | undefined;
}

