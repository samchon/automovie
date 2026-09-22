import { createHumanFaceControlMap } from "@automovie/human";
import { TestValidator } from "@nestia/e2e";

import { humanFaceControlMapFixture } from "../internal/humanFaceControlMapFixture";
import { nclose } from "../internal/predicates";

/**
 * Easy coordinates preserve the canonical detail that their averages omit.
 *
 * Scenarios:
 * 1. Unequal signed endpoint scales lower through normalized mean/residual coordinates.
 * 2. Both legal bounds retain asymmetry, and unlisted shape values survive.
 * 3. Every update starts from the captured origin; no-op restores omissions exactly.
 * 4. Caller mutation, output mutation and a prototype-named channel cannot alter replay.
 */
export const test_subject_human_control_map = (): void => {
  const props = humanFaceControlMapFixture();
  const project = createHumanFaceControlMap(props);
  const origin = { left: -1, right: 1.5, unlisted: 0.375 };
  const state = project(origin);
  TestValidator.predicate("mean", nclose(state.controls[0].value, 0.125));
  TestValidator.predicate(
    "detail-preserving lower bound",
    nclose(state.controls[0].minimum, -0.375),
  );
  TestValidator.predicate(
    "detail-preserving upper bound",
    nclose(state.controls[0].maximum, 0.375),
  );
  for (const [mean, left, right] of [
    [0.25, -0.75, 1.75],
    [-0.375, -2, 0.5],
    [0.375, -0.5, 2],
  ]) {
    const shape = state.resolve({ pair: mean });
    TestValidator.equals(
      "canonical key population",
      Object.keys(shape).sort((a, b) => a.localeCompare(b)),
      ["left", "right", "unlisted"],
    );
    TestValidator.predicate(
      "lowered left at " + mean,
      nclose(shape.left, left),
    );
    TestValidator.predicate(
      "lowered right at " + mean,
      nclose(shape.right, right),
    );
    TestValidator.equals(
      "unlisted value is copied exactly",
      shape.unlisted,
      origin.unlisted,
    );
  }
  TestValidator.predicate(
    "nonnegative channel",
    nclose(state.resolve({ one: 0.5 }).positive, 1.5),
  );
  for (let i = 0; i < 100; i++)
    state.resolve({ pair: i % 2 === 0 ? -0.375 : 0.375 });
  TestValidator.equals(
    "origin recovery is exact",
    state.resolve({ pair: 0.125, one: 0 }),
    origin,
  );
  TestValidator.equals(
    "empty resolve preserves omissions",
    state.resolve({}),
    origin,
  );
  const later = project(state.resolve({ pair: 0.25 }));
  TestValidator.predicate(
    "reprojected mean",
    nclose(later.controls[0].value, 0.25),
  );
  const recovered = later.resolve({ pair: 0.125 });
  for (const [id, value] of Object.entries(origin))
    TestValidator.predicate(
      "detail survives reprojecting: " + id,
      nclose(recovered[id], value),
    );
  origin.left = 4;
  props.basis.channels[0].minimum = -200;
  props.map.groups[0].channels.length = 0;
  state.controls[0].value = 100;
  const output = state.resolve({ pair: 0.25 });
  output.right = 100;
  TestValidator.predicate(
    "owned immutable origin and map",
    nclose(state.resolve({ pair: 0.25 }).left, -0.75),
  );
  TestValidator.predicate(
    "owned output",
    nclose(state.resolve({ pair: 0.25 }).right, 1.75),
  );
  TestValidator.equals("negative decode", project({}).resolve({ pair: -0.5 }), {
    left: -1,
    right: -2,
  });
  TestValidator.equals("positive decode", project({}).resolve({ pair: 0.5 }), {
    left: 2,
    right: 1,
  });
  const named = humanFaceControlMapFixture();
  named.basis.channels[0].id = "__proto__";
  named.map.groups[0].channels[0] = "__proto__";
  const resolved = createHumanFaceControlMap(named)({}).resolve({ pair: 0.5 });
  TestValidator.equals(
    "prototype spelling remains a data coordinate",
    Object.getOwnPropertyDescriptor(resolved, "__proto__")?.value,
    2,
  );
};
