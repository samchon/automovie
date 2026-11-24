import {
  Quaternion,
  Vector3,
  resolveAutoMovieHumanoidSurfaces,
} from "@automovie/engine";
import type { IAutoMovieMotionHumanChain } from "@automovie/interface";
import {
  AutoMovieMotionHumanSeat,
  HumanChain,
  HumanPerformance,
  HumanRefusal,
  HumanVerdicts,
} from "@automovie/motions";
import {
  AutoMovieMotionHumanAuditContinuity,
  HUMAN_LEXICON,
  HumanHand,
} from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../../../features/internal/motionHumanBody";
import { motionUpperPhrase } from "../../../features/internal/motionUpperPhrase";

/**
 * A reading arm follows the trunk while the unclaimed gait channels keep their trajectories.
 * Scenarios:
 * - Compare the pelvis, legs and free wrist at entry, ready, mid-hold, release and exit.
 * - At the three hold instants check reading height, forward reach and a 30 mm maximum variation in reach; audit continuity once at 24 Hz.
 * - Check same-arm conflict, whole-body conflict, a non-yielding base and a compatible opposite-arm claim.
 * - Authored hip touch, wave, clap and sip retain their distinct contact or sweep targets; an absent point is refused.
 * @evidence contracts/development/testing.md#behavioral-verification Reads displayed joints, surface contacts, timed events, channel allocations and physical refusals.
 * @evidence contracts/development/testing.md#independent-expectations An unclaimed joint stays within a nanometre of its plain walk. A continuous transition stays within the five millimetre verdict.
 * @evidence contracts/development/testing.md#distinguishing-cases Compares claimed and free channels at handoff and steady state on the same body.
 * @evidence contracts/development/testing.md#execution-ownership Stages each physical phrase once and performs one unpartitioned continuity reading.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the measured positions and their tolerances.
 */
export function test_motion_gait_gait_overlay(): void {
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
  // The phrase's arm is its `hand` (IAutoMovieMotionHumanArmPhrase.IParams).
  const touch = motionUpperPhrase.perform(
    body,
    "handOnHip",
    { hand: "left" },
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
  const stage = (chain: IAutoMovieMotionHumanChain) =>
    new HumanPerformance({
      seed: "overlay",
      performers: [
        {
          subject: "a",
          body,
          at: { x: 0, y: 0, z: 0 },
          yaw: 0,
          proficiency: { level: "trained" },
        },
      ],
      composition: chain.node,
    });
  const walk = HumanChain.subject("a").walk({ to: { x: 0, y: 0, z: 2 } });
  const plain = stage(walk);
  const read = stage(
    walk.over((u) => u.handToFace({ kind: "read", hand: "right", hold: 0.5 })),
  );
  const overlay = read.overlays("a")[0]!;
  const atEvent = (name: string) =>
    overlay.start +
    overlay.plan.events.find((e) => e.name === name)!.share *
      overlay.plan.duration;
  const ready = atEvent("ready"),
    relax = Math.min(plain.duration, atEvent("relax"));
  const atRest = plain.bones("a", 0).get("rightLowerArm")!.worldPosition;
  const bounds: number[] = [];
  for (const time of [0, ready, (ready + relax) / 2, relax, plain.duration]) {
    const base = plain.bones("a", time),
      shown = read.bones("a", time);
    for (const bone of [
      "hips",
      "leftUpperLeg",
      "rightUpperLeg",
      "leftLowerLeg",
      "rightLowerLeg",
      "leftFoot",
      "rightFoot",
      "leftHand",
    ] as const)
      TestValidator.predicate(
        "unclaimed " + bone + " remains on its gait",
        Vector3.distance(
          base.get(bone)!.worldPosition,
          shown.get(bone)!.worldPosition,
        ) <= 1e-9,
      );
    if (time >= ready && time <= relax) {
      const hand = shown.get("rightHand")!.worldPosition,
        chest = shown.get("chest")!.worldPosition;
      TestValidator.predicate(
        `at ${time} s the reading hand is ${(hand.y - atRest.y) * 1000} mm above the resting elbow and ${(hand.z - chest.z) * 1000} mm ahead of the chest, both positive expected`,
        hand.y > atRest.y && hand.z > chest.z,
      );
      TestValidator.predicate(
        "free hand hangs below hips",
        base.get("rightHand")!.worldPosition.y <
          base.get("hips")!.worldPosition.y,
      );
      bounds.push(Vector3.distance(hand, chest));
    }
  }
  TestValidator.predicate(
    "reading distance stays within 30 mm",
    bounds.length >= 3 && Math.max(...bounds) - Math.min(...bounds) <= 0.03,
  );
  const jump = AutoMovieMotionHumanAuditContinuity.measure(read, "a", 24).jump;
  TestValidator.predicate(
    "overlay joins the gait without a step",
    jump.value <= 0.005,
  );
  const seat = {
    at: {
      x: 0,
      y: AutoMovieMotionHumanSeat.seated.popliteal(body),
      z: body.rest.get("leftFoot")!.z - 0.1,
    },
    yaw: 0,
    depth: 0.45,
  };
  const phone = walk.over((u) =>
    u.handToFace({ kind: "phone", hand: "right" }),
  );
  for (const [chain, names] of [
    [
      phone.over((u) => u.handToFace({ kind: "drink", hand: "right" })),
      ["rightArm", "handToFace"],
    ],
    [walk.over((u) => u.sit({ seat })), ["sit", "handToFace"]],
    [
      HumanChain.subject("a")
        .sit({ seat })
        .over((u) => u.handToFace({ kind: "phone" })),
      ["sit"],
    ],
  ] as const) {
    let error: unknown;
    try {
      stage(chain);
    } catch (e) {
      error = e;
    }
    TestValidator.predicate(
      "conflict identifies the occupied channel",
      error instanceof HumanRefusal &&
        error.kind === "channel" &&
        error.axis === "over" &&
        names.every((n) => error.message.includes(n)),
    );
  }
  TestValidator.equals(
    "two distinct arm tasks are scheduled",
    stage(
      phone.over((u) => u.handToFace({ kind: "drink", hand: "left" })),
    ).overlays("a").length,
    2,
  );
}
