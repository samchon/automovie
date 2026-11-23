import { HumanPhysics } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

/**
 * A phase admits physical observation on its translated action-local interval.
 *
 * Scenarios:
 * 1. Evaluate the translated bounds and their neighbouring samples.
 * 2. Evaluate the same interval without the law's physical request.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Documents action-local phase boundaries, their translated film times and the expected quiet-phase result.
 * @evidence contracts/development/testing.md#behavioral-verification Observes the central judging gate for the exact same quiet span and physical phase.
 * @evidence contracts/development/testing.md#independent-expectations An action starting at film second 4 translates its local seconds 1 and 2 to film seconds 5 and 6.
 * @evidence contracts/development/testing.md#distinguishing-cases Checks both endpoints, their nearest test neighbours and the same authored phase without a physical law.
 * @evidence contracts/development/testing.md#execution-ownership One metadata-only test, without a body or playback.
 */
export function test_motion_mechanism_root_phase_admission(): void {
  const quiet: HumanPhysics.ISpan = {
    name: "phase",
    start: 4,
    entryTime: 4,
    end: 8,
    plan: { duration: 4, contacts: [], physicalWindow: { from: 1, to: 2 } },
  };
  const driven: HumanPhysics.ISpan = { ...quiet, law: { physical: true } };
  const seconds: readonly number[] = [4.75, 5, 5.5, 6, 6.25];
  TestValidator.equals(
    "only the driven phase is judged at its film times",
    seconds.map((second) => HumanPhysics.judged(driven, second)),
    [false, true, true, true, false],
  );
  TestValidator.predicate(
    "declaring a phase does not start physics without a physical law",
    seconds.every((second) => !HumanPhysics.judged(quiet, second)),
  );
}
