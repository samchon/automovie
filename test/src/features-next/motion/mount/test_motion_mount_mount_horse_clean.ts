import { createHorse } from "@automovie/archetypes";
import { physicalShapeSegmentDistance } from "@automovie/engine";
import type {
  IAutoMovieMotionEvent,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanProp,
  IAutoMovieMotionHumanSeated,
  IAutoMovieMotionHumanSegment,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  HumanChain,
  HumanObject,
  HumanPerformance,
  HumanVerdicts,
} from "@automovie/motions";
import { HumanFrame } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { assertTakeClean } from "../../../features/internal/assertTakeClean";
import { motionHumanBody } from "../../../features/internal/motionHumanBody";

/** The horse at the origin, facing `+Z`. */
const PLACED: IAutoMovieRigidTransform = {
  position: { x: 0, y: 0, z: 0 },
  rotation: { x: 0, y: 0, z: 0, w: 1 },
};

/**
 * Getting onto a horse's saddle from the ground beside it, the sit's
 * high-seat path: the take passes the shipped verdicts, a foot that has
 * left the floor for its stirrup is no longer declared on the floor, and
 * while the legs cross to their places each shank clears the horse and its
 * saddle by the skin's give (`HumanVerdicts.SKIN`).
 *
 * Scenario, on the average man: a 1.65 m horse (seed 8) stands still; the
 * rider stands 0.6 m to the saddle's left and 0.2 m behind it, facing the
 * saddle's heading, and sits on it.
 *
 * Cases:
 * 1. The take passes `assertTakeClean`, the shipped verdict report.
 * 2. Every ground plant of a foot, on support at most 5 cm high, ends with
 *    that foot's ankle no higher than twice the body's ankle height.
 * 3. At every 1/24 s from the sit's `commit` event to its `seatContact`
 *    event, each shank, its knee-to-ankle axis less the shank radius, keeps
 *    its distance to every horse shape no deeper than `-HumanVerdicts.SKIN`.
 *
 * Every failing case is collected, and the test fails once with the list.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Lists the scenario and its three cases with their bounds, sampling and failure report.
 * @evidence contracts/development/testing.md#behavioral-verification Reads the displayed take through the shipped verdict report and the sit's declared plants.
 * @evidence contracts/development/testing.md#independent-expectations The verdicts' own limits; a plant on the floor ends no later than its foot's last second within an ankle's height of the floor; a shank's surface, its collider radius off its axis, enters the horse's own shapes by no more than the skin's give.
 * @evidence contracts/development/testing.md#distinguishing-cases A stirrup plant against a floor plant of the same foot.
 * @evidence contracts/development/testing.md#execution-ownership In-memory archetype and Human performance; no host.
 */
export function test_motion_mount_mount_horse_clean(): void {
  const body: IAutoMovieMotionHumanBody = motionHumanBody("m-average");
  const horse: ReturnType<typeof createHorse> = createHorse(
    { withersHeight: 1.65 },
    8,
  );
  // The saddle is the horse's: its carrier, which the climb clears.
  const seat: IAutoMovieMotionHumanSeated.ISeat = HumanObject.seat(
    horse,
    PLACED,
    undefined,
    "horse",
  );
  const prop: IAutoMovieMotionHumanProp = HumanObject.prop(
    "horse",
    horse,
    PLACED,
  );
  const film: HumanPerformance = new HumanPerformance({
    seed: "mount",
    props: [prop],
    performers: [
      {
        subject: "a",
        body,
        at: HumanFrame.point(
          { origin: { ...seat.at, y: 0 }, yaw: seat.yaw },
          { x: 0.6, y: 0, z: -0.2 },
        ),
        yaw: seat.yaw,
        proficiency: { level: "trained" },
      },
    ],
    composition: HumanChain.subject("a").sit({ seat }).node,
  });
  const failures: string[] = [];
  try {
    assertTakeClean("mounting a horse", film);
  } catch (error) {
    failures.push(error instanceof Error ? error.message : String(error));
  }

  // Each floor plant ends while its foot is still on the floor.
  const sat: IAutoMovieMotionHumanSegment = film.segments("a")[0]!;
  for (const window of sat.plan
    .contacts as readonly IAutoMovieMotionHumanContactWindow[]) {
    if (
      window.kind !== "plant" ||
      window.support.kind !== "ground" ||
      (window.support.height ?? 0) > 0.05 ||
      (window.part !== "leftFoot" && window.part !== "rightFoot")
    )
      continue;
    const end: number = sat.start + window.to * sat.plan.duration;
    const ankle: number = film.bones("a", end).get(window.part)!.worldPosition
      .y;
    if (ankle > 2 * body.measure.ankleHeight)
      failures.push(
        `the ${window.part} floor plant runs to ${end.toFixed(2)} s with the ankle ${ankle.toFixed(3)} m up`,
      );
  }
  // While the legs cross to their places, from the first foot leaving the
  // floor to the seat's contact, each shank clears the horse and its saddle
  // by no less than the skin's give.
  const share = (name: string): number =>
    sat.plan.events.find(
      (e: IAutoMovieMotionEvent): boolean => e.name === name,
    )!.share * sat.plan.duration;
  for (let t: number = share("commit"); t < share("seatContact"); t += 1 / 24) {
    const bones: ReturnType<typeof film.bones> = film.bones("a", sat.start + t);
    for (const side of ["left", "right"] as const) {
      const knee: IAutoMovieVector3 = bones.get(
        `${side}LowerLeg`,
      )!.worldPosition;
      const ankle: IAutoMovieVector3 = bones.get(`${side}Foot`)!.worldPosition;
      let gap: number = Infinity;
      for (const shape of prop.shapes ?? [])
        gap = Math.min(
          gap,
          physicalShapeSegmentDistance(PLACED, shape, knee, ankle) -
            body.measure.shankRadius,
        );
      if (gap < -HumanVerdicts.SKIN)
        failures.push(
          `the ${side} shank is ${(-gap * 1000).toFixed(1)} mm inside the horse at ${t.toFixed(2)} s`,
        );
    }
  }
  TestValidator.equals("mounting a horse", failures, []);
}
