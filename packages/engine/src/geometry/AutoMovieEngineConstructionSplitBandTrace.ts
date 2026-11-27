import type {
  IAutoMovieBlendColumn,
  IAutoMovieConstructionSplitBandTrace,
} from "@automovie/interface";

/**
 * Detached observations of the strip's existing column and local-scale work.
 * Ribbon first/second vectors differentiate the dimensionless cross parameter,
 * not physical station mm. A backward column has no forward log target.
 */
export namespace AutoMovieEngineConstructionSplitBandTrace {
  /** Copy an event before calling its observer; absent observers retain nothing. */
  export function emit(
    sink: IAutoMovieConstructionSplitBandTrace.Sink | undefined,
    event: IAutoMovieConstructionSplitBandTrace.Event,
  ): void {
    if (sink === undefined) return;
    if (event.kind === "prepared") {
      sink({
        ...event,
        childPhases: [...event.childPhases],
        columns: event.columns.map(
          (column: IAutoMovieBlendColumn): IAutoMovieBlendColumn => ({
            start: {
              point: [...column.start.point],
              first: [...column.start.first],
              second: [...column.start.second],
            },
            end: {
              point: [...column.end.point],
              first: [...column.end.first],
              second: [...column.end.second],
            },
          }),
        ),
        backward: [...event.backward],
        forwardIndices: [...event.forwardIndices],
        factors: [...event.factors],
      });
    } else if (event.kind === "local-pass") {
      sink({
        ...event,
        backward: [...event.backward],
        own: event.own.map(
          (
            value: IAutoMovieConstructionSplitBandTrace.Target,
          ): IAutoMovieConstructionSplitBandTrace.Target => ({ ...value }),
        ),
        goal: event.goal.map(
          (
            value: IAutoMovieConstructionSplitBandTrace.Target,
          ): IAutoMovieConstructionSplitBandTrace.Target => ({ ...value }),
        ),
        envelope: [...event.envelope],
        smooth: [...event.smooth],
        field: [...event.field],
        adjustments: event.adjustments.map(
          (
            value: IAutoMovieConstructionSplitBandTrace.IAdjustment,
          ): IAutoMovieConstructionSplitBandTrace.IAdjustment => ({ ...value }),
        ),
      });
    } else if (event.kind === "minorant") {
      sink({
        kind: "minorant",
        result:
          event.result.kind === "accepted"
            ? {
                ...event.result,
                field: [...event.result.field],
                limitingIndices: [...event.result.limitingIndices],
              }
            : { ...event.result },
      });
    } else sink({ ...event });
  }

  /** Give infinite backward targets an explicit JSON-safe state. */
  export function targets(
    values: readonly number[],
    backward: readonly number[],
  ): IAutoMovieConstructionSplitBandTrace.Target[] {
    return values.map(
      (
        value: number,
        index: number,
      ): IAutoMovieConstructionSplitBandTrace.Target =>
        backward.includes(index)
          ? { kind: "backward" }
          : { kind: "finite", value },
    );
  }
}
