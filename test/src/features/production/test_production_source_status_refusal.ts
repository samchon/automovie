import { TestValidator } from "@nestia/e2e";
import type { IAutoMovieBuildProjectOutput } from "@automovie/interface";

import {
  GENERATED_STALE,
  SOURCE_FAILURE,
  answerOf,
  createSourceStatusWorld,
  runsPerCall,
} from "./sourceStatusFixtures";

/** Run one status call and return what it threw, or `undefined`. */
function thrownBy(task: () => unknown): unknown {
  try {
    task();
    return undefined;
  } catch (error) {
    return error;
  }
}

/**
 * A failed, thrown or unobservable gate answer is never reused.
 *
 * Reuse is a claim that the current project still passes the gate. A failure
 * carries the diagnostics an author corrects from, so it must come from a run at
 * every boundary rather than from memory. An exception carries its own cause and
 * must propagate as itself. A snapshot the project refuses to give, or cannot
 * give completely, proves nothing about the inputs, so it can only run the gate.
 *
 * Scenarios:
 *
 * 1. An invalid source runs the gate and returns its diagnostic at each of three
 *    boundaries, reading the project once at each, because a failed answer is
 *    never read again after its run.
 * 2. After a reused success, an invalid edit returns the new failure rather than
 *    the reused success, and the next boundary runs the gate again.
 * 3. A gate exception propagates as the same error object, and the next boundary
 *    over the original inputs runs the gate again instead of returning the
 *    answer reused before the exception.
 * 4. A refused project read beside a gate that refuses the same way propagates
 *    the gate's error. A refused read beside a gate success returns that success
 *    at every boundary without reusing it, until a complete read lets it be
 *    reused.
 * 5. A snapshot that cannot be completed runs the gate at every boundary.
 * 6. A success that executed a project module outside the fingerprinted content
 *    runs the gate and reads the project once at every boundary, and the same
 *    success without that module is reused.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls the maintained retention owner through existing world ports and checks failed answer populations, exact evaluation/acquisition counts and thrown object identity. Failures, unavailable snapshots and undeclared executed dependencies must reevaluate; recovery may establish a new reusable success.
 * @evidence contracts/testing.md#independent-expectations Literal [1,1,1], [1,1] and [1,0] sequences encode evaluate-every-failure versus retain-proved-success. Explicit validity/source/observation/module arrangements and independently authored diagnostic records define expected output; answerOf is fixture arrangement, not proof that a native compiler emits those diagnostics.
 * @evidence contracts/testing.md#distinguishing-cases Keeps initially invalid source, invalid edit after reuse, evaluation exception identity, acquisition exception with failing or successful evaluation, restored reads, null/incomplete snapshots and undeclared modules later removed. Race mismatches and unchanged/revision-dependent reuse are owned by the adjacent race/retention units.
 * @evidence contracts/testing.md#execution-ownership The named test_production_source_status_refusal owns six portable synchronous groups using a fresh world per group and deterministic existing hooks. It invokes real retention with modeled observations/gates, without physical project reads, compiler execution, process, renderer or GPU.
 */
export function test_production_source_status_refusal(): void {
  const invalid: ReturnType<typeof createSourceStatusWorld> = createSourceStatusWorld();
  invalid.state.valid = false;
  const failing: ReturnType<typeof runsPerCall> = runsPerCall(invalid, invalid.status(), 3);
  const failure: IAutoMovieBuildProjectOutput = answerOf(invalid.state, [SOURCE_FAILURE]);
  TestValidator.equals(
    "an invalid source runs the gate, reports it and reads once per boundary",
    { ...failing, reads: invalid.counts.acquisitions },
    { runs: [1, 1, 1], answers: [failure, failure, failure], reads: 3 },
  );

  const broken: ReturnType<typeof createSourceStatusWorld> = createSourceStatusWorld();
  const brokenStatus: () => IAutoMovieBuildProjectOutput = broken.status();
  const reused: ReturnType<typeof runsPerCall> = runsPerCall(broken, brokenStatus, 2);
  broken.state.source = "export const opening = defineShot(undefined);\n";
  broken.state.valid = false;
  const afterEdit: ReturnType<typeof runsPerCall> = runsPerCall(broken, brokenStatus, 2);
  const brokenAnswer: IAutoMovieBuildProjectOutput = answerOf(broken.state, [
    SOURCE_FAILURE,
    GENERATED_STALE,
  ]);
  TestValidator.equals(
    "an invalid edit never inherits the reused success",
    { reused: reused.runs, afterEdit },
    {
      reused: [1, 0],
      afterEdit: { runs: [1, 1], answers: [brokenAnswer, brokenAnswer] },
    },
  );

  const crashing: ReturnType<typeof createSourceStatusWorld> = createSourceStatusWorld();
  const crashingStatus: () => IAutoMovieBuildProjectOutput = crashing.status();
  crashingStatus();
  const original: string = crashing.state.source;
  const crash: Error = new Error("shot program threw while the gate ran");
  crashing.state.source = "export const opening = explode();\n";
  crashing.hooks.beforeRead = (): void => {
    throw crash;
  };
  const thrown: unknown = thrownBy(crashingStatus);
  crashing.hooks.beforeRead = (): void => undefined;
  crashing.state.source = original;
  const recovered: ReturnType<typeof runsPerCall> = runsPerCall(crashing, crashingStatus, 2);
  TestValidator.equals(
    "a gate exception propagates and drops the reused answer",
    { sameError: thrown === crash, recovered: recovered.runs },
    { sameError: true, recovered: [1, 0] },
  );

  const replaced: ReturnType<typeof createSourceStatusWorld> = createSourceStatusWorld();
  const replacedStatus: () => IAutoMovieBuildProjectOutput = replaced.status();
  replacedStatus();
  const race: Error = new Error("Production project root identity changed.");
  replaced.hooks.acquire = (): void => {
    throw race;
  };
  replaced.hooks.beforeRead = (): void => {
    throw race;
  };
  const refusedTogether: unknown = thrownBy(replacedStatus);
  replaced.hooks.beforeRead = (): void => undefined;
  const refusedRead: ReturnType<typeof runsPerCall> = runsPerCall(replaced, replacedStatus, 2);
  replaced.hooks.acquire = (): void => undefined;
  const readRestored: ReturnType<typeof runsPerCall> = runsPerCall(replaced, replacedStatus, 2);
  const success: IAutoMovieBuildProjectOutput = answerOf(replaced.state, []);
  TestValidator.equals(
    "a refused project read only ever runs the gate",
    {
      sameError: refusedTogether === race,
      refusedRead,
      readRestored: readRestored.runs,
    },
    {
      sameError: true,
      refusedRead: { runs: [1, 1], answers: [success, success] },
      readRestored: [1, 0],
    },
  );

  const incomplete: ReturnType<typeof createSourceStatusWorld> = createSourceStatusWorld();
  const incompleteStatus: () => IAutoMovieBuildProjectOutput = incomplete.status();
  incompleteStatus();
  incomplete.state.incomplete = true;
  TestValidator.equals(
    "an incomplete snapshot runs the gate at every boundary",
    runsPerCall(incomplete, incompleteStatus, 2).runs,
    [1, 1],
  );

  const undeclared: ReturnType<typeof createSourceStatusWorld> = createSourceStatusWorld();
  undeclared.state.undeclaredModules = ["lint.config.ts"];
  const undeclaredStatus: () => IAutoMovieBuildProjectOutput = undeclared.status();
  const withUndeclared: number[] = runsPerCall(undeclared, undeclaredStatus, 3).runs;
  const undeclaredReads: number = undeclared.counts.acquisitions;
  undeclared.state.undeclaredModules = [];
  TestValidator.equals(
    "an executed module outside the fingerprinted content blocks reuse",
    {
      withUndeclared,
      undeclaredReads,
      declared: runsPerCall(undeclared, undeclaredStatus, 2).runs,
    },
    { withUndeclared: [1, 1, 1], undeclaredReads: 3, declared: [1, 0] },
  );
}
