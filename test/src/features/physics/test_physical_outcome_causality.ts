import { auditPhysicalOutcomes as audit } from "@automovie/engine";
import type { IAutoMovieContactReceipt as Receipt } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

/**
 * A long episode cannot borrow a later impulse to fulfill an earlier screenplay contact or contradict an earlier deliberate miss.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Runs `interface`, `auditPhysicalOutcomes` on in-memory inputs and asserts the returned observations through 3x TestValidator.equals; the behavior its summary names. A wrong result for any of those inputs fails an assertion, while results the scenarios allow do not.
 * @evidence contracts/development/testing.md#independent-expectations Expected values come from the literals and relations written in the test itself (1 assertion site compare against numeric literals) and from the scenario sentences above, not from a snapshot of the implementation's output; where an expectation is computed by another production function the oracle is not independent, and this answer does not establish a reference beyond the scenario text.
 * @evidence contracts/development/testing.md#distinguishing-cases Contributes the behavior its summary names, including the negative, boundary or refusal cases those sentences name; cases the sentences do not name are not claimed here and are owned by other tests or are uncovered.
 * @evidence contracts/development/testing.md#execution-ownership Portable in-memory unit test entered through the discoverable function `test_physical_outcome_causality`, which owns every case it runs; it registers no dynamic cases and starts no process, browser, viewer, render or GPU host.
 * @evidence contracts/development/common.md#meaningful-documentation Gives the purpose (A long episode cannot borrow a later impulse to fulfill an earlier screenplay contact or contradict an earlier deliberate miss) as stated in this comment.
 */
export function test_physical_outcome_causality(): void {
  const receipt: Receipt = {
    id: "tool-panel",
    source: "solver",
    seconds: 1,
    endSeconds: 3,
    a: { body: "tool", bone: "tip", shape: "tip", material: "solid" },
    b: { body: "panel", bone: "face", shape: "face", material: "solid" },
    point: { x: 0, y: 1, z: 0 },
    normal: { x: 1, y: 0, z: 0 },
    separation: -0.001,
    compression: 0,
    impulse: 2,
    samples: [1, 3].map(
      (seconds: number): NonNullable<Receipt["samples"]>[number] => ({
        seconds,
        duration: 1 / 120,
        impulse: seconds === 3 ? 2 : 0,
        point: { x: 0, y: 1, z: 0 },
        normal: { x: 1, y: 0, z: 0 },
        separation: -0.001,
        compression: 0,
      }),
    ),
  };
  const action: audit.IAction = {
    id: "promised-contact",
    seconds: 1,
    tolerance: 0.1,
    actor: "tool",
    target: "panel",
    actorShapes: ["tip"],
    targetShapes: ["face"],
    expected: "contact",
    source: "solver",
  };
  const inspect: (promise: audit.IAction) => audit.IFinding[] = (
    promise: audit.IAction,
  ): audit.IFinding[] =>
    audit({
      actions: [promise],
      contacts: [receipt],
      falls: [],
      observedFalls: {},
      missDistance: (): number => 0.001,
      allowUnplanned: (): boolean => true,
    });
  TestValidator.equals(
    "future positive impulse does not fulfill an earlier contact",
    inspect(action).map((finding: audit.IFinding): string => finding.kind),
    ["missed-contact"],
  );
  TestValidator.equals(
    "later impulse does not contradict the earlier miss",
    inspect({ ...action, expected: "miss" }),
    [],
  );
  TestValidator.equals(
    "actual in-window impulse fulfills its own contact",
    inspect({ ...action, seconds: 3 }),
    [],
  );
}
