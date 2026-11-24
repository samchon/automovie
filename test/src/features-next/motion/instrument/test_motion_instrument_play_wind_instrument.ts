import { createInstrument } from "@automovie/archetypes";
import {
  Quaternion,
  Vector3,
  resolveAutoMovieHumanoidSurfaces,
} from "@automovie/engine";
import {
  AutoMovieMotionHumanInstrument,
  HumanChain,
  HumanObject,
  HumanPerformance,
  HumanRefusal,
} from "@automovie/motions";
import { poseBones } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../../../features/internal/motionHumanBody";

/**
 * Watch the modeled mouthpiece meet the lips and the bell point outward at
 * several beats inside an authored playing window. Read the displayed
 * instrument's modeled +X axis independently of the mouthpiece socket.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Reads the rendered performer and instrument at authored times.
 * @evidence contracts/development/testing.md#independent-expectations Sets the expected cue times from explicit durations, and reads the mouth and bugle from their generated geometry.
 * @evidence contracts/development/testing.md#distinguishing-cases Checks the delay, sustained contact, outward bell, retained grip and refusal for an unheld instrument.
 * @evidence contracts/development/testing.md#execution-ownership Builds the scene and short performances in memory.
 * @evidence contracts/development/common.md#meaningful-documentation Describes the measurements and their independent frames.
 */
export function test_motion_instrument_play_wind_instrument(): void {
  const body = motionHumanBody("m-average");
  const bugle = createInstrument({ kind: "bugle" });
  const params = {
    prop: "bugle",
    delay: 0.23,
    prepare: 0.55,
    hold: 0.9,
    retract: 0.61,
  };
  const scene = {
    seed: "wind-cue",
    performers: [
      {
        subject: "a",
        body,
        at: { x: 0, y: 0, z: 0 },
        yaw: 0,
        proficiency: { level: "trained" as const },
      },
    ],
    props: [
      HumanObject.prop("bugle", bugle, {
        at: {
          x: -body.measure.shoulderHalfWidth,
          y: body.measure.waistHeight,
          z: 0.6 * (body.measure.upperArm + body.measure.forearm),
        },
        yaw: 0,
      }),
    ],
    laws: [AutoMovieMotionHumanInstrument.playWindInstrument],
  };
  const started = HumanChain.subject("a")
    .pickUp({
      prop: "bugle",
      handle: "grip",
      hand: "right",
      use: { tip: "mouthpiece", line: "along", at: "mouth" },
    })
    .registered("playWindInstrument", params);
  const film = new HumanPerformance({ ...scene, composition: started.node });
  const cue = film.segments("a")[1]!;
  const complaints: string[] = [];
  for (const [name, expected] of [
    ["lift", 0.23],
    ["atMouth", 0.78],
    ["playEnd", 1.68],
  ] as const) {
    const event = cue.plan.events.find((event) => event.name === name);
    const actual = (event?.share ?? NaN) * cue.plan.duration;
    if (!(Math.abs(actual - expected) < 1e-8))
      complaints.push(`${name}: ${actual}s, expected ${expected}s`);
  }
  if (!(Math.abs(cue.plan.duration - 2.29) < 1e-8))
    complaints.push(`cue lasts ${cue.plan.duration}s, expected 2.29s`);

  const mouth = body.surfaces.regions.mouth;
  const rim = bugle.affordance("mouthpiece").frame.translation;
  const display = (offset: number) => {
    const seconds = cue.start + offset;
    const frame = film.prop("bugle", seconds);
    const bones = poseBones(body, film.pose("a", seconds));
    const lips = resolveAutoMovieHumanoidSurfaces.place(
      mouth,
      bones.get(mouth.bone)!,
    );
    const wrist = bones.get("rightHand")!;
    const inverse = Quaternion.inverse(wrist.worldRotation);
    return {
      lips,
      rim: Vector3.add(
        frame.position,
        Quaternion.rotateVector(frame.rotation, rim),
      ),
      bell: Quaternion.rotateVector(frame.rotation, { x: 1, y: 0, z: 0 }),
      gripOffset: Quaternion.rotateVector(
        inverse,
        Vector3.subtract(frame.position, wrist.worldPosition),
      ),
      gripAxis: Quaternion.rotateVector(
        inverse,
        Quaternion.rotateVector(frame.rotation, { x: 1, y: 0, z: 0 }),
      ),
    };
  };
  const entry = display(0);
  if (Vector3.length(Vector3.subtract(display(0.12).rim, entry.rim)) > 0.002)
    complaints.push("the mouthpiece moves during the authored delay");
  for (const offset of [0.78, 1.18, 1.67]) {
    const shown = display(offset);
    const miss = Vector3.length(Vector3.subtract(shown.rim, shown.lips.point));
    if (miss > 0.015)
      complaints.push(`at ${offset}s the modeled rim misses by ${miss}m`);
    const alignment = Vector3.dot(shown.bell, shown.lips.normal);
    if (alignment < Math.cos((20 * Math.PI) / 180))
      complaints.push(`at ${offset}s the bell alignment is ${alignment}`);
  }
  for (const offset of [0.5, 1.1, 2.1, 2.29]) {
    const shown = display(offset);
    const drift = Vector3.length(
      Vector3.subtract(shown.gripOffset, entry.gripOffset),
    );
    if (drift > 0.002 || Vector3.dot(shown.gripAxis, entry.gripAxis) < 0.999)
      complaints.push(`the instrument moved in the holding hand at ${offset}s`);
  }
  let refusal: unknown;
  try {
    new HumanPerformance({
      ...scene,
      composition: HumanChain.subject("a").registered(
        "playWindInstrument",
        params,
      ).node,
    });
  } catch (error) {
    refusal = error;
  }
  if (!(refusal instanceof HumanRefusal && refusal.kind === "affordance"))
    complaints.push("an unheld instrument must yield an affordance refusal");
  TestValidator.equals("a visible timed bugle playing cue", complaints, []);
}
