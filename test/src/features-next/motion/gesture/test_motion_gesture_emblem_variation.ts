import { Vector3 } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPerformance,
  IAutoMovieMotionHumanSegment,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanGesture,
  AutoMovieMotionHumanStance,
  HumanChain,
  HumanPerformance,
  HumanRefusal,
} from "@automovie/motions";
import { HumanSkill } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { motionContactArmFixture as fixture } from "../../../features/internal/motionContactArmFixture";
import { motionHumanBody } from "../../../features/internal/motionHumanBody";

const { HumanEmblem } = AutoMovieMotionHumanGesture;

/**
 * An emblem varies by seed inside a band and never repeats (#3345's seed
 * and variation line): over 200 seeds the `halt` emblem's preparation keeps
 * near its unvaried length, and the seeds do not give one film.
 *
 * One body, the average man; each seed builds the plan and reads its events,
 * no posture, so two hundred performances stay short.
 *
 * Scenarios, `halt` with `manner: { variation: 1 }` over seeds 0 to 199:
 * 1. Every seed plans.
 * 2. Every seed's preparation (the start to `strokeStart`) lasts between
 *    0.5 and 1.5 of the unvaried row's (provisional band: a varied
 *    preparation is still the same reach).
 * 3. The stroke itself (`strokeStart` to `strokeEnd`) keeps the unvaried
 *    row's length within 1 ms: only the preparation varies.
 * 4. At least 190 of the 200 preparations differ from every other by more
 *    than a microsecond.
 *
 * Scenarios:
 * 1. Observe the supplied action through the phases identified above.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Builds two hundred performances through the public chain and reads each plan's events; a seed that is ignored, a preparation outside its band or a stroke whose length moves fails.
 * @evidence contracts/development/testing.md#independent-expectations The 200 seeds and the two claims are #3345's; the band and the count of distinct values are provisional and stated as such.
 * @evidence contracts/development/testing.md#distinguishing-cases The varied row against the same row unvaried; a place's variation is `variationCases`'.
 * @evidence contracts/development/testing.md#execution-ownership Prepares one polygon man and evaluates the 201 seeded action plans on one standing entry without reading a posture; it runs locally and wherever CI runs the human motion tests.
 * @evidence contracts/development/common.md#meaningful-documentation States the rule, why no posture is read and the 4 scenarios with their bounds.
 */
export function test_motion_gesture_emblem_variation(): void {
  const body: IAutoMovieMotionHumanBody = motionHumanBody("m-average");
  const complaints: string[] = [];
  // A directed forefinger is judged from its own held bones and the
  // independently resolved temple, not the row's intended goal.
  const templeShow = new HumanPerformance({
    seed: "directed fingertip",
    performers: [
      {
        subject: "a",
        body,
        at: { x: 0, y: 0, z: 0 },
        yaw: 0,
        proficiency: { level: "trained" },
      },
    ],
    composition: HumanChain.subject("a").touch({
      target: { kind: "self", region: "templeRight" },
      effector: "forefinger",
      kind: "hold",
      hand: "right",
      elbow: "level",
    }).node,
  });
  const heldAt = (
    seg: IAutoMovieMotionHumanSegment,
    begin: string,
    end: string,
  ): number => {
    const instant = (name: string): number =>
      seg.start +
      seg.plan.duration *
        (seg.plan.events.find((e) => e.name === name)?.share ?? NaN);
    return (instant(begin) + instant(end)) / 2;
  };
  const showing = templeShow.bones(
    "a",
    heldAt(templeShow.segments("a")[0]!, "ready", "relax"),
  );
  const wrist = showing.get("rightHand")!.worldPosition;
  const elbow = showing.get("rightLowerArm")!.worldPosition;
  const shoulder = showing.get("rightUpperArm")!.worldPosition;
  const tip = showing.get("rightIndexDistal")!.worldPosition;
  if (
    Vector3.distance(tip, fixture.site(body, showing, "templeRight")) > 0.03 ||
    Vector3.dot(
      Vector3.normalize(Vector3.subtract(tip, wrist)),
      Vector3.normalize(Vector3.subtract(wrist, elbow)),
    ) < Math.cos(Math.PI / 12) ||
    elbow.z <= shoulder.z
  )
    complaints.push(
      "the directed forefinger missed the temple, bent the wrist, or drew its elbow behind its shoulder",
    );
  // An object inspected by eye must remain in front of the chest and within
  // its declared viewing range. The eye baseline is measured on the live head.
  const watchShow = new HumanPerformance({
    seed: "viewing distance",
    laws: [AutoMovieMotionHumanStance.HumanHabit.checkWatch],
    performers: [
      {
        subject: "a",
        body,
        at: { x: 0, y: 0, z: 0 },
        yaw: 0,
        proficiency: { level: "trained" },
      },
    ],
    composition: HumanChain.subject("a").registered("checkWatch", {}).node,
  });
  const watchSeg = watchShow.segments("a")[0]!;
  const watch = watchShow.bones(
    "a",
    heldAt(watchSeg, "strokeStart", "strokeEnd"),
  );
  const eyes = Vector3.scale(
    Vector3.add(
      watch.get("leftEye")!.worldPosition,
      watch.get("rightEye")!.worldPosition,
    ),
    0.5,
  );
  const viewed = watch.get("leftHand")!.worldPosition;
  const range = Vector3.distance(eyes, viewed);
  if (
    !(
      range >= 0.3 &&
      range <= 0.4 &&
      viewed.z > watch.get("chest")!.worldPosition.z
    )
  )
    complaints.push("watch viewing distance " + range);
  for (const [row, sign] of [
    ["thumbsUp", 1],
    ["thumbsDown", -1],
  ] as const) {
    try {
      const show = new HumanPerformance({
        seed: "thumb direction",
        laws: [HumanEmblem[row]],
        performers: [
          {
            subject: "a",
            body,
            at: { x: 0, y: 0, z: 0 },
            yaw: 0,
            proficiency: { level: "trained" },
          },
        ],
        composition: HumanChain.subject("a").registered(row, {}).node,
      });
      const seg = show.segments("a")[0]!;
      const at = (event: string): number =>
        seg.start +
        seg.plan.duration *
          (seg.plan.events.find((e) => e.name === event)?.share ?? NaN);
      const bones = show.bones("a", (at("strokeStart") + at("strokeEnd")) / 2);
      const dir: IAutoMovieVector3 = Vector3.normalize(
        Vector3.subtract(
          bones.get("rightThumbDistal")!.worldPosition,
          bones.get("rightThumbProximal")!.worldPosition,
        ),
      );
      if (sign * dir.y < Math.cos(Math.PI / 6))
        complaints.push(row + " thumb vertical fraction " + dir.y);
      const folded: number = Vector3.distance(
        bones.get("rightIndexDistal")!.worldPosition,
        bones.get("rightHand")!.worldPosition,
      );
      if (folded >= 0.7 * body.measure.hand)
        complaints.push(row + " leaves the forefinger extended " + folded);
    } catch (error) {
      complaints.push(row + ": " + String(error));
    }
  }
  try {
    new HumanPerformance({
      seed: "undefined digit",
      performers: [
        {
          subject: "a",
          body,
          at: { x: 0, y: 0, z: 0 },
          yaw: 0,
          proficiency: { level: "trained" },
        },
      ],
      composition: HumanChain.subject("a").act("gesture", {
        kind: "stopPalm",
        aim: { digit: "thumb", toward: "up" },
      }).node,
    });
    complaints.push("a digit direction without a hand shape was accepted");
  } catch (error) {
    if (!(error instanceof HumanRefusal && error.axis === "aim"))
      complaints.push(String(error));
  }

  // Resolve the one standing entry once. Each seed still receives its own
  // public skill and independent named random streams, as at action entry.
  const initial: IAutoMovieMotionHumanPerformance = new HumanPerformance({
    seed: "plain",
    laws: [HumanEmblem.halt],
    performers: [
      {
        subject: "a",
        body,
        at: { x: 0, y: 0, z: 0 },
        yaw: 0,
        proficiency: { level: "trained" },
      },
    ],
    composition: HumanChain.subject("a").registered("halt", {}).node,
  });
  const entry: IAutoMovieMotionHumanSegment = initial.segments("a")[0]!;
  const read = (seed: string, variation: number): [number, number] => {
    const skill = HumanSkill.resolve({ level: "trained" }, seed);
    const plan: IAutoMovieMotionHumanActionPlan = HumanEmblem.halt.plan({
      ...entry.context,
      params: HumanEmblem.halt.resolve!(
        variation === 0 ? {} : { manner: { variation } },
      ),
      skill,
      random: (channel) => HumanSkill.stream(skill, "a", "halt", 1, channel),
      series: (channel) => ({
        random: HumanSkill.series(skill, "a", "halt", channel),
        index: 1,
      }),
    });
    const at = (event: string): number =>
      (plan.events.find((e) => e.name === event)?.share ?? NaN) * plan.duration;
    return [at("strokeStart"), at("strokeEnd") - at("strokeStart")];
  };
  const [named, stroke] = read("plain", 0);
  const prepared: number[] = [];
  for (let i: number = 0; i < 200; i++)
    try {
      const [prepare, struck] = read(`seed-${i}`, 1);
      prepared.push(prepare);

      // 2. Inside the band.
      if (!(prepare >= 0.5 * named && prepare <= 1.5 * named))
        complaints.push(
          `seed ${i}: the preparation lasts ${prepare.toFixed(3)} s, between ${(0.5 * named).toFixed(3)} and ${(1.5 * named).toFixed(3)} s expected`,
        );

      // 3. The stroke keeps its length.
      if (!(Math.abs(struck - stroke) <= 0.001))
        complaints.push(
          `seed ${i}: the stroke lasts ${struck.toFixed(4)} s, the unvaried ${stroke.toFixed(4)} s within 1 ms expected`,
        );
    } catch (error) {
      // 1. Every seed plans.
      complaints.push(
        `seed ${i}: expected to plan, got ${error instanceof Error ? error.message : String(error)}`,
      );
    }

  // 4. The seeds differ.
  const sorted: number[] = [...prepared].sort(
    (a: number, b: number): number => a - b,
  );
  let distinct: number = sorted.length === 0 ? 0 : 1;
  for (let i: number = 1; i < sorted.length; i++)
    if (sorted[i]! - sorted[i - 1]! > 1e-6) distinct++;
  if (!(distinct >= 190))
    complaints.push(
      `${distinct} of ${prepared.length} preparations are distinct, at least 190 expected`,
    );
  TestValidator.equals("stroke duration and seed dispersion", complaints, []);
}
