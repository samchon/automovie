import type {
  IAutoMovieHumanPersonBodyView,
  IAutoMovieHumanPersonHeadView,
} from "@automovie/human";

/**
 * Inputs of `createConnectedPersonMeasureRuntime`: the views the resident person worker read once, and its stage signal. The numerical owner lazily retains one paired body reach and one compiled whole-person evaluator for this runtime. Signals identify completed stages, not successful target admission or a worker timeout; the enclosing resident worker owns eventual teardown.
 *
 * @evidence contracts/common.md#principled-implementation Shared head/body promises bind numerical requests to one resident generation and stage callbacks identify actual completed evaluation work.
 * @evidence contracts/common.md#clear-and-simple-design The runtime borrows partition views and one telemetry hook while compilation, solver dispatch and resident-worker lifetime stay with their numerical owners.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Progress stages do not certify met targets, editor admission or physical worker retirement, and views are not independently reloaded for each request.
 * @evidence contracts/common.md#meaningful-documentation The comment identifies shared generation views, lazy reach/evaluator retention, telemetry limits and enclosing worker teardown.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The properties choose no compilation, geometry read or inverse algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Borrowed promises identify the generation without implementing runtime memoization or document-result equivalence in this type.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The declaration borrows view promises and a callback; pending requests and compiled evaluators remain resident-worker resources.
 *
 * @author Samchon
 */
export interface IConnectedPersonMeasureRuntimeProps {
  /** The head partition view, read once by the worker. */
  head: Promise<IAutoMovieHumanPersonHeadView>;

  /** The body partition view, read once by the worker. */
  body: Promise<IAutoMovieHumanPersonBodyView>;

  /**
   * Report a completed numerical stage for the page's progress display, separately from terminal request success or refusal.
   *
   * @evidence contracts/common.md#principled-implementation Stage reports follow actual compilation, construction or numerical reading while the request reply separately carries success or refusal.
   * @evidence contracts/common.md#clear-and-simple-design One telemetry hook leaves numerical stage ownership in the worker and progress presentation on the page.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Activity telemetry is neither an admission verdict nor a wall-clock deadline for valid computation.
   * @evidence contracts/common.md#meaningful-documentation The member identifies completed stage provenance and separate terminal request settlement.
   * @evidenceExclude contracts/performance.md#efficient-algorithms The callback type chooses no progress transport or DOM update algorithm.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Progress publication is an observation effect rather than cached numerical work.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The supplied callback acquires no timer, listener or worker lifetime in this declaration.
   */
  signal: (stage: string) => void;
}
