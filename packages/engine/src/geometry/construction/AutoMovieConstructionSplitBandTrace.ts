import type {
  IAutoMovieBlendColumn,
  IAutoMovieConstructionSplitBandTrace,
} from "@automovie/interface";

/**
 * Detached observations of the strip's existing column and local-scale work.
 * Ribbon first/second vectors differentiate the dimensionless cross parameter,
 * not physical station mm. A backward column has no forward log target.
 *
 * @evidence contracts/development/design.md#principled-representation Closed events retain the actual columns, common factor and local iteration values without selecting a geometric policy.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One optional synchronous sink and its detached value events serve the actual strip consumer.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No observer launches a solve or substitutes a ribbon.
 * @evidence contracts/development/common.md#meaningful-documentation States derivative units, missing-forward-target meaning and observer ownership.
 */
export namespace AutoMovieConstructionSplitBandTrace {
  /**
   * Copy an event before calling its observer; absent observers retain nothing.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Copies all arrays and ribbon vectors, so observer mutation cannot change a strip's columns or local state.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One closed event dispatch copies only its present payload.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Does not evaluate geometry or catch/replace producer failures; the observer contract requires a nonthrowing callback.
   * @evidence contracts/development/common.md#meaningful-documentation Names copy ownership and the absent-sink case.
   * @evidence contracts/development/implementation.md#efficient-algorithms Linear in one event's payload, only with an observer.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Receives existing computed values and performs no solve.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The sink owns its snapshot; this module retains nothing.
   */
  export function emit(sink: IAutoMovieConstructionSplitBandTrace.Sink | undefined, event: IAutoMovieConstructionSplitBandTrace.Event): void {
    if (sink === undefined) return;
    if (event.kind === "prepared") {
      sink({
        ...event,
        childPhases: [...event.childPhases],
        columns: event.columns.map(
          (
            column: IAutoMovieBlendColumn,
          ): IAutoMovieBlendColumn => ({
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
        own: event.own.map((value: IAutoMovieConstructionSplitBandTrace.Target): IAutoMovieConstructionSplitBandTrace.Target => ({ ...value })),
        goal: event.goal.map((value: IAutoMovieConstructionSplitBandTrace.Target): IAutoMovieConstructionSplitBandTrace.Target => ({ ...value })),
        envelope: [...event.envelope],
        smooth: [...event.smooth],
        field: [...event.field],
        adjustments: event.adjustments.map(
          (value: IAutoMovieConstructionSplitBandTrace.IAdjustment): IAutoMovieConstructionSplitBandTrace.IAdjustment => ({ ...value }),
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

  /**
   * Give infinite backward targets an explicit JSON-safe state.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Only known backward indices become absent-forward-target records; every forward logarithm is preserved.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One index-preserving map.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Does not turn an unavailable forward target into zero or a backward column.
   * @evidence contracts/development/common.md#meaningful-documentation Distinguishes absent forward targets from finite logarithms.
   * @evidence contracts/development/implementation.md#efficient-algorithms Linear in the column count and backward membership.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A value conversion coordinates no producer work.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns an invocation-owned value array.
   */
  export function targets(
    values: readonly number[],
    backward: readonly number[],
  ): IAutoMovieConstructionSplitBandTrace.Target[] {
    return values.map(
      (value: number, index: number): IAutoMovieConstructionSplitBandTrace.Target =>
        backward.includes(index)
          ? { kind: "backward" }
          : { kind: "finite", value },
    );
  }
}
