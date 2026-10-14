import { evaluateAutoMovieStorySync } from "@automovie/engine";
import type {
  IAutoMovieAcceptanceScenario,
  IAutoMovieCompiledContractRealization,
  IAutoMovieShotContract,
  IAutoMovieShotStoryTime,
  IAutoMovieStorySyncOutcome,
} from "@automovie/interface";

/**
 * Measure one criterion using the supplied contract and realization observation.
 *
 * The engine owns story-clock mapping, unresolved operands and the inclusive
 * tolerance comparison. Sharing that algorithm does not make outcomes from
 * different realization observations equal.
 *
 * @evidence contracts/common.md#principled-implementation Binds each addressed shot to its story-time pin and first realized event with the requested ID, then delegates range and refusal semantics to evaluateAutoMovieStorySync.
 * @evidence contracts/common.md#clear-and-simple-design Separates production-store lookup from engine measurement; storySyncDiagnostics supplies the compiled attempt's realization map through the callback.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Missing contracts, pins, realizations and event IDs resolve to null, so the engine refuses unresolved operands instead of inventing times or skipping them.
 * @evidence contracts/common.md#meaningful-documentation States observation inputs, delegated verdict and the limit of algorithm reuse; upstream design validation owns the criterion's finite nonnegative tolerance.
 * @evidence contracts/performance.md#efficient-algorithms For E addressed events, contract lookups are Map reads and each realized-event search is linear in that shot's event list, plus realization-callback and engine O(E) costs; the outcome has O(E) points.
 * @evidence contracts/performance.md#reuse-equivalent-work Reads supplied contracts and realizations without rebuilding either. No cache assumes mutable observations equivalent; repeated addresses still perform their event lookup.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Closures last for synchronous evaluation and retain no process state or handle; the outcome and its points transfer to the caller.
 */
export function autoMovieStorySyncOutcome(props: {
  criterion: Extract<IAutoMovieAcceptanceScenario["criterion"], { kind: "story-sync" }>;
  contracts: ReadonlyMap<string, IAutoMovieShotContract>;
  realization: (shot: string) => IAutoMovieCompiledContractRealization | null;
}): IAutoMovieStorySyncOutcome {
  return evaluateAutoMovieStorySync({
    events: props.criterion.events,
    toleranceSeconds: props.criterion.toleranceSeconds,
    pin: (shot: string): IAutoMovieShotStoryTime | null =>
      props.contracts.get(shot)?.storyTime ?? null,
    realized: (shot: string, event: string): number | null =>
      props.realization(shot)?.events.find(
        (candidate: IAutoMovieCompiledContractRealization["events"][number]): boolean =>
          candidate.id === event,
      )?.time ?? null,
  });
}
