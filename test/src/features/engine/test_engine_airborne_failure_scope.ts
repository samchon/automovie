import {
  MotionTrajectoryFailure,
  integrateAirborneRotation,
  integrateMotionTrajectory,
} from "@automovie/engine";
import type {
  IAutoMovieIntegrateAirborneRotation,
  IAutoMovieIntegrateMotionTrajectory,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

/**
 * A nested trajectory's typed failure remains owned by that trajectory.
 *
 * At t=1, adding the positive binary64 Number.MIN_VALUE cannot advance the
 * clock. A finite constant-rate adaptive integration therefore reaches the
 * public time-resolution refusal before taking a step. Its actual typed
 * error, rather than a constructed imitation, is then thrown by an outer
 * airborne integration's owned history input.
 *
 * Scenarios:
 * 1. Inner integrations produce real MotionTrajectoryFailure objects with
 *    an absent or explicit operation token, before any rejected trial.
 * 2. Outer integrations with an implicit and a different explicit token
 *    propagate that exact object. Its message, stack and every own data
 *    property stay unchanged, and neither performs post-failure history
 *    reads to attach another flight's physical or takeoff context. The
 *    absent-inner/default-outer case distinguishes a fresh private scope
 *    from incorrectly treating two absent tokens as shared ownership.
 *
 * This deferred error-boundary unit requests no Human fixture or physical
 * acceptance change. It does not assert that an owned outer failure lacks
 * diagnostics; the original Human representative exercises that path.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the independent binary64 clock premise, actual inner failure provenance, operation tokens, exception/data ownership and the distinction from an outer flight's own diagnostics.
 * @evidence contracts/development/testing.md#behavioral-verification Creates an actual public adaptive resolution failure, throws that same object from an owned public airborne history and observes identity, unchanged descriptors and history-call termination under both outer-token modes.
 * @evidence contracts/development/testing.md#independent-expectations Number.MIN_VALUE cannot change the representable value 1. A model's thrown object belongs to its originating operation, so a distinct caller may propagate it but must not rewrite its data or query that failed model for unrelated diagnostics.
 * @evidence contracts/development/testing.md#distinguishing-cases Actual same-class nested failures with absent and explicit inner tokens distinguish class membership and two absent tokens from ownership; default and explicitly distinct outer scopes, positive callback coverage and original own-property descriptors distinguish added metadata, replaced errors and hidden diagnostic reads.
 * @evidence contracts/development/testing.md#execution-ownership One deferred CPU entry owns its constant ODE, throwing history callbacks and produced errors; it replaces no foreign method or global and starts no runner, compiler, renderer or host.
 */
export function test_engine_airborne_failure_scope(): void {
  const findings: string[] = [];

  /** A normal return is never accepted as an observed exception. */
  function capture(task: () => unknown): unknown {
    try {
      task();
      return undefined;
    } catch (error) {
      return error;
    }
  }

  for (const innerScope of [undefined, Symbol("independent inner trajectory")]) {
  const foreign: unknown = capture((): IAutoMovieIntegrateMotionTrajectory.ITrajectory =>
    integrateMotionTrajectory({
      f: (): IAutoMovieIntegrateMotionTrajectory.IRate => ({
        dx: [], w: { x: 0, y: 0, z: 0 },
      }),
      x0: [],
      q0: { x: 0, y: 0, z: 0, w: 1 },
      t0: 1,
      t1: 2,
      h: Number.MIN_VALUE,
      tolerance: { relative: 0, absolute: 1e-6 },
      ...(innerScope === undefined ? {} : { errorScope: innerScope }),
    }),
  );
  if (!(foreign instanceof MotionTrajectoryFailure &&
    foreign.time === 1 && foreign.step === Number.MIN_VALUE &&
    foreign.scope === innerScope && foreign.rejection === undefined))
    throw new Error("The public inner trajectory did not produce its own resolution failure");
  const keys: (string | symbol)[] = Reflect.ownKeys(foreign);
  const descriptors: (PropertyDescriptor | undefined)[] = keys.map(
    (key: string | symbol): PropertyDescriptor | undefined =>
      Object.getOwnPropertyDescriptor(foreign, key),
  );

  for (const outerScope of [undefined, Symbol("independent outer flight")]) {
    let reads: number = 0;
    const observed: unknown = capture((): IAutoMovieIntegrateAirborneRotation.IFlight =>
      integrateAirborneRotation({
        history: (): IAutoMovieIntegrateAirborneRotation.IInstant => {
          reads++;
          throw foreign;
        },
        t0: 0,
        t1: 1,
        q0: { x: 0, y: 0, z: 0, w: 1 },
        momentum: { x: 1, y: 0, z: 0 },
        tolerance: { relative: 0, absolute: 1e-6 },
        ...(outerScope === undefined ? {} : { errorScope: outerScope }),
      }),
    );
    const label: string = `${innerScope === undefined ? "unscoped" : "scoped"} inner / ${outerScope === undefined ? "implicit" : "explicit"} outer`;
    if (observed !== foreign)
      findings.push(`${label}: the outer integration replaced the model's error`);
    if (reads !== 1)
      findings.push(`${label}: failed history was queried ${reads} times`);
    const after: (string | symbol)[] = Reflect.ownKeys(foreign);
    if (!(after.length === keys.length && keys.every(
      (key: string | symbol, index: number): boolean => {
        const before: PropertyDescriptor | undefined = descriptors[index];
        const current: PropertyDescriptor | undefined =
          Object.getOwnPropertyDescriptor(foreign, key);
        return after[index] === key && before !== undefined && current !== undefined &&
          Object.is(before.value, current.value) && before.get === current.get &&
          before.set === current.set && before.writable === current.writable &&
          before.enumerable === current.enumerable && before.configurable === current.configurable;
      },
    ))) findings.push(`${label}: the outer flight rewrote foreign failure metadata`);
  }
  }
  TestValidator.equals("nested trajectory failures retain their original owner", findings, []);
}
