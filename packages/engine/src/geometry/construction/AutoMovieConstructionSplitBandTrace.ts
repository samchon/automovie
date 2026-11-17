import type { AutoMovieConstructionLocalScaleMinorant } from "./AutoMovieConstructionLocalScaleMinorant";
import type { AutoMovieConstructionSplitBand } from "./AutoMovieConstructionSplitBand";

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
   * A synchronous nonthrowing observer; it receives no producer-owned vectors.
   * @evidence contracts/development/design.md#principled-representation A value callback observes existing work without supplying geometric inputs.
   * @evidence contracts/development/design.md#minimal-and-owned-surface One event argument and no result.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Cannot return a replacement column or scale.
   * @evidence contracts/development/common.md#meaningful-documentation States nonthrowing behavior and detached ownership.
   */
  export type Sink = (event: Event) => void;

  /**
   * A finite log target, or its explicit absence on a backward column.
   * @evidence contracts/development/design.md#principled-representation A backward column has no forward monotonicity target, rather than an infinite JSON number.
   * @evidence contracts/development/design.md#minimal-and-owned-surface A closed pair carries only the applicable value.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts An absent target is never zero-filled.
   * @evidence contracts/development/common.md#meaningful-documentation Distinguishes logarithmic values from geometric backward status.
   */
  export type Target = { kind: "finite"; value: number } | { kind: "backward" };

  /**
   * One target change made by the existing local iteration.
   * @evidence contracts/development/design.md#principled-representation Records the actual column, lowering branch, new log goal and optional predicate factor.
   * @evidence contracts/development/design.md#minimal-and-owned-surface No solver policy or next iteration is supplied.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The optional factor is explicitly null for the above-own branch.
   * @evidence contracts/development/common.md#meaningful-documentation Names each value and its branch-specific meaning.
   */
  export interface IAdjustment {
    /** Column in clock order. */
    column: number;
    /** The existing branch that changed the target. */
    reason: "above-own" | "predicate";
    /** New finite logarithmic target. */
    goal: number;
    /** The new monotone factor, only for a predicate adjustment. */
    lower: number | null;
  }

  /**
   * Actual prepared columns, local passes, one certified attenuation or refusal.
   * @evidence contracts/development/design.md#principled-representation Closed stage records preserve original ribbon inputs and each already computed scale state.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Prepared inputs, local states and the final minorant certificate or refusal are the complete observation.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Events do not expose executable surfaces or mutate producer state.
   * @evidence contracts/development/common.md#meaningful-documentation The namespace states ribbon units; pass targets precede adjustments and minorant alpha attenuates the last recorded field.
   */
  export type Event =
    | {
        kind: "prepared";
        name: string;
        childPhases: number[];
        columns: AutoMovieConstructionSplitBand.IColumn[];
        backward: number[];
        forwardIndices: number[];
        factors: number[];
        commonFactor: number;
      }
    | {
        kind: "local-pass";
        pass: number;
        backward: number[];
        own: Target[];
        goal: Target[];
        envelope: number[];
        smooth: number[];
        field: number[];
        adjustments: IAdjustment[];
        settled: boolean;
      }
    | {
        kind: "minorant";
        result: AutoMovieConstructionLocalScaleMinorant.Result;
      }
    | {
        kind: "refusal";
        stage:
          | "correspondence"
          | "columns"
          | "common"
          | "local"
          | "publication";
        reason: string;
        pass: number | null;
      };

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
  export function emit(sink: Sink | undefined, event: Event): void {
    if (sink === undefined) return;
    if (event.kind === "prepared") {
      sink({
        ...event,
        childPhases: [...event.childPhases],
        columns: event.columns.map(
          (
            column: AutoMovieConstructionSplitBand.IColumn,
          ): AutoMovieConstructionSplitBand.IColumn => ({
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
        own: event.own.map((value: Target): Target => ({ ...value })),
        goal: event.goal.map((value: Target): Target => ({ ...value })),
        envelope: [...event.envelope],
        smooth: [...event.smooth],
        field: [...event.field],
        adjustments: event.adjustments.map(
          (value: IAdjustment): IAdjustment => ({ ...value }),
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
  ): Target[] {
    return values.map(
      (value: number, index: number): Target =>
        backward.includes(index)
          ? { kind: "backward" }
          : { kind: "finite", value },
    );
  }
}
