import { TestValidator } from "@nestia/e2e";

import { deriveBodyObservationSet } from "../../../scripts/body-review/deriveBodyObservationSet";

type Joint = Parameters<typeof deriveBodyObservationSet>[0]["joints"][number];

const range = (min: number, max: number) => ({ min, max });
const joint = (
  bone: string,
  parent: string | null,
  constraint: Joint["constraint"],
  extra: Partial<Joint> = {},
): Joint => ({ bone, parent, constraint, ...extra }) as unknown as Joint;
const constraint = (
  flexion: ReturnType<typeof range> | null,
  abduction: ReturnType<typeof range> | null = null,
  swingDeg?: number,
): Joint["constraint"] =>
  ({ flexion, abduction, twist: null, swingDeg }) as Joint["constraint"];

/**
 * The observation set is derived from the owners of parts, joints and whole
 * states, and only admitted extremes are drawn.
 *
 * Scenarios:
 * 1. Each displayed part gets one unit: eight views by two passes of it alone
 *    plus four assembled beauty frames, in the neutral state.
 * 2. A joint unit is named `parent>child` and holds the neutral state and, for
 *    each mobile axis of the child, its minimum and maximum, each from the six
 *    horizon views as beauty and normal. Where the parent moves on the same
 *    axis, both bones at the same extreme together also appear.
 * 3. Negative twins: the root has no unit, a fixed axis (min equals max) and a
 *    null axis add no state, and a parent that does not move on the axis adds
 *    no `together` state.
 * 4. An extreme the swing cone does not admit is excluded and listed with the
 *    reason, while the other end of the same axis stays; an extreme exactly on
 *    the cone stays.
 * 5. An upper arm, whose generic axes are held, is taken at each envelope
 *    knot's maximum elevation and at both axial-rotation limits, as shoulder
 *    goals, and adds no joint row.
 * 6. The whole unit comes last, from every supplied state, with the pole view
 *    and beauty and clay passes.
 * 7. The derivation is deterministic, does not change its input, and gives a
 *    new part exactly one new unit and nothing else.
 */
export const test_body_observation_set = (): void => {
  const joints: Joint[] = [
    joint("hips", null, null),
    joint("spine", "hips", constraint(range(-20, 40))),
    joint("chest", "spine", constraint(range(-10, 30))),
    joint("leftLowerLeg", "hips", constraint(range(0, 150), null, 120)),
    joint("leftFoot", "leftLowerLeg", constraint(range(-30, 30), range(5, 5))),
    joint("leftUpperArm", "chest", null, {
      shoulder: {
        coordinates: "thorax-tt",
        neutral: { plane: 0, elevation: 30, axialRotation: 0 },
        range: {
          elevation: range(0, 180),
          axialRotation: range(-60, 80),
          envelope: [
            [-90, 100],
            [0, 170],
            [90, 180],
          ],
        },
      } as Joint["shoulder"],
    }),
  ];
  const wholeStates = {
    neutral: { shape: {}, pose: [] },
    sitting: { shape: {}, pose: [] },
  };
  const before = JSON.stringify({ joints, wholeStates });
  const units = deriveBodyObservationSet({
    parts: ["Human/skin"],
    joints,
    wholeStates,
  });
  const find = (id: string) => units.find((unit) => unit.id === id)!;

  const part = find("Human/skin");
  TestValidator.equals("part unit", part.unit, "part");
  TestValidator.equals("part frames", part.frames.length, 8 * 2 + 4);
  TestValidator.equals(
    "isolated frames isolate the part",
    part.frames.filter((frame) => frame.isolate !== null).length,
    16,
  );
  TestValidator.equals(
    "assembled frames are beauty only",
    part.frames
      .filter((frame) => frame.isolate === null)
      .every((frame) => frame.pass === "beauty"),
    true,
  );

  const chest = find("spine>chest");
  TestValidator.equals(
    "chest states",
    [...new Set(chest.frames.map((frame) => frame.state))],
    [
      "neutral",
      "chest-flexion-min",
      "spine-chest-flexion-min-together",
      "chest-flexion-max",
      "spine-chest-flexion-max-together",
    ],
  );
  TestValidator.equals(
    "six views by two passes each",
    chest.frames.length,
    5 * 12,
  );
  const together = chest.frames.find(
    (frame) => frame.state === "spine-chest-flexion-max-together",
  )!;
  TestValidator.equals("together document", together.document.pose, [
    { bone: "spine", flexion: 40, abduction: null, twist: null },
    { bone: "chest", flexion: 30, abduction: null, twist: null },
  ]);

  TestValidator.predicate(
    "no unit for the root",
    units.every((unit) => !unit.id.endsWith(">hips") && unit.id !== "hips"),
  );
  const foot = find("leftLowerLeg>leftFoot");
  TestValidator.equals(
    "fixed abduction adds nothing; the lower leg has no flexion partner",
    [...new Set(foot.frames.map((frame) => frame.state))].filter((state) =>
      state.includes("abduction"),
    ),
    [],
  );
  TestValidator.predicate(
    "the spine unit has no together state, its parent is the root",
    !find("hips>spine").frames.some((frame) =>
      frame.state.includes("together"),
    ),
  );

  const leg = find("hips>leftLowerLeg");
  TestValidator.equals(
    "cone excludes the 150 degree end",
    leg.excluded.length,
    1,
  );
  TestValidator.predicate(
    "reason names the cone",
    leg.excluded[0].reason.includes("120") &&
      leg.excluded[0].state === "leftLowerLeg-flexion-max",
  );
  TestValidator.predicate(
    "the other end stays",
    leg.frames.some((frame) => frame.state === "leftLowerLeg-flexion-min"),
  );
  const onCone = deriveBodyObservationSet({
    parts: [],
    joints: [
      joint("hips", null, null),
      joint("knee", "hips", constraint(range(0, 120), null, 120)),
    ],
    wholeStates: {},
  }).find((unit) => unit.id === "hips>knee")!;
  TestValidator.equals("an extreme on the cone stays", onCone.excluded, []);

  const arm = find("chest>leftUpperArm");
  TestValidator.equals(
    "shoulder states",
    [...new Set(arm.frames.map((frame) => frame.state))],
    [
      "neutral",
      "leftUpperArm-plane--90-elevation-max",
      "leftUpperArm-plane-0-elevation-max",
      "leftUpperArm-plane-90-elevation-max",
      "leftUpperArm-axial-min",
      "leftUpperArm-axial-max",
    ],
  );
  const overhead = arm.frames.find(
    (frame) => frame.state === "leftUpperArm-plane-0-elevation-max",
  )!;
  TestValidator.equals(
    "goal, no joint row",
    [overhead.document.pose, overhead.document.shoulders],
    [
      [],
      [{ bone: "leftUpperArm", plane: 0, elevation: 170, axialRotation: 0 }],
    ],
  );

  const whole = units[units.length - 1];
  TestValidator.equals(
    "whole is last",
    [whole.unit, whole.id],
    ["whole", "whole"],
  );
  TestValidator.equals("whole frames", whole.frames.length, 2 * 7 * 2);
  TestValidator.predicate(
    "whole has the pole and clay",
    whole.frames.some((frame) => frame.view === "top") &&
      whole.frames.some((frame) => frame.pass === "clay"),
  );

  TestValidator.equals(
    "input unchanged",
    JSON.stringify({ joints, wholeStates }),
    before,
  );
  TestValidator.equals(
    "deterministic",
    JSON.stringify(
      deriveBodyObservationSet({ parts: ["Human/skin"], joints, wholeStates }),
    ),
    JSON.stringify(units),
  );
  const grown = deriveBodyObservationSet({
    parts: ["Human/skin", "Human/hair"],
    joints,
    wholeStates,
  });
  TestValidator.equals(
    "a new part is one new unit",
    grown.length,
    units.length + 1,
  );
  TestValidator.equals(
    "the other units are the same",
    JSON.stringify(grown.filter((unit) => unit.id !== "Human/hair")),
    JSON.stringify(units),
  );
};
