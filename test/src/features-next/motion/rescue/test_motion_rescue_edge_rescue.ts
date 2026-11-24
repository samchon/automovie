import { createRailPlatform } from "@automovie/archetypes";
import { Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieAffordance,
  IAutoMovieMotionEvent,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanEdgeRescue,
  IAutoMovieMotionHumanProp,
  IAutoMovieMotionHumanSegment,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanRescue,
  HumanChain,
  HumanObject,
  HumanPerformance,
  HumanRefusal,
} from "@automovie/motions";

import { assertTakeClean } from "../../../features/internal/assertTakeClean";
import { motionComplaints } from "../../../features/internal/motionComplaints";
import { motionHumanBody } from "../../../features/internal/motionHumanBody";

/** The platform's raise above the floor, metres, so a hanging body hangs clear. */
const RAISE: number = 2.6;

/** The two hands' largest gap in the shared grip, metres. */
const GRIP: number = 0.05;

/** One pair of bodies. */
interface IPair {
  /** The rescuer's fit. */
  rescuer: "m-average" | "f-small";

  /** The faller's fit. */
  faller: "m-average" | "f-small";
}

/**
 * The rescue at a ledge (#3980).
 *
 * Scenarios:
 * 1. An average man catches a small woman, and another average man: from
 *    the catch to the haul's end both right hands share one grip, the
 *    faller's feet bear on nothing, and the rescuer's hips stay behind the
 *    lip; the faller's hips rise without falling back to above the lip, and
 *    both end on the platform's top.
 * 2. A missed catch falls on to the floor and lies there.
 * 3. A small woman cannot hold an average man's pull over the lip, which is
 *    refused naming the partner; a reach that leaves the rescuer's centre of
 *    mass too close behind the lip is refused naming the reach.
 * Every take passes the shipped verdicts for both bodies.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States each scenario, the checks and the refusals.
 * @evidence contracts/development/testing.md#behavioral-verification Reads both displayed bodies against the lip, the platform's top and the floor through the plan's events, and the take through the shipped verdicts.
 * @evidence contracts/development/testing.md#independent-expectations The lip and the top are the platform's own affordances; the gaps are named here.
 * @evidence contracts/development/testing.md#distinguishing-cases Two caught pairs, a miss and both refusals.
 * @evidence contracts/development/testing.md#execution-ownership In-memory performances through the public mutual chain.
 */
export function test_motion_rescue_edge_rescue(): void {
  const all: motionComplaints.IGatherer = motionComplaints();
  const model = createRailPlatform({ id: "platform" });
  const edge: IAutoMovieAffordance = model.affordances.find(
    (a: IAutoMovieAffordance): boolean => a.id === "platformEdge",
  )!;
  const lip: IAutoMovieVector3 = Vector3.add(edge.frame.translation, {
    x: 0,
    y: RAISE,
    z: 0,
  });
  const platform: IAutoMovieMotionHumanProp = HumanObject.prop(
    "platform",
    model,
    { at: { x: 0, y: RAISE, z: 0 }, yaw: 0, fixed: true },
  );
  // The drop lies on -X of the lip; the top on +X.
  const out: IAutoMovieVector3 = { x: -1, y: 0, z: 0 };
  const perform = (
    pair: IPair,
    scene: Partial<IAutoMovieMotionHumanEdgeRescue.IScene>,
  ): HumanPerformance => {
    const rescuer: IAutoMovieMotionHumanBody = motionHumanBody(pair.rescuer);
    const faller: IAutoMovieMotionHumanBody = motionHumanBody(pair.faller);
    return new HumanPerformance({
      seed: "edge-rescue",
      performers: [
        {
          subject: "r",
          body: rescuer,
          at: { x: lip.x + 1, y: lip.y, z: 0 },
          yaw: -90,
          proficiency: { level: "trained" },
        },
        {
          subject: "f",
          body: faller,
          at: {
            x: lip.x - 0.35,
            y: lip.y - faller.measure.stature - 0.25,
            z: 0,
          },
          yaw: 90,
          proficiency: { level: "trained" },
        },
      ],
      props: [platform],
      laws: [AutoMovieMotionHumanRescue.edgeRescue.edgeRescue],
      composition: HumanChain.mutual(
        AutoMovieMotionHumanRescue.edgeRescue.rescue,
        { rescuer: HumanChain.subject("r"), faller: HumanChain.subject("f") },
        { ledge: "platform", edge: "platformEdge", ...scene },
      ).node,
    });
  };
  const rescue = (
    take: HumanPerformance,
    subject: string,
  ): IAutoMovieMotionHumanSegment =>
    take
      .segments(subject)
      .find(
        (s: IAutoMovieMotionHumanSegment): boolean =>
          s.law.name === "edgeRescue",
      )!;
  const at = (s: IAutoMovieMotionHumanSegment, name: string): number =>
    s.start +
    s.plan.events.find((e: IAutoMovieMotionEvent): boolean => e.name === name)!
      .share *
      (s.end - s.start);
  const point = (
    take: HumanPerformance,
    subject: string,
    bone: AutoMovieHumanoidBone,
    t: number,
  ): IAutoMovieVector3 => take.bones(subject, t).get(bone)!.worldPosition;

  // 1. The caught pairs.
  for (const pair of [
    { rescuer: "m-average", faller: "f-small" },
    { rescuer: "m-average", faller: "m-average" },
  ] as const satisfies readonly IPair[]) {
    const label: string = `${pair.rescuer} rescues ${pair.faller}`;
    try {
      const take: HumanPerformance = perform(pair, {});
      assertTakeClean(label, take);
      const f: IAutoMovieMotionHumanSegment = rescue(take, "f");
      const caught: number = at(f, "catch");
      const over: number = at(f, "over");
      let risen: number = -Infinity;
      for (let t: number = caught + 0.3; t <= over; t += 0.05) {
        const gap: number = Vector3.distance(
          point(take, "r", "rightHand", t),
          point(take, "f", "rightHand", t),
        );
        all.check(
          `${label}: one grip at ${t.toFixed(2)} s (${gap.toFixed(3)} m)`,
          gap <= GRIP,
        );
        all.check(
          `${label}: the faller's feet bear on nothing at ${t.toFixed(2)} s`,
          (["leftToes", "rightToes"] as const).every(
            (b: AutoMovieHumanoidBone): boolean =>
              point(take, "f", b, t).y > 0.05 &&
              point(take, "f", b, t).y < lip.y - 0.05,
          ),
        );
        all.check(
          `${label}: the rescuer's hips stay behind the lip at ${t.toFixed(2)} s`,
          Vector3.dot(Vector3.subtract(point(take, "r", "hips", t), lip), out) <
            0,
        );
        const hips: number = point(take, "f", "hips", t).y;
        if (t >= at(f, "haul"))
          all.check(
            `${label}: the haul never lets the faller back down at ${t.toFixed(2)} s`,
            hips >= risen - 0.001,
          );
        risen = Math.max(risen, hips);
      }
      const end: number = Math.max(rescue(take, "r").end, f.end);
      all.check(
        `${label}: the faller ends above the lip`,
        point(take, "f", "hips", end).y > lip.y,
      );
      for (const subject of ["r", "f"] as const)
        all.check(
          `${label}: ${subject === "r" ? "the rescuer" : "the faller"} ends on the platform's top`,
          Vector3.dot(
            Vector3.subtract(point(take, subject, "hips", end), lip),
            out,
          ) < 0,
        );
    } catch (error: unknown) {
      all.check(`${label}: ${String(error)}`, false);
    }
  }

  // 2. The missed catch.
  try {
    const take: HumanPerformance = perform(
      { rescuer: "m-average", faller: "f-small" },
      { outcome: "missed" },
    );
    assertTakeClean("a missed catch", take);
    all.check(
      "a missed faller ends lying on the floor",
      point(take, "f", "hips", rescue(take, "f").end).y <= 0.3,
    );
  } catch (error: unknown) {
    all.check(`a missed catch: ${String(error)}`, false);
  }

  // 3. The refusals.
  all.check(
    "a small rescuer holding an average man's pull is refused",
    refused(
      () =>
        perform({ rescuer: "f-small", faller: "m-average" }, {}).bones(
          "r",
          0.5,
        ),
      "partner",
    ),
  );
  all.check(
    "a reach that leaves too little margin behind the lip is refused",
    refused(
      () =>
        perform(
          { rescuer: "m-average", faller: "f-small" },
          { reach: 0.6 },
        ).bones("r", 0.5),
      "reach",
    ),
  );
  all.assert("edge rescue");
}

/**
 * Whether a rescue is refused on its scene's reach rule naming an axis: the
 * scene is computed by whichever role plans first, so either the rescuer or
 * the faller reports it.
 *
 * @param task The performance construction.
 * @param axis The named axis.
 * @returns Whether that refusal arrived with its reason and repair.
 */
function refused(task: () => unknown, axis: string): boolean {
  try {
    task();
    return false;
  } catch (error: unknown) {
    return (
      error instanceof HumanRefusal &&
      error.kind === "reach" &&
      error.axis === axis &&
      error.act === "edgeRescue" &&
      (error.performer === "r" || error.performer === "f") &&
      error.reason.trim().length > 0 &&
      error.fix.trim().length > 0
    );
  }
}
