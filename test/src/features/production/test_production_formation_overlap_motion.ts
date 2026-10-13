import { TestValidator } from "@nestia/e2e";

import { createFormationOverlapScenario } from "../internal/createFormationOverlapScenario";
import { namedFacts } from "../internal/predicates";

/**
 * Cue motion uses every original temporal sample, spacing update and removed-member input.
 *
 * Scenarios:
 * 1. Find a crossing inside its original cue interval.
 * 2. Refuse closed intervals, accept held intervals and ignore another unit?s cue.
 * 3. Exclude the member removed by its full original slot cue.
 */
export const test_production_formation_overlap_motion = (): void => {
  const scenario = createFormationOverlapScenario();
  const { post, row, carry, close, remove, judge, codes, sampledTime } = scenario;
  const wide = post({ id: "post", radius: 0.4 });

  // One unit stands at the origin; the other is staged five metres out and
  // carried ten metres across it. Both ends of that cue are clear, the place it
  // waits before the cue begins is clear, and the middle is not.
  const passed = judge({
    models: [wide],
    formations: [
      row({ id: "still", count: 1, spacing: 1 }),
      row({
        id: "walker",
        count: 1,
        spacing: 1,
        anchor: { x: -5, y: 0, z: 0 },
      }),
    ],
    formationMotions: [carry({ formation: "walker", from: 0, to: 10 })],
  });
  const passedAt = Number(sampledTime(passed));
  TestValidator.equals(
    "two units passing through one another are refused inside the cue that carries them",
    namedFacts([
      ["code", () => passed[0]?.code === "engine-validation-failed"],
      ["one", () => passed.length === 1],
      ["afterStart", () => passedAt > 1],
      ["beforeEnd", () => passedAt < 3],
    ]),
    { code: true, one: true, afterStart: true, beforeEnd: true },
  );

  TestValidator.equals(
    "a cue that closes a unit's own intervals is judged by what it closes them to",
    namedFacts([
      [
        "closedIsRefused",
        () =>
          codes({
            models: [wide],
            formations: [row({ spacing: 1 })],
            formationMotions: [close({ formation: "crowd", scale: 0.2 })],
          }).length === 1,
      ],
      [
        "heldIsAccepted",
        () =>
          codes({
            models: [wide],
            formations: [row({ spacing: 1 })],
            formationMotions: [close({ formation: "crowd", scale: 0.9 })],
          }).length === 0,
      ],
      [
        "anotherUnitsCueDoesNotClose",
        () =>
          codes({
            models: [wide],
            formations: [row({ spacing: 1 })],
            formationMotions: [close({ formation: "elsewhere", scale: 0.2 })],
          }).length === 0,
      ],
    ]),
    {
      closedIsRefused: true,
      heldIsAccepted: true,
      anotherUnitsCueDoesNotClose: true,
    },
  );

  TestValidator.equals(
    "a member the shot has taken out is not measured",
    codes({
      models: [wide],
      formations: [row({ count: 2, spacing: 0.5 })],
      formationSlotMotions: [remove({ formation: "crowd", slots: [1] })],
    }),
    [],
  );


};
