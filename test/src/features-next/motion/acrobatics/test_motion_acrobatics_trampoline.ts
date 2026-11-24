import { createTrampoline } from "@automovie/archetypes";
import { Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionEvent,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanSegment,
  IAutoMovieMotionHumanTrampoline,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanAcrobatics,
  HumanChain,
  HumanObject,
  HumanPerformance,
  HumanRefusal,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { assertTakeClean } from "../../../features/internal/assertTakeClean";
import { motionHumanBody } from "../../../features/internal/motionHumanBody";

/** Standard gravity, m/s² (third CGPM, 1901). */
const G: number = 9.80665;

/**
 * Bounce on a trampoline (#4006).
 *
 * Scenarios, on two body proportions:
 * 1. Each contact's deepest bed deflection matches the bed's
 *    force-deflection law for the body's mass and the fall within 10 mm.
 * 2. Each flight is ballistic: its time is the take-off speed's, so a
 *    straight body's feet rise to the height that time gives within 20 mm
 *    (a shape folds the feet toward the hips), and the apexes build toward
 *    the authored one and do not exceed it.
 * 3. A tuck's apex folds the knees past 90 degrees.
 * 4. An apex beyond what the legs' push sustains is refused on `apex` with
 *    the reachable height.
 * 5. Each take passes the shipped verdicts.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States each rule and bound.
 * @evidence contracts/development/testing.md#behavioral-verification Plans the trampoline row through the public chain and reads its events and the displayed feet and knees.
 * @evidence contracts/development/testing.md#independent-expectations The deflection is the law's published balance solved for the body's mass; flights follow gravity alone.
 * @evidence contracts/development/testing.md#distinguishing-cases Two bodies, a straight and a tuck routine, and a refused apex.
 * @evidence contracts/development/testing.md#execution-ownership In-memory performances on the shared Human fixture.
 */
export function test_motion_acrobatics_trampoline(): void {
  const bed: number = createTrampoline().affordance("bed").frame.translation.y;
  for (const name of ["f-small", "m-average"] as const) {
    const body: IAutoMovieMotionHumanBody = motionHumanBody(name);
    for (const shape of ["straight", "tuck"] as const) {
      const apex: number = 1.2;
      const film: HumanPerformance = take(body, bed, {
        on: "tramp",
        bounces: 4,
        apex,
        shape,
      });
      const s: IAutoMovieMotionHumanSegment = film.segments("a")[0]!;
      const at: (n: string) => number = (n: string): number =>
        s.start +
        s.plan.events.find((e: IAutoMovieMotionEvent): boolean => e.name === n)!
          .share *
          s.plan.duration;
      const ankle: number = body.rest.get("leftFoot")!.y;
      const feet: (t: number) => number = (t: number): number =>
        film.bones("a", t).get("leftFoot")!.worldPosition.y - ankle - bed;
      let last: number = 0;
      for (let k: number = 1; k <= 4; k++) {
        const flight: number = at(`touchdown${k}`) - at(`takeoff${k}`);
        const height: number = (G * flight * flight) / 8;
        const peak: number = feet(at(`apex${k}`));
        TestValidator.predicate(
          `${name} ${shape} flight ${k} is ballistic (${peak.toFixed(3)} m apex for ${height.toFixed(3)} m)`,
          (shape !== "straight" || Math.abs(peak - height) <= 0.02) &&
            height <= apex + 1e-9 &&
            height >= last - 1e-9,
        );
        last = height;
        // The deepest point of the contact after it.
        const from: number = at(`touchdown${k}`);
        let deepest: number = 0;
        for (let t: number = from; t <= from + 0.5; t += 1 / 240)
          deepest = Math.min(deepest, feet(t));
        const expected: number =
          AutoMovieMotionHumanAcrobatics.trampoline.deflection(
            body.profile.mass,
            height,
          );
        TestValidator.predicate(
          `${name} ${shape} contact ${k} deflects the bed ${(-deepest * 1000).toFixed(0)} mm for ${(expected * 1000).toFixed(0)} mm`,
          Math.abs(-deepest - expected) <= 0.01,
        );
      }
      if (shape === "tuck") {
        const knee: number = bend(film, at("apex2"));
        TestValidator.predicate(
          `${name} tucks at the apex (${knee.toFixed(0)} degrees)`,
          knee >= 90,
        );
      }
      assertTakeClean(`${name} ${shape} bounces`, film);
    }
  }

  const body: IAutoMovieMotionHumanBody = motionHumanBody("m-average");
  let refused: HumanRefusal | undefined;
  try {
    take(body, bed, { on: "tramp", apex: 10 });
  } catch (error) {
    if (!(error instanceof HumanRefusal)) throw error;
    refused = error;
  }
  TestValidator.predicate(
    "an apex beyond the push is refused with the reachable height",
    refused?.axis === "apex" &&
      refused.feasible?.kind === "range" &&
      (refused.feasible.maximum ?? Infinity) < 10,
  );
}

/** A jumper standing on the bed's middle. */
function take(
  body: IAutoMovieMotionHumanBody,
  bed: number,
  params: IAutoMovieMotionHumanTrampoline.IParams,
): HumanPerformance {
  return new HumanPerformance({
    seed: "trampoline",
    laws: [AutoMovieMotionHumanAcrobatics.HumanGymnastics.trampoline],
    performers: [
      {
        subject: "a",
        body,
        at: { x: 0, y: bed, z: 0 },
        yaw: 0,
        proficiency: { level: "trained" },
      },
    ],
    props: [
      HumanObject.prop("tramp", createTrampoline(), {
        at: { x: 0, y: 0, z: 0 },
        yaw: 0,
      }),
    ],
    composition: HumanChain.subject("a").registered("trampoline", params).node,
  });
}

/** The left knee's bend at a film second, degrees. */
function bend(film: HumanPerformance, time: number): number {
  const b: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = film.bones(
    "a",
    time,
  );
  const thigh: IAutoMovieVector3 = Vector3.normalize(
    Vector3.subtract(
      b.get("leftLowerLeg")!.worldPosition,
      b.get("leftUpperLeg")!.worldPosition,
    ),
  );
  const shank: IAutoMovieVector3 = Vector3.normalize(
    Vector3.subtract(
      b.get("leftFoot")!.worldPosition,
      b.get("leftLowerLeg")!.worldPosition,
    ),
  );
  return (
    (Math.acos(Math.max(-1, Math.min(1, Vector3.dot(thigh, shank)))) * 180) /
    Math.PI
  );
}
