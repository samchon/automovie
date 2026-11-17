import type { IAutoMovieConstructionSeedTrace } from "@automovie/interface";
/**
 * Detached evidence from the existing bounded seed search, in chart mm/radians.
 * Null gap/chart means the actual branch had no finite reading, never zero.
 * A null candidate-completion iteration means not applicable; meet-end owns
 * the actual accepted Newton update count for that local solve.
 *
 * @evidence contracts/development/design.md#principled-representation Existing candidate, Newton and admission branches publish their actual finite state and termination reason.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One optional nonthrowing observer receives values without changing candidate order or solve policy.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No trace event supplies a substitute meeting or repeats a solver.
 * @evidence contracts/development/common.md#meaningful-documentation States parameter units, null meaning and observer ownership.
 */
export namespace AutoMovieConstructionSeedTrace {
  /**
   * Publish a copied finite state without retaining a callback or chart.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Copies a finite chart and gap, leaving unavailable values explicitly null.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One optional sink call.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Does not solve, admit or alter a meeting; callbacks must not throw.
   * @evidence contracts/development/common.md#meaningful-documentation Names copy ownership and null semantics.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant-size copying only when observed.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A value observation coordinates no geometry.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The receiving sink owns its snapshot; no global state survives.
   */
  export function emit(sink: IAutoMovieConstructionSeedTrace.Sink | undefined, event: IAutoMovieConstructionSeedTrace.IEvent): void {
    if (sink === undefined) return;
    sink({
      ...event,
      phase:
        event.phase !== null && Number.isFinite(event.phase)
          ? event.phase
          : null,
      start:
        event.start !== null && Number.isFinite(event.start)
          ? event.start
          : null,
      chart:
        event.chart !== null && event.chart.every(Number.isFinite)
          ? [...event.chart]
          : null,
      gap: event.gap !== null && Number.isFinite(event.gap) ? event.gap : null,
    });
  }
}
