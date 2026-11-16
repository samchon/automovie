import { HumanRefusal } from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanRefusal } from "../internal/motionHumanRefusal";
import { throwsError } from "../internal/throwsError";

/**
 * A refusal assertion distinguishes a normal return, a JavaScript error and
 * the structured, located repair contract a motion author receives.
 *
 * Scenarios:
 * 1. Normal returns are false for both strict observers; a generic Error is
 *    accepted only by the generic Error observer with its required fragment.
 * 2. A located parameter refusal on a jump's turns is accepted. Changing its
 *    kind, axis, act, performer, instance, reason or repair is rejected.
 * 3. A valid refusal on the wrong action is not the requested refusal.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Lists the positive and negative controls and why the two observers differ.
 * @evidence contracts/development/testing.md#behavioral-verification Invokes the actual assertion helpers through owned callbacks and inspects their booleans; accepting a normal return or a generic error as the requested grammar refusal fails.
 * @evidence contracts/development/testing.md#independent-expectations The callbacks either return normally or throw an explicitly constructed Error/HumanRefusal with the declared fields; expected booleans follow the refusal contract, without executing the helper's predicate as an oracle.
 * @evidence contracts/development/testing.md#distinguishing-cases Covers normal and generic returns, matching/missing message fragments, every required structured field, an unlocated refusal and another well-formed action.
 * @evidence contracts/development/testing.md#execution-ownership One synchronous unit owns all callbacks and exception data; no methods, globals, bodies or motion producers are replaced.
 */
export function test_human_motion_refusal_observation(): void {
  const expected: { kind: HumanRefusal.Kind; axis: string; act: string } = {
    kind: "parameter",
    axis: "turns",
    act: "jump",
  };
  const facts: HumanRefusal.IProps = {
    ...expected,
    performer: "a",
    instance: 2,
    value: 20,
    feasible: { kind: "range", minimum: 0, maximum: 1, unit: "turns" },
    reason: "twenty turns exceed the available angular momentum",
    fix: "request one turn",
  };
  const throws: (props: HumanRefusal.IProps) => () => never =
    (props: HumanRefusal.IProps): (() => never) =>
    (): never => {
      throw new HumanRefusal(props);
    };
  TestValidator.equals(
    "normal return is no Error",
    throwsError((): number => 7),
    false,
  );
  TestValidator.equals(
    "normal return is no refusal",
    motionHumanRefusal((): number => 7, expected),
    false,
  );
  TestValidator.equals(
    "generic Error observer reads its message",
    throwsError((): never => {
      throw new Error("owned failure");
    }, "owned"),
    true,
  );
  TestValidator.equals(
    "generic Error with wrong message is rejected",
    throwsError((): never => {
      throw new Error("owned failure");
    }, "absent"),
    false,
  );
  TestValidator.equals(
    "generic Error is no structured refusal",
    motionHumanRefusal((): never => {
      throw new Error("turns");
    }, expected),
    false,
  );
  TestValidator.equals(
    "located structured refusal",
    motionHumanRefusal(throws(facts), expected),
    true,
  );
  const wrong: readonly Partial<HumanRefusal.IProps>[] = [
    { kind: "reach" },
    { axis: "target" },
    { act: "walk" },
    { performer: "b" },
    { instance: 0 },
    { instance: 1.5 },
    { reason: " " },
    { reason: "undefined target" },
    { fix: " " },
    { fix: "change undefined" },
  ];
  for (const change of wrong)
    TestValidator.equals(
      `wrong refusal field ${Object.keys(change)[0]}`,
      motionHumanRefusal(throws({ ...facts, ...change }), expected),
      false,
    );
}
