import { createHumanFaceControlMap } from "@automovie/human";
import { TestValidator } from "@nestia/e2e";

import { humanFaceControlMapFixture } from "../internal/humanFaceControlMapFixture";
import { throwsError } from "../internal/predicates";

/**
 * A simpler interface must refuse domain loss instead of destroying fine detail.
 *
 * Scenarios:
 * 1. Basis mismatch, ambiguous membership and blank group metadata refuse at preparation.
 * 2. Nonfinite and invalid fine domains refuse; valid positive-only domains remain usable.
 * 3. Unknown, wrong-kind and out-of-range fine inputs refuse before projection.
 * 4. Adjacent simple-domain failures preserve the origin; exact bounds and empty maps work.
 */
export const test_subject_human_control_map_refusal = (): void => {
  type Fixture = ReturnType<typeof humanFaceControlMapFixture>;
  const defects: ((props: Fixture) => void)[] = [
    (p) => {
      Object.assign(p.map, { unexpected: 1 });
    },
    (p) => {
      p.map.basis = "another";
    },
    (p) => {
      p.map.groups[0].id = " ";
    },
    (p) => {
      p.map.groups[0].label = " ";
    },
    (p) => {
      p.map.groups[0].description = " ";
    },
    (p) => {
      p.map.groups[1].id = "pair";
    },
    (p) => {
      p.map.groups[0].channels = [];
    },
    (p) => {
      p.map.groups[0].channels = ["missing"];
    },
    (p) => {
      p.map.groups[0].channels = ["left", "left"];
    },
    (p) => {
      p.map.groups[1].channels = ["right"];
    },
    (p) => {
      p.basis.channels[0].kind = "expression";
    },
    (p) => {
      p.basis.channels[0].minimum = NaN;
    },
    (p) => {
      p.basis.channels[0].maximum = Infinity;
    },
    (p) => {
      p.basis.channels[0].minimum = 0.001;
    },
    (p) => {
      p.basis.channels[0].maximum = 0;
    },
  ];
  for (const defect of defects) {
    const props = humanFaceControlMapFixture();
    defect(props);
    TestValidator.predicate(
      "map domain refuses",
      throwsError(() => createHumanFaceControlMap(props)),
    );
  }
  const project = createHumanFaceControlMap(humanFaceControlMapFixture());
  const invalidShapes: Record<string, number>[] = [
    { missing: 0 },
    { left: NaN },
    { left: -2.001 },
    { left: 4.001 },
    { positive: -0.001 },
  ];
  for (const shape of invalidShapes)
    TestValidator.predicate(
      "fine input refuses",
      throwsError(() => project(shape)),
    );
  const origin = { left: -1, right: 1.5 };
  const state = project(origin);
  const invalidValues: Record<string, number>[] = [
    { missing: 0 },
    { pair: Infinity },
    { pair: -0.375001 },
    { pair: 0.375001 },
    { one: -0.001 },
    { one: 1.001 },
  ];
  for (const values of invalidValues)
    TestValidator.predicate(
      "detail boundary refuses",
      throwsError(() => state.resolve(values)),
    );
  TestValidator.equals(
    "failed edits leave origin intact",
    state.resolve({}),
    origin,
  );
  TestValidator.equals(
    "nonnegative lower boundary",
    state.resolve({ one: 0 }),
    origin,
  );
  TestValidator.equals(
    "nonnegative upper boundary",
    state.resolve({ one: 1 }).positive,
    3,
  );
  const empty = humanFaceControlMapFixture();
  empty.map.groups = [];
  const bare = createHumanFaceControlMap(empty)(origin);
  TestValidator.equals("empty map", bare.controls, []);
  TestValidator.equals("unmapped detail", bare.resolve({}), origin);
  const fixedShape = { left: -2, right: 2 };
  const fixed = project(fixedShape);
  TestValidator.equals(
    "opposite limits fix the mean",
    fixed.controls[0].minimum,
    0,
  );
  TestValidator.equals(
    "no detail-preserving room remains",
    fixed.controls[0].maximum,
    0,
  );
  TestValidator.equals(
    "fixed axis still replays",
    fixed.resolve({ pair: 0 }),
    fixedShape,
  );
  for (const value of [-0.0001, 0.0001])
    TestValidator.predicate(
      "fixed detail cannot be erased",
      throwsError(() => fixed.resolve({ pair: value })),
    );
};
