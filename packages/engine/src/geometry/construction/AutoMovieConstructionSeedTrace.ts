import type { IAutoMovieConstructionSeedTrace } from "@automovie/interface";
/**
 * Detached evidence from the existing bounded seed search, in chart mm/radians.
 * Null gap/chart means the actual branch had no finite reading, never zero.
 * A null candidate-completion iteration means not applicable; meet-end owns
 * the actual accepted Newton update count for that local solve.
 */
export namespace AutoMovieConstructionSeedTrace {
  /**
   * Publish a copied finite state without retaining a callback or chart.
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
