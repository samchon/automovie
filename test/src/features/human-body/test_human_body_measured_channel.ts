import { solveHumanBodyMeasuredChannel } from "@automovie/human";
import { TestValidator } from "@nestia/e2e";

import { humanBodyBasisFixture } from "../internal/humanBodyBasisFixture";
import { nclose, throwsError } from "../internal/predicates";

/**
 * A detailed height target is read from the same analytic skin the body
 * builder evaluates, while an unrelated breadth edit remains fixed.
 *
 * Scenarios:
 * 1. A box from floor to clip ring at 2 m, whose authored top-face endpoint
 *    adds 0.5 m at weight one, solves a 2.25 m target to weight one half and
 *    preserves the existing width control without mutating the document.
 * 2. An unmeasured channel, an absent channel, nonfinite target and target
 *    beyond the basis's height reach refuse without assigning another shape.
 */
export const test_human_body_measured_channel = (): void => {
  const { basis } = humanBodyBasisFixture();
  basis.channels.push({
    id: "macroHeight",
    kind: "shape",
    group: "macro",
    mirror: null,
    minimum: 0,
    maximum: 1,
    positive: "raised",
    negative: null,
  });
  const source = { width: 0.2 };
  const input = {
    basis,
    shape: source,
    channel: "macroHeight",
    targetMetres: 2.25,
  };
  const result = solveHumanBodyMeasuredChannel(input);
  TestValidator.predicate(
    "measured height is solved without changing width",
    nclose(result.shape.macroHeight, 0.5, 0.0001) &&
      nclose(result.actualMetres, 2.25, 0.00005) &&
      result.shape.width === 0.2 &&
      source !== result.shape &&
      (source as Record<string, number>).macroHeight === undefined,
  );
  TestValidator.predicate(
    "unmeasured and absent channels refuse",
    throwsError(
      () => solveHumanBodyMeasuredChannel({ ...input, channel: "width" }),
      "named measured",
    ) &&
      throwsError(
        () => solveHumanBodyMeasuredChannel({ ...input, channel: "absent" }),
        "named measured",
      ),
  );
  TestValidator.predicate(
    "invalid and unreachable metric targets refuse",
    throwsError(
      () => solveHumanBodyMeasuredChannel({ ...input, targetMetres: Infinity }),
      "finite",
    ) &&
      throwsError(
        () => solveHumanBodyMeasuredChannel({ ...input, targetMetres: 3 }),
        "reaches",
      ),
  );
};
