import {
  Quaternion,
  Vector3,
  resolveAutoMovieHumanoidSurfaces,
} from "@automovie/engine";
import {
  HUMAN_LEXICON,
  HumanHand,
  HumanRefusal,
  HumanVerdicts,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../internal/motionHumanBody";
import { motionHumanOverlayChannels } from "../internal/motionHumanOverlayChannels";
import { motionUpperPhrase } from "../internal/motionUpperPhrase";

/**
 * A person performs two actions at once on different parts of the body, read
 * on the average man: walking 2 m with and without the `read` task in the
 * right hand over the walk, the carrier's own channels are left alone, the
 * claimed arm comes up and is held with the trunk, the overlay comes in,
 * runs and goes out without a step in any joint's path, and a combination no
 * body could perform is refused with both claims named.
 *
 * Scenarios (`motionHumanOverlayChannels` states each with its bound):
 * 1. Every unclaimed joint centre of the film with the task (the pelvis, both
 *    legs and the free hand) is the plain walk's within a nanometre at every
 *    twelfth of a second.
 * 2. Every departing interval of the film with the task, over each of its
 *    eight windows (each running one frame into the next), resolves to a
 *    joint displacement within the continuity audit's 5 mm.
 * 3. The reading hand is up and ahead of the chest while the plain walk's
 *    hangs.
 * 4. The reading hand keeps within 3 cm of its distance to the chest.
 * 5. One hand for two tasks, a whole-body action over a walk and a task over
 *    an action that yields nothing are refused as `channel` refusals on `over`.
 * 6. A phone in one hand and a drink in the other plan.
 *
 * Scenarios:
 * 1. Check the named geometry and contact conditions above at the measured instants.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Performs the compositions through the public chain and reads displayed joint centres and thrown refusals; an overlay that disturbs the legs, the pelvis or the free arm, one that steps in or out of the swing, an arm left swinging, a hand that drifts from the trunk or a clash that plans fails.
 * @evidence contracts/development/testing.md#independent-expectations The unclaimed channels are compared with the same walk without the overlay, a metamorphic relation; the continuity bound is the audit's own, which holds for any human motion; where the reading hand is follows from what holding a sheet up is; the refusals follow from one hand doing one thing.
 * @evidence contracts/development/testing.md#distinguishing-cases Covers claimed and unclaimed channels, continuity, three refusal branches and compatible two-hand use on one actor.
 * @evidence contracts/development/testing.md#execution-ownership Prepares one polygon man and performs the plain walk and the walk with the task once each in memory, every scenario reading those two films, plus the refused and the two-hand compositions; the test program discovers every `test_` function, so `pnpm test` and the CI test job run it.
 * @evidence contracts/development/common.md#meaningful-documentation States the act, the films it performs and the 6 scenarios with their bounds.
 */
export function test_motion_posture_gait_overlay(): void {
  for (const family of ["emblem", "habit"] as const) {
    const rows = HUMAN_LEXICON[family]!;
    TestValidator.predicate(
      "registered upper-body family names are unique and plannable",
      rows.length > 0 &&
        new Set(rows.map((row) => row.name)).size === rows.length &&
        rows.every((row) => typeof row.plan === "function"),
    );
  }
  const body = motionHumanBody("f-small");
  const touch = motionUpperPhrase.perform(
    body,
    "handOnHip",
    { side: "left" },
    false,
    "left",
  );
  const action = touch.segments("a").at(-1)!;
  TestValidator.equals("placed public phrase", action.name, "handOnHip");
  const stroke = action.plan.events.find((e) => e.name === "stroke")!;
  const bones = touch.bones(
    "a",
    action.start + stroke.share * action.plan.duration,
  );
  const hip = body.surfaces.regions.hipLeft;
  const palm = HumanHand.frame(body, bones, "left", "palm", "flat").point;
  TestValidator.predicate(
    "left palm meets mirrored hip at the authored stroke",
    Vector3.length(
      Vector3.subtract(
        palm,
        resolveAutoMovieHumanoidSurfaces.place(hip, bones.get(hip.bone)!).point,
      ),
    ) <= HumanVerdicts.SKIN,
  );
  const complaints: string[] = [];
  const clock = (
    film: ReturnType<typeof motionUpperPhrase.perform>,
    event: string,
  ): number => {
    const placed = film.segments("a").at(-1)!;
    return (
      placed.start +
      placed.plan.events.find((e) => e.name === event)!.share *
        placed.plan.duration
    );
  };
  const events = ["ready", "strokeStart", "stroke", "strokeEnd", "relax"].map(
    (key) => clock(touch, key),
  );
  TestValidator.predicate(
    "phrase milestones progress in time",
    events.every((t, i) => i === 0 || t >= events[i - 1]!),
  );
  const wave = motionUpperPhrase.perform(body, "waveHand", {}, false);
  const shoulder = wave.bones("a", clock(wave, "stroke")).get("rightShoulder")!
    .worldPosition.y;
  const sweeping = [];
  for (
    let t = clock(wave, "strokeStart");
    t <= clock(wave, "strokeEnd");
    t += 1 / 24
  )
    sweeping.push(
      HumanHand.frame(body, wave.bones("a", t), "right", "palm", "flat").point,
    );
  const reach =
    body.measure.upperArm + body.measure.forearm + body.measure.hand;
  TestValidator.predicate(
    "raised wave traverses a twentieth of an arm",
    sweeping.every((p) => p.y > shoulder) &&
      Math.max(...sweeping.map((p) => p.x)) -
        Math.min(...sweeping.map((p) => p.x)) >
        reach / 20,
  );
  const clap = motionUpperPhrase.perform(body, "clapHands", {}, false);
  const meeting = clap.bones("a", clock(clap, "strokeStart"));
  const hands = (["left", "right"] as const).map(
    (side) => HumanHand.frame(body, meeting, side, "palm", "flat").point,
  );
  TestValidator.predicate(
    "two palms meet at clap onset",
    Vector3.length(Vector3.subtract(hands[0]!, hands[1]!)) <=
      HumanVerdicts.SKIN,
  );
  const drink = motionUpperPhrase.perform(
    body,
    "drinkFrom",
    { held: "stick" },
    true,
  );
  const sip = clock(drink, "stroke"),
    mouth = body.surfaces.regions.mouth;
  const lips = resolveAutoMovieHumanoidSurfaces.place(
    mouth,
    drink.bones("a", sip).get(mouth.bone)!,
  ).point;
  const vessel = drink.prop("stick", sip);
  const rim = Vector3.add(
    vessel.position,
    Quaternion.rotateVector(vessel.rotation, motionUpperPhrase.END),
  );
  TestValidator.predicate(
    "held point reaches lips",
    Vector3.length(Vector3.subtract(lips, rim)) <= HumanVerdicts.SKIN,
  );
  let refused = false;
  try {
    motionUpperPhrase
      .perform(body, "eatWith", { held: "stick", point: "spout" }, true)
      .segments("a");
  } catch (error) {
    refused = error instanceof HumanRefusal;
  }
  TestValidator.predicate(
    "missing prop affordance returns a physical refusal",
    refused,
  );
  motionHumanOverlayChannels.read("m-average", complaints, true);
  TestValidator.equals("an overlay and its carrier", complaints, []);
}
