import {
  measureHumanBodyBasisChannels,
  measureHumanBodySimpleShape,
  solveHumanBodyMeasuredChannel,
} from "@automovie/human";
import { TestValidator } from "@nestia/e2e";

import { humanBodyBasisFixture } from "../internal/humanBodyBasisFixture";
import { throwsError } from "../internal/predicates";

/**
 * A body channel gains a measurement only from an authored own rule.
 *
 * Scenarios:
 * 1. A basis channel named after an inherited Object property is omitted by
 *    the measured-only report and refused by both detailed and simple input.
 * 2. A real height rule remains measurable, so the ownership check does not
 *    remove authored anatomical controls.
 */
export const test_human_body_measurement_rule_lookup = (): void => {
  const { basis } = humanBodyBasisFixture();
  const original = basis.channels[0];
  for (const id of ["constructor", "toString", "__proto__"]) {
    basis.channels[0] = { ...original, id };
    TestValidator.equals(
      `${id} has no measured control`,
      measureHumanBodyBasisChannels(basis, { measuredOnly: true }),
      [],
    );
    TestValidator.predicate(
      `${id} cannot be solved as a measurement`,
      throwsError(
        () =>
          solveHumanBodyMeasuredChannel({
            basis,
            shape: {},
            channel: id,
            targetMetres: 1,
          }),
        "named measured",
      ),
    );
    TestValidator.predicate(
      `${id} cannot be read by the simple tier`,
      throwsError(
        () => measureHumanBodySimpleShape.channel(basis, {}, id),
        "measurement rule",
      ),
    );
  }
  basis.channels[0] = { ...original, id: "macroHeight" };
  TestValidator.predicate(
    "authored height rule remains visible",
    measureHumanBodyBasisChannels(basis, { measuredOnly: true }).some(
      (channel) =>
        channel.id === "macroHeight" && channel.measurement?.kind === "height",
    ),
  );
};
