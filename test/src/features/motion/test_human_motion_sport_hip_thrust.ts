import { createBench } from "@automovie/archetypes";
import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  HumanChain,
  HumanObject,
  HumanPerformance,
  type HumanSegment,
  HumanSignature,
  HumanSportGym,
  type IHumanBody,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../internal/motionHumanBody";

/**
 * A hip thrust bears on two heights at once: the upper back on a bench's
 * edge and the feet on the floor, the hips driven up between them. On the
 * average man and on the small woman, with a competition bench behind the
 * performer, its long side toward them, the feet stay on the floor where
 * they are, the back stays at the edge, and the lockout is a body in one
 * line from the shoulders to the knees over upright shanks.
 *
 * The expectations are the exercise as Contreras, Vigotsky, Schoenfeld,
 * Beardsley and Cronin performed it ("A Comparison of Gluteus Maximus,
 * Biceps Femoris, and Vastus Lateralis Electromyography Amplitude for the
 * Barbell, Band, and American Hip Thrust Variations", Journal of Applied
 * Biomechanics 32:254-260, 2016, Methods and Figure 1): the back on a bench
 * about 16 inches high, the feet flat, each repetition ending in full hip
 * extension; the shanks upright at the top are read from its Figure 1, not
 * its text. Also the bench's own `edge` affordance carried by its
 * placement, and the campaign's bounds: 10 mm on a held contact's height,
 * 5 mm on a planted foot between the two ends of the repetition. These are
 * estimates with no source: 160 degrees at the hip for full extension, 10
 * degrees from upright for the shanks, the back's joint within 0.15 m of
 * the edge on the floor plan and up to a fifth of the stature above it,
 * and the hips rising more than 0.08 of the stature (the paper's bottom,
 * the bar on the floor, is not modelled). Two bodies of opposite build
 * suffice because the angles are solved from each body's own lengths
 * against one edge; one film each keeps the test far under a minute.
 *
 * Scenarios, for each of the two bodies, one hip thrust `on` the bench's
 * `edge`, the bench 0.6 m behind and turned so that the edge faces the
 * performer's back:
 * 1. At `down1` and at `lockout1` each ankle is within 10 mm of its
 *    standing height, and between the two it moves 5 mm at most.
 * 2. At both events the chest's joint is 0 to a fifth of the stature
 *    above the edge and within 0.15 m of it on the floor plan.
 * 3. At `lockout1` the shoulders, the hips and the knees make an angle of
 *    at least 160 degrees at the hips, and each shank is within 10 degrees
 *    of upright.
 * 4. The hip joints are more than 0.08 of the stature higher at `lockout1`
 *    than at `down1`.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Builds a performance through the public chain with the real bench as a prop and reads displayed joints against its affordance and the floor; feet that float or slide, a back off the edge, a bent lockout or hips that do not travel fail with the measure.
 * @evidence contracts/development/testing.md#independent-expectations The edge is the archetype's affordance carried by the prop's placement; the standing ankle height is read from the film's own standing start; the bounds are the campaign's and stated estimates; no angle is read from the law.
 * @evidence contracts/development/testing.md#distinguishing-cases The feet, the back, the lockout's shape and the travel are separate assertions on two bodies of opposite build against one edge height.
 * @evidence contracts/development/testing.md#execution-ownership Prepares two polygon men, one archetype and one short film each; it runs locally and wherever CI runs the human motion tests.
 * @evidence contracts/development/common.md#meaningful-documentation States what is pinned, the source, the bounds and which are estimates, why two bodies suffice and the 4 scenarios.
 */
export function test_human_motion_sport_hip_thrust(): void {
  const bench: ReturnType<typeof createBench> = createBench({});
  const place: IAutoMovieVector3 = { x: 0, y: 0, z: -0.6 };
  // The bench's +X long side turned to face +Z, the performer's back.
  const turned: IAutoMovieQuaternion = Quaternion.fromAxisAngle(
    { x: 0, y: 1, z: 0 },
    -Math.PI / 2,
  );
  const edge: IAutoMovieVector3 = Vector3.add(
    place,
    Quaternion.rotateVector(turned, bench.affordance("edge").frame.translation),
  );
  const complaints: string[] = [];
  for (const name of ["m-average", "f-small"] as const) {
    const body: IHumanBody = motionHumanBody(name);
    const stature: number = body.measure.stature;
    let film: HumanPerformance;
    try {
      film = new HumanPerformance({
        seed: "hip-thrust",
        laws: [HumanSportGym.hipThrust],
        performers: [
          {
            subject: "a",
            body,
            at: { x: 0, y: 0, z: 0 },
            yaw: 0,
            proficiency: { level: "trained" },
          },
        ],
        props: [
          HumanObject.prop("bench", bench, {
            position: place,
            rotation: turned,
          }),
        ],
        composition: HumanChain.subject("a")
          .stand({ seconds: 0.3 })
          .registered("hipThrust", {
            reps: 1,
            on: { prop: "bench", affordance: "edge" },
          })
          .stand({ seconds: 0.3 }).node,
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
    const row: HumanSegment.ISegment = film
      .segments("a")
      .find((s: HumanSegment.ISegment): boolean => s.name === "hipThrust")!;
    const when = (event: string): number =>
      row.start +
      (row.plan.events.find((e): boolean => e.name === event)?.share ??
        Number.NaN) *
        row.plan.duration;
    const joint = (
      seconds: number,
      bone: AutoMovieHumanoidBone,
    ): IAutoMovieVector3 => HumanSignature.joint(reader, seconds, bone);
    const both = (seconds: number, bone: string): IAutoMovieVector3 =>
      Vector3.scale(
        Vector3.add(
          joint(seconds, `left${bone}` as AutoMovieHumanoidBone),
          joint(seconds, `right${bone}` as AutoMovieHumanoidBone),
        ),
        0.5,
      );
    const down: number = when("down1");
    const lockout: number = when("lockout1");

    // 1. The feet on the floor, where they are.
    for (const bone of ["leftFoot", "rightFoot"] as const) {
      const standing: number = joint(0.1, bone).y;
      for (const [event, seconds] of [
        ["down1", down],
        ["lockout1", lockout],
      ] as const) {
        const off: number = 1000 * (joint(seconds, bone).y - standing);
        if (!(Math.abs(off) <= 10))
          complaints.push(
            `${name}: at ${event} the ${bone} is ${off.toFixed(1)} mm above its standing height, within 10 mm expected`,
          );
      }
      const slid: number =
        1000 *
        Vector3.length(
          Vector3.subtract(joint(lockout, bone), joint(down, bone)),
        );
      if (!(slid <= 5))
        complaints.push(
          `${name}: between down1 and lockout1 the ${bone} moves ${slid.toFixed(1)} mm, 5 mm at most expected`,
        );
    }

    // 2. The back at the edge.
    for (const [event, seconds] of [
      ["down1", down],
      ["lockout1", lockout],
    ] as const) {
      const back: IAutoMovieVector3 = joint(seconds, "chest");
      const above: number = back.y - edge.y;
      const off: number = Math.hypot(back.x - edge.x, back.z - edge.z);
      if (!(above >= 0 && above <= 0.2 * stature && off <= 0.15))
        complaints.push(
          `${name}: at ${event} the chest's joint is ${above.toFixed(3)} m above the bench's edge and ${off.toFixed(3)} m from it on the floor plan, 0 to ${(0.2 * stature).toFixed(3)} m above and 0.15 m at most expected`,
        );
    }

    // 3. One line over upright shanks.
    const hips: IAutoMovieVector3 = both(lockout, "UpperLeg");
    const toShoulders: IAutoMovieVector3 = Vector3.subtract(
      both(lockout, "UpperArm"),
      hips,
    );
    const toKnees: IAutoMovieVector3 = Vector3.subtract(
      both(lockout, "LowerLeg"),
      hips,
    );
    const line: number =
      (Math.acos(
        Vector3.dot(toShoulders, toKnees) /
          (Vector3.length(toShoulders) * Vector3.length(toKnees)),
      ) *
        180) /
      Math.PI;
    if (!(line >= 160))
      complaints.push(
        `${name}: at lockout1 the shoulders, the hips and the knees make ${line.toFixed(1)} degrees at the hips, 160 at least expected`,
      );
    for (const side of ["left", "right"] as const) {
      const shank: IAutoMovieVector3 = Vector3.subtract(
        joint(lockout, `${side}LowerLeg`),
        joint(lockout, `${side}Foot`),
      );
      const lean: number =
        (Math.acos(shank.y / Vector3.length(shank)) * 180) / Math.PI;
      if (!(lean <= 10))
        complaints.push(
          `${name}: at lockout1 the ${side} shank leans ${lean.toFixed(1)} degrees from upright, 10 at most expected`,
        );
    }

    // 4. The hips travel.
    const travel: number = (hips.y - both(down, "UpperLeg").y) / stature;
    if (!(travel > 0.08))
      complaints.push(
        `${name}: the hip joints rise ${travel.toFixed(3)} of the stature from down1 to lockout1, more than 0.08 expected`,
      );
  }
  TestValidator.equals(
    "a hip thrust bears on the bench's edge and the floor",
    complaints,
    [],
  );
}
