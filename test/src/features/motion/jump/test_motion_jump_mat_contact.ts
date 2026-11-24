import { createHighJump, createLandingMat } from "@automovie/archetypes";
import { Vector3 } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPerformance,
  IAutoMovieMotionHumanSegment,
  IAutoMovieMotionHumanSignature,
  IAutoMovieMotionHumanVerdicts,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanAcrobatics,
  HumanChain,
  HumanObject,
  HumanPerformance,
  HumanSignature,
  HumanVerdicts,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../../internal/motionHumanBody";

/**
 * The high jump and its landing mat serve the Fosbury flop: the flop peaks at
 * the crossbar the apparatus declares and lies down on the mat's `surface`.
 *
 * The bar is set at 1.4 m; the flop reads the crossbar's axis from the
 * apparatus's `bar` (the high jump is the flop's `bar` prop), and it comes down
 * on the high jump mat placed beyond.
 *
 * Scenarios, on the average man and the small woman:
 *
 * 1. The flop over the bar onto the mat plans, and its centre of mass peaks within
 *    50 mm of the bar's axis or above it (provisional: the law peaks the centre
 *    at the height it is given).
 * 2. At the flop's `settled` the hips lie on the mat: between its top and a fifth
 *    of the stature above it.
 * 3. From the take-off to `settled`, read at 24 frames a second, the verdict
 *    report's frame bounds hold: no joint centre jumps, reverses or moves past
 *    its speed, and no bone turns past 5 turns a second. The flop turns through
 *    its flight, never in a frame.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Builds the flop through the public chain with the real apparatus and reads the displayed joints and the centre of mass; a flop that misses the bar or lands off the mat fails with the measure.
 * @evidence contracts/development/testing.md#independent-expectations The bar's height and the mat's top are the archetypes' own affordances; the bounds are stated provisional; nothing is read from the law but its events.
 * @evidence contracts/development/testing.md#distinguishing-cases One jump on two bodies of opposite build.
 * @evidence contracts/development/testing.md#execution-ownership Prepares two polygon men and two films; it runs locally and wherever CI runs the archetype tests.
 * @evidence contracts/development/common.md#meaningful-documentation States what is pinned, the stage and the 3 scenarios with their bounds.
 */
export function test_motion_jump_mat_contact(): void {
  const high: ReturnType<typeof createHighJump> = createHighJump({
    height: 1.4,
  });
  const mat: ReturnType<typeof createLandingMat> = createLandingMat({
    kind: "highJump",
  });
  const bar: number = high.affordance("bar").frame.translation.y;
  const top: number = mat.affordance("surface").frame.translation.y;
  const complaints: string[] = [];
  const name = "f-small" as const;
  {
    const body: IAutoMovieMotionHumanBody = motionHumanBody(name);
    const stature: number = body.measure.stature;
    const performer: IAutoMovieMotionHumanPerformance.IInput["performers"][number] =
      {
        subject: "a",
        body,
        at: { x: 0, y: 0, z: 0 },
        yaw: 0,
        proficiency: { level: "trained" },
      };
    const event = (
      film: IAutoMovieMotionHumanPerformance,
      row: string,
    ): ((name: string) => number) => {
      const segment: IAutoMovieMotionHumanSegment = film
        .segments("a")
        .find((s: IAutoMovieMotionHumanSegment): boolean => s.name === row)!;
      return (instant: string): number =>
        segment.start +
        (segment.plan.events.find((e): boolean => e.name === instant)?.share ??
          Number.NaN) *
          segment.plan.duration;
    };

    // 1. The flop over the crossbar onto the mat.
    try {
      const film: IAutoMovieMotionHumanPerformance = new HumanPerformance({
        seed: "flop",
        laws: [AutoMovieMotionHumanAcrobatics.HumanGymnastics.fosburyFlop],
        performers: [performer],
        props: [
          HumanObject.prop("bar", high, { at: { x: 0, y: 0, z: 1.6 }, yaw: 0 }),
          HumanObject.prop("mat", mat, { at: { x: 0, y: 0, z: 4 }, yaw: 0 }),
        ],
        composition: HumanChain.subject("a")
          .stand({ hold: 0.3 })
          .registered("fosburyFlop", {
            to: { x: 0, y: top, z: 2.5 },
            on: "mat",
            bar: "bar",
          }).node,
      });
      const reader: IAutoMovieMotionHumanSignature.IReader = HumanSignature(
        film,
        "a",
        body,
        0,
      );
      const at: (instant: string) => number = event(film, "fosburyFlop");
      let peak: number = -Infinity;
      for (let s: number = at("takeoff"); s <= at("touchdown"); s += 0.01)
        peak = Math.max(peak, HumanSignature.centre(reader, s).y);
      if (!(peak >= bar - 0.05))
        complaints.push(
          `${name} flop: the centre peaks at ${peak.toFixed(3)} m, the bar's axis at ${bar.toFixed(3)} m within 50 mm or above expected`,
        );

      // 3. No frame jumps through the flight and the landing.
      const smooth: IAutoMovieMotionHumanVerdicts.IFinding[] = HumanVerdicts(
        film,
        24,
        {
          from: at("takeoff"),
          to: at("settled"),
        },
      ).findings.filter((f: IAutoMovieMotionHumanVerdicts.IFinding): boolean =>
        ["jump", "reversal", "speed", "turn"].includes(f.check),
      );
      for (const finding of smooth)
        complaints.push(
          finding.check + " at " + finding.seconds + " on " + finding.where,
        );
      const settled: number = at("settled");
      const hips: IAutoMovieVector3 = Vector3.lerp(
        HumanSignature.joint(reader, settled, "leftUpperLeg"),
        HumanSignature.joint(reader, settled, "rightUpperLeg"),
        0.5,
      );
      if (!(hips.y - top >= 0 && hips.y - top <= 0.2 * stature))
        complaints.push(
          `${name} flop: at settled the hips are ${(hips.y - top).toFixed(3)} m above the mat, 0 to ${(0.2 * stature).toFixed(3)} m expected`,
        );
    } catch (error) {
      complaints.push(
        `${name} flop: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }
  TestValidator.equals(
    "the high jump and its mat serve the flop",
    complaints,
    [],
  );
}
