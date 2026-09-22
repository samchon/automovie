import { createHumanFaceControlMap } from "@automovie/human";
import { TestValidator } from "@nestia/e2e";

import { humanFaceControlMapFixture } from "../internal/humanFaceControlMapFixture";
import { nclose, throwsError } from "../internal/predicates";

/**
 * A boundary member must not make its own simple origin inadmissible through rounding.
 *
 * Scenarios:
 * 1. One of three normalized members at +1 has mean 1/3; replay retains exact omissions.
 * 2. The corresponding -1 example admits -1/3, with the opposite shifted bound intact.
 * 3. An outward edit still refuses, while an inward edit keeps all member differences.
 */
export const test_subject_human_control_map_boundary = (): void => {
  const props = humanFaceControlMapFixture();
  props.map.groups = [
    { ...props.map.groups[0], channels: ["left", "right", "unlisted"] },
  ];
  const project = createHumanFaceControlMap(props);
  for (const sign of [-1, 1]) {
    const origin = { left: sign < 0 ? -2 : 4 };
    const projected = project(origin);
    const control = projected.controls[0];
    TestValidator.predicate(
      "three-member mean",
      nclose(control.value, sign / 3),
    );
    TestValidator.predicate(
      "origin is inside its displayed domain",
      control.minimum <= control.value && control.value <= control.maximum,
    );
    TestValidator.equals(
      "exact replay keeps omitted members absent",
      projected.resolve({ pair: control.value }),
      origin,
    );
    TestValidator.predicate(
      "outward detail loss still refuses",
      throwsError(() =>
        projected.resolve({ pair: control.value + sign * 0.001 }),
      ),
    );
    const lowered = projected.resolve({ pair: 0 });
    TestValidator.predicate(
      "boundary member moves inward",
      nclose(lowered.left, sign < 0 ? -4 / 3 : 8 / 3),
    );
    TestValidator.predicate(
      "second member retains residual",
      nclose(lowered.right, sign < 0 ? 2 / 3 : -4 / 3),
    );
    TestValidator.predicate(
      "third member retains residual",
      nclose(lowered.unlisted, -sign / 3),
    );
  }
};
