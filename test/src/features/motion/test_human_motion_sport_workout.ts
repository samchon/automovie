import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  HUMAN_LEXICON,
  HumanChain,
  HumanPerformance,
  type HumanSegment,
  HumanSignature,
  type IHumanBody,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../internal/motionHumanBody";

/**
 * A workout's support is the one its exercise is described on, and a salto
 * turns head over heels in its flight: on the average man and on the small
 * woman, one film of eight rows shows each family of the workout law on its
 * support and the salto inverted at the middle of its flight.
 *
 * The expectations are the exercises' descriptions (NSCA's Essentials of
 * Strength Training, 4th ed.: a push-up lowers the chest to the floor over
 * fixed hands and toes; a pull-up ends with the chin over the bar; a glute
 * bridge raises the hips over planted feet with the shoulders on the floor;
 * a side plank bears on one forearm and the feet with the body off the
 * floor; a deadlift's hands pass below the knees over flat feet) and the
 * campaign's bounds (a planted support slips at most 5 mm, a held contact
 * 10 mm). Nothing is compared with a value read from the law.
 *
 * One film per body keeps the test under a minute: every row is done once
 * (`reps: 1`, `hold: 1`), and each reading is one posture at a named event.
 * Two bodies of opposite build suffice because every checked quantity is a
 * share of the body's own lengths.
 *
 * Scenarios, for each of the two bodies:
 * 1. Push-up: between `top1` and `bottom1` the toes' joints stay within
 *    5 mm and the wrists within 10 mm, and the shoulders come down by at
 *    least half the upper arm.
 * 2. Glute bridge: at `down1` the chest faces up; at `bridge1` the ankles
 *    are within 5 mm of where they were, the hips are above the shoulders
 *    and the shoulders are within a tenth of the stature of the floor.
 * 3. Side plank: at `reachEnd1` the left shoulder is below the right by at
 *    least a shoulder's half width, the left elbow is within 8 % of the
 *    stature of the floor and the hips are above a tenth of the stature.
 * 4. Triangle: at `reachEnd1` both ankles are within 15 mm of their
 *    standing height and the head is carried a tenth of the stature to one
 *    side of the hips.
 * 5. Deadlift: at `bottom1` the ankles are within 5 mm of where they stood
 *    and the wrists are below the knees.
 * 6. Pull-up: between `hang1` and `top1` the wrists' middle stays within
 *    5 mm, the feet are off the floor at `hang1`, and at `top1` the head's
 *    joint is no lower than 2 % of the stature under the wrists.
 * 7. Turn: at `half1` the hips face the way opposite to the entry's, and
 *    the left toes' joint stays within 5 mm through the turn.
 * 8. Forward salto: a quarter into the flight the head is ahead of the
 *    hips, at its middle below them, three quarters in behind them, and at
 *    `settled` above them.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Builds a performance through the public input on real bodies and reads displayed bones at named events; each failure names the row, the body and the measured millimetres.
 * @evidence contracts/development/testing.md#independent-expectations Expected values are the cited descriptions and the campaign's bounds; none is read from the law.
 * @evidence contracts/development/testing.md#distinguishing-cases One row per support family (hands and toes, back and feet, side, straddle, flat feet under a hinge, a bar, a pivot) and the salto, on two bodies of opposite build.
 * @evidence contracts/development/testing.md#execution-ownership Prepares two polygon men and one film each, without props; it runs locally and wherever CI runs the human motion tests.
 * @evidence contracts/development/common.md#meaningful-documentation States what is pinned, the sources, why two bodies and single repetitions suffice, and the 8 scenarios.
 */
export function test_human_motion_sport_workout(): void {
  const rows: readonly (readonly [string, object])[] = [
    ["pushUp", { reps: 1 }],
    ["gluteBridge", { reps: 1 }],
    ["sidePlank", { hold: 1 }],
    ["triangle", { hold: 1 }],
    ["deadlift", { reps: 1 }],
    ["pullUp", { reps: 1 }],
    ["spin", {}],
    ["frontSalto", { to: { x: 0, y: 0, z: 0.8 } }],
  ];
  const complaints: string[] = [];
  for (const name of ["m-average", "f-small"] as const) {
    const body: IHumanBody = motionHumanBody(name);
    const stature: number = body.measure.stature;
    let chain: HumanChain = HumanChain.subject("a").stand({ seconds: 0.3 });
    for (const [row, given] of rows)
      chain = chain.registered(row, given).stand({ seconds: 0.3 });
    let film: HumanPerformance;
    try {
      film = new HumanPerformance({
        seed: "workout",
        laws: Object.values(HUMAN_LEXICON).flat(),
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
    } catch (error) {
      complaints.push(
        `${name}: ${error instanceof Error ? error.message : String(error)}`,
      );
      continue;
    }
    const reader: HumanSignature.IReader = HumanSignature.of(
      film,
      "a",
      body,
      0,
    );
    const segment = (row: string): HumanSegment.ISegment =>
      film
        .segments("a")
        .find((s: HumanSegment.ISegment): boolean => s.name === row)!;
    const when = (row: string, event: string): number => {
      const found: HumanSegment.ISegment = segment(row);
      const share: number | undefined = found.plan.events.find(
        (e): boolean => e.name === event,
      )?.share;
      if (share === undefined)
        throw new Error(`${row} has no event ${event} on ${name}`);
      return found.start + share * found.plan.duration;
    };
    const joint = (
      seconds: number,
      ...bones: AutoMovieHumanoidBone[]
    ): IAutoMovieVector3 => {
      let sum: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
      for (const bone of bones)
        sum = Vector3.add(sum, HumanSignature.joint(reader, seconds, bone));
      return Vector3.scale(sum, 1 / bones.length);
    };
    const moved = (
      a: number,
      b: number,
      ...bones: AutoMovieHumanoidBone[]
    ): number =>
      1000 *
      Vector3.length(Vector3.subtract(joint(a, ...bones), joint(b, ...bones)));
    const facing = (
      seconds: number,
      bone: AutoMovieHumanoidBone,
    ): IAutoMovieVector3 =>
      Quaternion.rotateVector(
        HumanSignature.bones(reader, seconds).get(bone)!.worldRotation,
        { x: 0, y: 0, z: 1 },
      );
    const expect = (label: string, held: boolean, measured: string): void => {
      if (!held) complaints.push(`${name}: ${label} (${measured})`);
    };
    const mm = (value: number): string => `${value.toFixed(1)} mm`;
    const m = (value: number): string => `${value.toFixed(3)} m`;
    const at = (point: IAutoMovieVector3): string =>
      `(${point.x.toFixed(3)}, ${point.y.toFixed(3)}, ${point.z.toFixed(3)})`;

    // 1. Push-up.
    const top: number = when("pushUp", "top1");
    const bottom: number = when("pushUp", "bottom1");
    for (const bone of ["leftToes", "rightToes"] as const)
      expect(
        `the push-up keeps the ${bone} within 5 mm`,
        moved(top, bottom, bone) <= 5,
        mm(moved(top, bottom, bone)),
      );
    for (const bone of ["leftHand", "rightHand"] as const)
      expect(
        `the push-up keeps the ${bone} within 10 mm`,
        moved(top, bottom, bone) <= 10,
        `${mm(moved(top, bottom, bone))}: the wrist at ${at(joint(top, bone))} on top and ${at(joint(bottom, bone))} at the bottom, the shoulders at ${at(joint(top, "leftUpperArm", "rightUpperArm"))} and ${at(joint(bottom, "leftUpperArm", "rightUpperArm"))}, the toes at ${at(joint(top, "leftToes", "rightToes"))}`,
      );
    const lowered: number =
      joint(top, "leftUpperArm", "rightUpperArm").y -
      joint(bottom, "leftUpperArm", "rightUpperArm").y;
    expect(
      "the push-up lowers the shoulders by half the upper arm",
      lowered >= 0.5 * body.measure.upperArm,
      m(lowered),
    );

    // 2. Glute bridge.
    const down: number = when("gluteBridge", "down1");
    const bridge: number = when("gluteBridge", "bridge1");
    expect(
      "hook lying faces the chest up",
      facing(down, "chest").y >= 0.7,
      facing(down, "chest").y.toFixed(2),
    );
    for (const bone of ["leftFoot", "rightFoot"] as const)
      expect(
        `the bridge keeps the ${bone} within 5 mm`,
        moved(down, bridge, bone) <= 5,
        mm(moved(down, bridge, bone)),
      );
    const shoulders: number = joint(
      bridge,
      "leftUpperArm",
      "rightUpperArm",
    ).y;
    expect(
      "the bridge raises the hips above the shoulders",
      joint(bridge, "leftUpperLeg", "rightUpperLeg").y > shoulders,
      m(joint(bridge, "leftUpperLeg", "rightUpperLeg").y - shoulders),
    );
    expect(
      "the bridge leaves the shoulders on the floor",
      shoulders <= 0.1 * stature,
      m(shoulders),
    );

    // 3. Side plank.
    const side: number = when("sidePlank", "reachEnd1");
    const tilt: number =
      joint(side, "rightUpperArm").y - joint(side, "leftUpperArm").y;
    expect(
      "the side plank has the left shoulder under the right",
      tilt >= body.measure.shoulderHalfWidth,
      m(tilt),
    );
    expect(
      "the side plank bears on the left elbow",
      joint(side, "leftLowerArm").y <= 0.08 * stature,
      m(joint(side, "leftLowerArm").y),
    );
    expect(
      "the side plank holds the hips off the floor",
      joint(side, "hips").y >= 0.1 * stature,
      m(joint(side, "hips").y),
    );

    // 4. Triangle.
    const stood: number = segment("triangle").start;
    const bent: number = when("triangle", "reachEnd1");
    for (const bone of ["leftFoot", "rightFoot"] as const) {
      const rise: number =
        1000 * Math.abs(joint(bent, bone).y - joint(stood, bone).y);
      expect(
        `the triangle keeps the ${bone} at the floor within 15 mm`,
        rise <= 15,
        mm(rise),
      );
    }
    const aside: number = Math.abs(
      joint(bent, "head").x - joint(bent, "hips").x,
    );
    expect(
      "the triangle carries the head to one side of the hips",
      aside >= 0.1 * stature,
      m(aside),
    );

    // 5. Deadlift.
    const upright: number = segment("deadlift").start;
    const hinge: number = when("deadlift", "bottom1");
    for (const bone of ["leftFoot", "rightFoot"] as const)
      expect(
        `the deadlift keeps the ${bone} within 5 mm`,
        moved(upright, hinge, bone) <= 5,
        mm(moved(upright, hinge, bone)),
      );
    const under: number =
      joint(hinge, "leftLowerLeg", "rightLowerLeg").y -
      joint(hinge, "leftHand", "rightHand").y;
    expect("the deadlift lowers the hands below the knees", under > 0, m(under));

    // 6. Pull-up.
    const hang: number = when("pullUp", "hang1");
    const chin: number = when("pullUp", "top1");
    expect(
      "the pull-up keeps the hands' middle within 5 mm",
      moved(hang, chin, "leftHand", "rightHand") <= 5,
      mm(moved(hang, chin, "leftHand", "rightHand")),
    );
    const clear: number =
      joint(hang, "leftFoot", "rightFoot").y -
      joint(segment("pullUp").start, "leftFoot", "rightFoot").y;
    expect("the hang lifts the feet off the floor", clear > 0.02, m(clear));
    const over: number =
      joint(chin, "head").y - joint(chin, "leftHand", "rightHand").y;
    expect(
      "the pull-up brings the head's joint to the bar",
      over >= -0.02 * stature,
      m(over),
    );

    // 7. Turn.
    const before: number = segment("spin").start;
    const half: number = when("spin", "half1");
    const turned: number = Vector3.dot(
      facing(before, "hips"),
      facing(half, "hips"),
    );
    expect("the turn's half faces backward", turned <= -0.9, turned.toFixed(2));
    for (const instant of [half, when("spin", "full1")])
      expect(
        "the turn keeps the left toes' joint within 5 mm",
        moved(before, instant, "leftToes") <= 5,
        `${mm(moved(before, instant, "leftToes"))}: at ${at(joint(before, "leftToes"))} before, ${at(joint(before + 0.05, "leftToes"))} 0.05 s in, ${at(joint(instant, "leftToes"))} then`,
      );

    // 8. Forward salto.
    const off: number = when("frontSalto", "takeoff");
    const land: number = when("frontSalto", "touchdown");
    const over2 = (share: number): IAutoMovieVector3 => {
      const seconds: number = off + share * (land - off);
      return Vector3.subtract(
        joint(seconds, "head"),
        joint(seconds, "leftUpperLeg", "rightUpperLeg"),
      );
    };
    expect(
      "a quarter into the salto the head is ahead of the hips",
      over2(0.25).z > 0,
      m(over2(0.25).z),
    );
    expect(
      "at the salto's middle the head is below the hips",
      over2(0.5).y < 0,
      m(over2(0.5).y),
    );
    expect(
      "three quarters into the salto the head is behind the hips",
      over2(0.75).z < 0,
      m(over2(0.75).z),
    );
    const settled: number = when("frontSalto", "settled");
    const standing: number =
      joint(settled, "head").y -
      joint(settled, "leftUpperLeg", "rightUpperLeg").y;
    expect("the salto lands upright", standing > 0, m(standing));
  }
  TestValidator.equals("every workout is on its support", complaints, []);
}
