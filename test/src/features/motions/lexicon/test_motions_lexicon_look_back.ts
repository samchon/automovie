import { AutoMovieArchetypeBox } from "@automovie/archetypes";
import {
  AutoMovieEngineKinematics,
  AutoMovieEngineQuaternion,
  AutoMovieEngineVector3,
} from "@automovie/engine";
import type {
  IAutoMovieMotionTarget,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanChain,
  AutoMovieMotionHumanObject,
  AutoMovieMotionHumanPerformance,
  AutoMovieMotionHumanRefusal,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { humanFixtureBody } from "../../internal/fixtures/humanFixtureBody";
import { vclose } from "../../internal/vclose";

/**
 * A cue draws a glance while the actor travels, turns and keeps a carried prop.
 *
 * Quick and deliberate looks share one world target. A look to the far rear
 * uses an authored cue and rides a walking carrier. Two grounded quarter turns
 * choose the positive side of 180 degrees, then the same hand carries the
 * carton into the first resumed step. An uncued rear look refuses.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the two cue timings, the rear glance, the chosen turn direction, the resumed step and the refusal.
 * @evidence contracts/development/testing.md#behavioral-verification Uses the public motion chain, stock carton, stored performer and placed performance. Compares displayed bones and custody during the overlaid glance, then reads the heading and ground contact on the same clock.
 * @evidence contracts/development/testing.md#independent-expectations The quick look is cued before the deliberate look. The walking carrier preserves the same horizontal route, the authored headings are 90 and 180 degrees, and the same left-hand frame continues to carry the carton.
 */
export async function test_motions_lexicon_look_back(): Promise<void> {
  const body = await humanFixtureBody("m-average");
  const origin: IAutoMovieVector3 = { x: -0.32, y: 0, z: 0 };
  const turnMark: IAutoMovieVector3 = { ...origin, z: 0.65 };
  const behind: IAutoMovieMotionTarget = {
    kind: "point",
    frame: "world",
    at: { x: -0.2, y: 1.5, z: -0.65 },
  };
  const flank: IAutoMovieMotionTarget = {
    kind: "point",
    frame: "world",
    at: { x: 0.17, y: 1.5, z: 0.6 },
  };
  const carton = AutoMovieMotionHumanObject.prop(
    "carton",
    AutoMovieArchetypeBox.create({ width: 0.43, height: 0.33, depth: 0.36 }),
    { at: { ...origin, y: 0.73, z: 0.37 }, yaw: 0 },
  );
  const actor = AutoMovieMotionHumanChain.subject("actor");
  const take = (chain: typeof actor, carries: boolean = false) =>
    new AutoMovieMotionHumanPerformance({
      seed: "return glance",
      performers: [
        {
          subject: "actor",
          body,
          at: origin,
          yaw: 0,
          proficiency: { level: "trained" },
        },
      ],
      props: carries ? [carton] : [],
      composition: chain.node,
    });
  const quick = take(
    actor.look({ target: flank, cue: "signal", duration: 0.85 }, "look"),
  );
  const deliberate = take(
    actor.look({ target: flank, cue: "seen", duration: 1.35 }, "look"),
  );
  const at = (
    scene: AutoMovieMotionHumanPerformance,
    of: string,
    event: string,
  ): number => scene.instant({ of, event });
  TestValidator.predicate(
    "the signal draws a quicker response at the same target",
    at(quick, "look", "gazeOn") < at(deliberate, "look", "gazeOn") &&
      at(quick, "look", "settled") < at(deliberate, "look", "settled") &&
      quick.duration < deliberate.duration,
  );
  for (const scene of [quick, deliberate]) {
    const settled = at(scene, "look", "settled");
    const finished = scene.posture("actor", settled);
    TestValidator.predicate(
      "the head turns toward the side while the stand keeps its heading",
      finished.yaw === 0 && (finished.joints.head?.[2] ?? 0) > 20,
    );
  }
  let refused: boolean = false;
  try {
    take(actor.look({ target: behind }, "look"));
  } catch (error: unknown) {
    refused =
      error instanceof AutoMovieMotionHumanRefusal && error.axis === "cue";
  }
  TestValidator.predicate("looking far back needs an authored cue", refused);

  const carry = actor
    .stand({ hold: 0.4 })
    .pickUp({ prop: "carton", handle: "right", hand: "left" }, "lift")
    .walk({ to: turnMark }, "out");
  const control = take(carry, true);
  const scene = take(
    carry
      .over((head) =>
        head.look(
          { target: behind, cue: "signal", recruit: "head", duration: 0.8 },
          "rear",
        ),
      )
      .walk({ to: turnMark, face: 90 }, "quarter")
      .walk({ to: turnMark, face: 180 }, "reverse")
      .walk({ to: { ...origin, z: 0.3 }, face: 180 }, "resume"),
    true,
  );
  const gazeOn = at(scene, "rear", "gazeOn");
  const settled = at(scene, "rear", "settled");
  // The displayed overlay fades out at its end. Sample inside its gaze shift.
  const rear = (gazeOn + settled) / 2;
  const heading = (
    performance: AutoMovieMotionHumanPerformance,
    seconds: number,
  ): IAutoMovieVector3 =>
    AutoMovieEngineQuaternion.rotateVector(
      performance.bones("actor", seconds).get("head")!.worldRotation,
      { x: 0, y: 0, z: 1 },
    );
  TestValidator.predicate(
    "the displayed rear glance turns the head during the carrier walk",
    at(scene, "out", "start") < gazeOn &&
      gazeOn < settled &&
      settled < at(scene, "out", "end") &&
      AutoMovieEngineVector3.dot(heading(scene, rear), heading(control, rear)) <
        Math.cos((10 * Math.PI) / 180),
  );
  for (const seconds of [rear, at(scene, "out", "end") - 0.05]) {
    const actual = scene.posture("actor", seconds);
    const alone = control.posture("actor", seconds);
    TestValidator.predicate(
      "the rear look carries the same horizontal walk",
      Math.hypot(actual.root.x - alone.root.x, actual.root.z - alone.root.z) <
        0.001 && actual.yaw === alone.yaw,
    );
  }

  const quarter = at(scene, "quarter", "end");
  const reverse = at(scene, "reverse", "end");
  const firstStep = at(scene, "resume", "leftHeelStrike1");
  const end = at(scene, "resume", "end");
  TestValidator.predicate(
    "the positive side turns through 90 degrees to face back and then steps on",
    quarter < reverse &&
      reverse < firstStep &&
      firstStep < end &&
      Math.abs(scene.posture("actor", quarter).yaw - 90) < 1e-6 &&
      Math.abs(scene.posture("actor", reverse).yaw - 180) < 1e-6 &&
      scene.posture("actor", end).root.z < turnMark.z - 0.25,
  );
  const heel = body.surfaces.sockets.heelLeft;
  const placedHeel =
    AutoMovieEngineKinematics.resolveAutoMovieHumanoidSurfacePlace(
      heel,
      scene.bones("actor", firstStep).get(heel.bone)!,
    );
  TestValidator.predicate(
    "the first resumed heel strike reaches the floor",
    Math.abs(placedHeel.point.y) < 0.015,
  );
  const localCarton = (seconds: number): IAutoMovieVector3 => {
    const hand = scene.bones("actor", seconds).get("leftHand")!;
    return AutoMovieEngineQuaternion.rotateVector(
      AutoMovieEngineQuaternion.inverse(hand.worldRotation),
      AutoMovieEngineVector3.subtract(
        scene.prop("carton", seconds).position,
        hand.worldPosition,
      ),
    );
  };
  const held = localCarton(at(scene, "out", "start") + 0.05);
  for (const seconds of [rear, quarter, reverse, firstStep, end]) {
    TestValidator.predicate(
      "the same left-hand frame keeps the carton through the look and turn",
      vclose(localCarton(seconds), held, 0.001),
    );
  }
}
