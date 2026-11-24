import { createBed } from "@automovie/archetypes";
import { Vector3, resolveAutoMovieHumanoidSurfaces } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanSegment,
  IAutoMovieMotionHumanSignature,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanSeat,
  HumanChain,
  HumanPerformance,
  HumanSignature,
} from "@automovie/motions";
import { HumanFoot, HumanFrame } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../../../features/internal/motionHumanBody";

/**
 * A person can sit on either long edge of a double bed with both feet
 * outside its footprint, pause on the mattress, and stand on the same side.
 *
 * Scenarios:
 * 1. A standing adult perches on each edge of a translated, rotated double
 *    bed. During the pause the seat region stays within 10 mm of the upper
 *    plane, inside the chosen half of the mattress. The feet touch the floor
 *    outside the edge and slip at most 5 mm during the hold.
 * 2. The seated hold lasts the authored 0.8 seconds, then the person stands
 *    outside that edge with both feet bearing on the floor and knees within
 *    15 degrees of straight.
 * 3. A crib has no adult seat along its edge and the request is refused.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the bed geometry, both performances, physical bounds and the unavailable seat case.
 * @evidence contracts/development/testing.md#behavioral-verification Exercises the public composition in a performance and reads the displayed seat and feet. A reversed edge, off-mattress seat, foot slip or missing rise fails.
 * @evidence contracts/development/testing.md#independent-expectations Uses the double bed's fixed 1.35 by 1.90 m dimensions and fixture height to define the planes, the campaign's 10 mm contact and 5 mm slip bounds, and a provisional 15 degree standing knee margin. Checks corresponding displayed sole points and corners.
 * @evidence contracts/development/testing.md#distinguishing-cases Opposite edges of a placed bed and a model with no edge seat. Other seat tests own high mounts and differing statures.
 * @evidence contracts/development/testing.md#execution-ownership In-memory feature test builds two performances for one polygon man and checks an authoring refusal.
 */
export function test_motion_seat_bedside_perch(): void {
  const height: number = 0.46;
  const bed: ReturnType<typeof createBed> = createBed({
    kind: "double",
    height,
  });
  const origin: IAutoMovieVector3 = { x: 1.5, y: 0, z: -2 };
  const yaw: number = 37;
  const halfWidth: number = 1.35 / 2;
  const hold: number = 0.8;
  const body: IAutoMovieMotionHumanBody = motionHumanBody("m-average");

  for (const [side, sign] of [
    ["left", 1],
    ["right", -1],
  ] as const) {
    const facing: number = yaw + sign * 90;
    const performance: HumanPerformance = new HumanPerformance({
      seed: "bedside-perch",
      performers: [
        {
          subject: "actor",
          body,
          at: HumanFrame.point(
            { origin, yaw },
            { x: sign * (halfWidth + 0.2), y: 0, z: 0 },
          ),
          yaw: facing,
          proficiency: { level: "trained" },
        },
      ],
      composition: AutoMovieMotionHumanSeat.bedsidePerch(
        HumanChain.subject("actor"),
        bed,
        { at: origin, yaw },
        side,
        hold,
      ).node,
    });
    const reader: IAutoMovieMotionHumanSignature.IReader = HumanSignature.of(
      performance,
      "actor",
      body,
      facing,
    );
    const [sitting, rising]: readonly IAutoMovieMotionHumanSegment[] =
      performance.segments("actor");
    const sat: IAutoMovieMotionHumanSegment = sitting!;
    const stood: IAutoMovieMotionHumanSegment = rising!;
    const settled: number =
      sat.start +
      sat.plan.duration *
        sat.plan.events.find((event): boolean => event.name === "seated")!
          .share;
    TestValidator.predicate(
      `${side} seated hold`,
      () => Math.abs(sat.end - settled - hold) < 1e-6,
    );

    // Project into the bed's frame independently of the seat affordance.
    const local = (point: IAutoMovieVector3): IAutoMovieVector3 =>
      HumanFrame.local({ origin, yaw }, point);
    const feet: readonly ["left", "right"] = ["left", "right"];
    const footprint = (
      bones: ReturnType<HumanPerformance["bones"]>,
      foot: (typeof feet)[number],
    ): IAutoMovieVector3[] => [
      ...HumanFoot.sockets(body, bones, foot).map(
        (socket): IAutoMovieVector3 => local(socket.point),
      ),
      ...HumanFoot.outline(body, foot).map(
        (frame): IAutoMovieVector3 =>
          local(
            resolveAutoMovieHumanoidSurfaces.place(
              frame,
              bones.get(frame.bone)!,
            ).point,
          ),
      ),
    ];
    const footOnFloor = (sole: readonly IAutoMovieVector3[]): boolean =>
      sole.every(
        (point): boolean => sign * point.x > halfWidth && point.y >= -0.01,
      ) && Math.abs(Math.min(...sole.map((point): number => point.y))) <= 0.01;
    const from: number = settled + 0.02;
    const to: number = sat.end - 0.02;
    const first = performance.bones("actor", from);
    const start: IAutoMovieVector3[][] = feet.map((foot) =>
      footprint(first, foot),
    );
    for (const t of new Set([...HumanSignature.times(from, to, 12), to])) {
      const bones = t === from ? first : performance.bones("actor", t);
      const contact = body.surfaces.regions.seat;
      const seat: IAutoMovieVector3 = local(
        resolveAutoMovieHumanoidSurfaces.place(
          contact,
          bones.get(contact.bone)!,
        ).point,
      );
      TestValidator.predicate(
        `${side} seat on mattress at ${t}`,
        () =>
          Math.abs(seat.y - height) <= 0.01 &&
          sign * seat.x > 0 &&
          sign * seat.x < halfWidth &&
          Math.abs(seat.z) < 0.95,
      );
      for (const [index, foot] of feet.entries()) {
        const sole: IAutoMovieVector3[] = footprint(bones, foot);
        TestValidator.predicate(
          `${side} ${foot} foot outside bed at ${t}`,
          () =>
            footOnFloor(sole) &&
            sole.every(
              (point, corner): boolean =>
                Vector3.length(
                  Vector3.subtract(point, start[index]![corner]!),
                ) <= 0.005,
            ),
        );
      }
    }
    const ending = performance.bones("actor", stood.end);
    for (const foot of feet) {
      TestValidator.predicate(
        `${side} stands on ${foot} foot outside bed`,
        () =>
          footOnFloor(footprint(ending, foot)) &&
          HumanSignature.knee(reader, stood.end, foot) <= 15,
      );
    }
  }
  TestValidator.error("a crib has no seat at its edge", (): void => {
    AutoMovieMotionHumanSeat.bedsidePerch(
      HumanChain.subject("actor"),
      createBed({ kind: "crib" }),
      { at: origin, yaw },
      "left",
    );
  });
}
