import type { IAutoMovieCameraClearanceRuntime } from "@automovie/engine";

import type { IAutoMovieProductionSourceGateTrace } from "./IAutoMovieProductionSourceGateTrace";

/**
 * Hand a camera clearance evaluation its revisions and note when it reads them.
 *
 * The production compiler supplies a plain record with already observed
 * revision tokens and sample rate. The engine reads the tokens only after
 * admitted clearance takes and sample-rate checks require the comparison.
 * Without a trace the original runtime object is returned unchanged.
 *
 * @evidence contracts/common.md#principled-implementation A shallow runtime copy replaces revision/currentRevision with getters that mark this attempt's revision dependency before returning the supplied token; actual compiler inputs are plain records observed before evaluation.
 * @evidence contracts/common.md#clear-and-simple-design This wrapper records dependency reads while the engine compares tokens and the status owner decides reuse; untraced builds retain the original object identity.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No revision or clock is invented and reading sampleRate does not mark revision dependence. Arbitrary accessor-bearing inputs would also be evaluated by object spread, outside the actual plain-record caller premise.
 * @evidence contracts/common.md#meaningful-documentation States traced getter marking, unchanged untraced identity and already observed token meaning; this wrapper does not reacquire a current revision or prove an atomic geometry snapshot.
 * @evidence contracts/performance.md#efficient-algorithms Untraced calls return an existing reference; traced calls shallow-copy the fixed three-field runtime and create two getters, with constant local work beyond caller acquisition and engine sampling costs.
 * @evidence contracts/performance.md#reuse-equivalent-work All getter reads share one attempt trace and supplied runtime; repeated reads still execute the getter and no clearance result is cached here.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Returned getters retain the supplied runtime and trace until the returned context is released; fixed references acquire no descriptor, payload buffer or task, while the separate trace owns its observed document population.
 */
export function recordAutoMovieProductionClearanceRevision(props: {
  /** Trace of the running gate, or `undefined` when nothing records. */
  trace: IAutoMovieProductionSourceGateTrace | undefined;

  /** Revisions and fixed clock the builder computed for the evaluation. */
  runtime: IAutoMovieCameraClearanceRuntime;
}): IAutoMovieCameraClearanceRuntime {
  const trace: IAutoMovieProductionSourceGateTrace | undefined = props.trace;
  const runtime: IAutoMovieCameraClearanceRuntime = props.runtime;
  if (trace === undefined) return runtime;
  return {
    ...runtime,
    get revision(): string {
      trace.revisionBound = true;
      return runtime.revision;
    },
    get currentRevision(): string {
      trace.revisionBound = true;
      return runtime.currentRevision;
    },
  };
}
