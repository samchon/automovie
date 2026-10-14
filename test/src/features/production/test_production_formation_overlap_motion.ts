import { TestValidator } from "@nestia/e2e";

import { createFormationOverlapScenario } from "../internal/createFormationOverlapScenario";
import { namedFacts } from "../internal/predicates";

/**
 * Cue motion uses every original temporal sample, spacing update and removed-member input.
 *
 * Scenarios:
 * 1. Find a crossing inside its original cue interval.
 * 2. Refuse closed intervals, accept held intervals and ignore another unit's cue.
 * 3. Exclude the member removed by its full original slot cue.
 *
 * @evidence contracts/testing.md#behavioral-verification Runs the actual overlap gate with crossing, spacing and member-presence cues, checking an interior-time finding, close/hold/foreign-unit outcomes and omission of a removed member; catches rest-only or unaddressed cue application.
 * @evidence contracts/testing.md#independent-expectations A unit starting x=-5 and translating0 to10 crosses the stationary origin inside seconds1..3; shrinking one-metre spacing to0.2 overlaps positive post cores while0.9 clears. A false-present slot contributes no drawn member.
 * @evidence contracts/testing.md#distinguishing-cases Crossing versus clear endpoints, compressed versus held spacing, another unit's cue and removed versus present members distinguish temporal/address/presence branches; finite sample timing can miss narrower events and is not continuous collision proof.
 * @evidence contracts/testing.md#execution-ownership The discoverable test_production_formation_overlap_motion directly runs synchronous CPU placement and gate semantics through existing fixture cues, without a playback host, browser or pixel observation.
 */
export function test_production_formation_overlap_motion(): void {
  const scenario: ReturnType<typeof createFormationOverlapScenario> = createFormationOverlapScenario();
  const { post, row, carry, close, remove, judge, codes, sampledTime }: typeof scenario = scenario;
  const wide: ReturnType<typeof post> = post({ id: "post", radius: 0.4 });

  // One unit stands at the origin; the other is staged five metres out and
  // carried ten metres across it. Both ends of that cue are clear, the place it
  // waits before the cue begins is clear, and the middle is not.
  const passed: ReturnType<typeof judge> = judge({
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
  const passedAt: number = Number(sampledTime(passed));
  TestValidator.equals(
    "two units passing through one another are refused inside the cue that carries them",
    namedFacts([
      ["code", (): boolean => passed[0]?.code === "engine-validation-failed"],
      ["one", (): boolean => passed.length === 1],
      ["afterStart", (): boolean => passedAt > 1],
      ["beforeEnd", (): boolean => passedAt < 3],
    ]),
    { code: true, one: true, afterStart: true, beforeEnd: true },
  );

  TestValidator.equals(
    "a cue that closes a unit's own intervals is judged by what it closes them to",
    namedFacts([
      [
        "closedIsRefused",
        (): boolean =>
          codes({
            models: [wide],
            formations: [row({ spacing: 1 })],
            formationMotions: [close({ formation: "crowd", scale: 0.2 })],
          }).length === 1,
      ],
      [
        "heldIsAccepted",
        (): boolean =>
          codes({
            models: [wide],
            formations: [row({ spacing: 1 })],
            formationMotions: [close({ formation: "crowd", scale: 0.9 })],
          }).length === 0,
      ],
      [
        "anotherUnitsCueDoesNotClose",
        (): boolean =>
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


}
