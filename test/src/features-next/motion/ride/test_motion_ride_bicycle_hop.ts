import {
  AutoMovieArchetypeCourse,
  AutoMovieArchetypeFrame,
  AutoMovieArchetypeRefusal,
  createBicycle,
  rideBicycle,
} from "@automovie/archetypes";
import { AutoMovieGravity, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieModelPart,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanChain,
  IAutoMovieMotionHumanSegment,
  IAutoMovieRigidTransform,
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanRide,
  HumanChain,
  HumanObject,
  HumanPerformance,
  HumanSignature,
} from "@automovie/motions";
import { HumanFoot, HumanFrame } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { bicycleRiders } from "../../../features/internal/bicycleRiders";
import { collectTakeClean } from "../../../features/internal/collectTakeClean";
import { fittedBicycle } from "../../../features/internal/fittedBicycle";
import { motionHumanBody } from "../../../features/internal/motionHumanBody";
import { nclose } from "../../../features/internal/nclose";

/**
 * A standing rider hops a rigid bicycle over two marks on a level strip,
 * keeping both pedal and bar contacts through the landing and recovery.
 *
 * Scenarios:
 * 1. The separately posed tires touch the road up to the takeoff mark,
 *    cross the strip clear of it, and touch down beyond the landing mark.
 * 2. The displayed feet stay on the pedals and hands hold the bar. The
 *    pelvis stays lifted in flight and lowers back to its seated height
 *    after touchdown without a positional jump at either support boundary.
 * 3. Separate hops leave a grounded interval. A flight that starts, ends
 *    or encloses an earlier one, also on a copy of the hopped ride, is
 *    refused, as is a stationary, turning, climbing or elevated approach.
 * 4. The small woman, whose inseam lies below the saddle band, is refused
 *    the fitted bicycle at its saddle height.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the floor, marks, riding supports and adjacent invalid approaches.
 * @evidence contracts/development/testing.md#behavioral-verification Reads actual wheel parts, displayed body pose, pedal and grip frames around the two support events and through the flight.
 * @evidence contracts/development/testing.md#independent-expectations The fixed floor and marks supply support geometry. Tan et al. (2014, Table 3 and Figure 9) use the height of each tire to witness a hop (https://faculty.cc.gatech.edu/~turk/paper_pages/2014_bicycle_stunts/bicycle_stunts.pdf). Ballistics give g*T²/8 at the apex. The 5 mm wheel, 10 mm seat and 15 mm contact limits match the road take. The marked strip requires an authored 40 mm clearance.
 * @evidence contracts/development/testing.md#distinguishing-cases The same tires must be grounded before and after flight but clear the marked strip during it. A second disjoint flight is sampled above its own floor, with a grounded interval between the two. Flights inside, across the end of or around the first, including on a spread copy, and invalid approaches are refused.
 * @evidence contracts/development/testing.md#execution-ownership One seeded rigid bicycle and Human performance, with adjacent invalid courses.
 */
export function test_motion_ride_bicycle_hop(): void {
  bicycleRiders("bicycle hop", 8, (failures: string[]): void =>
    take("m-average", failures),
  );
}

/** The riding body; the small woman is refused the bicycle, pinned by `bicycleRiders`. */
type BodyKey = "m-average";

/**
 * The take on one body, its verdicts recorded.
 *
 * @param key The body.
 * @param failures Where a verdict fault is recorded.
 */
function take(key: BodyKey, failures: string[]): void {
  const body: IAutoMovieMotionHumanBody = motionHumanBody(key);
  const bicycle: ReturnType<typeof createBicycle> = fittedBicycle(body, 8);
  const course: AutoMovieArchetypeCourse.ICourse = {
    start: { x: 2, z: -4, heading: 0 },
    legs: [{ kind: "straight", length: 12 }],
    cruise: 3.2,
    startSpeed: 3.2,
    endSpeed: 3.2,
  };
  const takeoff: number = 1.25;
  const touchdown: number = 1.75;
  const flight: number = touchdown - takeoff;
  const circumference: number = Math.PI * bicycle.dimensions.wheelDiameter!;
  const coastStart: number = 0.2;
  const ground: ReturnType<typeof rideBicycle> = rideBicycle(bicycle, course, {
    chainring: 34,
    sprocket: 17,
    coast: [coastStart, 12],
  });
  const ride: ReturnType<typeof rideBicycle> = rideBicycle.hop(ground, [
    takeoff,
    touchdown,
  ]);

  const origin: IAutoMovieRigidTransform = rigid(ride.at(0).placement);
  const saddle: ReturnType<typeof HumanObject.seat> = HumanObject.seat(
    bicycle,
    origin,
  );
  const chain: IAutoMovieMotionHumanChain.IExtension<{
    bicycleEffort: typeof AutoMovieMotionHumanRide.bicycleEffort;
  }> = HumanChain.extend({
    bicycleEffort: AutoMovieMotionHumanRide.bicycleEffort,
  });
  const sit: ReturnType<typeof chain.subject> = chain.subject("cyclist").sit({
    seat: saddle,
    hold: 0.5,
  });
  const performer: ConstructorParameters<
    typeof HumanPerformance
  >[0]["performers"][number] = {
    subject: "cyclist",
    body,
    at: HumanFrame.point(
      { origin: { ...saddle.at, y: 0 }, yaw: saddle.yaw },
      { x: 0.6, y: 0, z: -0.2 },
    ),
    yaw: saddle.yaw,
    proficiency: { level: "trained" },
  };
  const depart: number = new HumanPerformance({
    seed: "bicycle-hop",
    performers: [performer],
    composition: sit.node,
  }).duration;
  const part = (id: string, film: number): IAutoMovieTransform =>
    ride.frame(id as createBicycle.Affordance, film - depart);
  const lift: number = 0.04;
  const film: HumanPerformance = new HumanPerformance({
    seed: "bicycle-hop",
    performers: [performer],
    laws: [AutoMovieMotionHumanRide.bicycleEffort],
    props: [
      HumanObject.prop(
        "bicycle",
        bicycle,
        origin,
        (seconds: number): IAutoMovieRigidTransform =>
          rigid(ride.at(seconds - depart).placement),
        part,
      ),
    ],
    composition: sit.bicycleEffort({
      on: "bicycle",
      seat: "saddle",
      feet: { left: "leftPedal", right: "rightPedal" },
      hands: { left: "leftGrip", right: "rightGrip" },
      duration: ride.duration,
      seatOff: 0.9,
      up: 1.14,
      lower: touchdown,
      seatOn: 2.14,
      lift,
    }).node,
  });
  collectTakeClean(`${key} bicycle hop film`, film, failures);
  const segment: IAutoMovieMotionHumanSegment = film.segments("cyclist")[1]!;
  const rider: ReturnType<typeof HumanSignature.of> = HumanSignature.of(
    film,
    "cyclist",
    body,
    saddle.yaw,
  );
  const saddleOffset = (at: number): number =>
    HumanSignature.region(rider, "seat", depart + at).y -
    part("saddle", depart + at).translation.y;
  const rest: number = saddleOffset(0.75);

  // Two fixed marks on the same ground plane span the strip to be cleared.
  const marks: readonly [number, number] = [0.68, 1.02];
  const wheelEnds: readonly WheelEnd[] = ["front", "rear"];
  const sides: readonly AutoMovieHumanSide[] = ["left", "right"];
  const wrist = (side: AutoMovieHumanSide, at: number): IAutoMovieVector3 =>
    Vector3.subtract(
      HumanSignature.joint(rider, depart + at, `${side}Hand`),
      part(`${side}Grip`, depart + at).translation,
    );
  const grips: readonly IAutoMovieVector3[] = sides.map(
    (side: AutoMovieHumanSide): IAutoMovieVector3 => wrist(side, 0.75),
  );
  const findings: string[] = [];
  const check = (label: string, valid: boolean): void => {
    if (!valid) findings.push(label);
  };
  check(
    "the takeoff and touchdown marks share the rider's film clock",
    nclose(segment.start, depart) &&
      nclose(film.duration - depart, ride.duration) &&
      ride.instants.some(
        (event: (typeof ride.instants)[number]): boolean =>
          event.label === "takeoff" && event.seconds === takeoff,
      ) &&
      ride.instants.some(
        (event: (typeof ride.instants)[number]): boolean =>
          event.label === "touchdown" && event.seconds === touchdown,
      ),
  );

  const lastContact: number = takeoff - 0.01;
  const firstRecovery: number = touchdown + 0.01;
  const apex: number = (takeoff + touchdown) / 2;
  const beats: readonly (readonly [string, number, number])[] = [
    ["approach", lastContact, lift],
    ["takeoff", takeoff, lift],
    ["ascent", takeoff + flight / 4, lift],
    ["apex", apex, lift],
    ["descent", touchdown - flight / 4, lift],
    ["touchdown", touchdown, lift],
    ["early recovery", firstRecovery, lift],
    ["seated recovery", 2.2, 0],
    ["apex repeated", apex, lift],
  ];
  for (const [name, at, clearance] of beats) {
    const free: boolean = takeoff < at && at < touchdown;
    const tau: number = at - takeoff;
    const expected: number = free
      ? (AutoMovieGravity.STANDARD * tau * (flight - tau)) / 2
      : 0;
    const sample: ReturnType<typeof ride.at> = ride.at(at);
    check(
      `${name}: the crank remains at the freewheel phase`,
      nclose(
        sample.archetype.travel("crank"),
        (coastStart * 360) / (2 * circumference),
      ),
    );
    check(
      `${name}: the carrier preserves its forward path and land speed`,
      nclose(sample.placement.translation.z, -4 + 3.2 * at) &&
        nclose(sample.course.speed, 3.2),
    );
    for (const end of wheelEnds) {
      const tire: IAutoMovieVector3 = tirePoint(sample, end);
      check(
        `${name}: ${end} tire height differs from the ballistic or supported height`,
        nclose(tire.y, expected, 0.005),
      );
      check(
        `${name}: ${end} wheel keeps its phase`,
        nclose(
          sample.archetype.travel(`${end}Spin`),
          ((course.cruise * at * 360) / circumference) % 360,
        ),
      );
    }
    check(
      `${name}: the displayed pelvis changes support relative to the saddle`,
      nclose(saddleOffset(at) - rest, clearance, 0.01),
    );
    const shown: ReturnType<typeof HumanSignature.bones> = HumanSignature.bones(
      rider,
      depart + at,
    );
    for (const [index, side] of sides.entries()) {
      const sole: ReturnType<typeof HumanFoot.sockets> = HumanFoot.sockets(
        body,
        shown,
        side,
      );
      const ball: IAutoMovieVector3 = sole.find(
        (socket: (typeof sole)[number]): boolean => socket.socket === "ball",
      )!.point;
      check(
        `${name}: ${side} ball remains on the pedal`,
        Vector3.distance(ball, part(`${side}Pedal`, depart + at).translation) <=
          0.015,
      );
      const hand: IAutoMovieVector3 = wrist(side, at);
      check(
        `${name}: ${side} hand stays on the bar`,
        Vector3.length(hand) <= body.measure.hand * 0.7 &&
          Vector3.distance(hand, grips[index]!) <= 0.015,
      );
    }
  }

  for (const end of wheelEnds) {
    const start: IAutoMovieVector3 = tirePoint(ride.at(takeoff), end);
    const stop: IAutoMovieVector3 = tirePoint(ride.at(touchdown), end);
    const atMark = (z: number): number =>
      takeoff + (z - start.z) / course.cruise;
    check(
      `${end} tire passes both surface marks within the flight window`,
      start.z < marks[0] &&
        marks[1] < stop.z &&
        marks.every(
          (z: number): boolean => tirePoint(ride.at(atMark(z)), end).y > 0.04,
        ),
    );
    for (const boundary of [takeoff, touchdown]) {
      const before: IAutoMovieVector3 = tirePoint(
        ride.at(boundary - 0.0001),
        end,
      );
      const after: IAutoMovieVector3 = tirePoint(
        ride.at(boundary + 0.0001),
        end,
      );
      check(
        `${end} tire continues through the takeoff or touchdown pose`,
        Vector3.distance(before, after) < 0.001,
      );
    }
  }
  for (const boundary of [takeoff, touchdown]) {
    const before: IAutoMovieVector3 = HumanSignature.region(
      rider,
      "seat",
      depart + boundary - 0.0001,
    );
    const after: IAutoMovieVector3 = HumanSignature.region(
      rider,
      "seat",
      depart + boundary + 0.0001,
    );
    check(
      "the displayed pelvis continues through the support boundary",
      Vector3.distance(before, after) < 0.001,
    );
  }

  const again: readonly [number, number] = [2.3, 2.8];
  const repeated: ReturnType<typeof rideBicycle> = rideBicycle.hop(ride, again);
  const repeatedEvents: typeof repeated.instants = repeated.instants.filter(
    (event: (typeof repeated.instants)[number]): boolean =>
      event.label === "takeoff" || event.label === "touchdown",
  );
  check(
    "the repeated hop preserves only the two actual airborne intervals",
    repeatedEvents.length === 4 &&
      repeatedEvents[0]!.label === "takeoff" &&
      repeatedEvents[0]!.seconds === takeoff &&
      repeatedEvents[1]!.label === "touchdown" &&
      repeatedEvents[1]!.seconds === touchdown &&
      repeatedEvents[2]!.label === "takeoff" &&
      repeatedEvents[2]!.seconds === again[0] &&
      repeatedEvents[3]!.label === "touchdown" &&
      repeatedEvents[3]!.seconds === again[1],
  );
  for (const end of wheelEnds) {
    const clearance: number = (AutoMovieGravity.STANDARD * flight ** 2) / 8;
    const secondApex: number = (again[0] + again[1]) / 2;
    check(
      `${end} tire lands between repeated hops and clears each apex`,
      nclose(tirePoint(repeated.at(apex), end).y, clearance, 0.005) &&
        nclose(tirePoint(repeated.at(2), end).y, 0, 0.005) &&
        nclose(tirePoint(repeated.at(secondApex), end).y, clearance, 0.005) &&
        nclose(tirePoint(repeated.at(again[1]), end).y, 0, 0.005),
    );
  }
  // A copy of the hopped ride carries its flight in its published instants.
  const copied: ReturnType<typeof rideBicycle> = { ...ride };
  for (const [base, overlapping] of [
    [ride, [takeoff + 0.1, touchdown - 0.1]],
    [ride, [takeoff + 0.1, touchdown + 0.1]],
    [ride, [takeoff - 0.1, touchdown + 0.1]],
    [copied, [takeoff - 0.1, touchdown + 0.1]],
  ] as const) {
    let refusal: unknown;
    try {
      rideBicycle.hop(base, overlapping);
    } catch (error) {
      refusal = error;
    }
    check(
      `overlapping flight ${overlapping.join("-")} s is refused before publishing another takeoff`,
      refusal instanceof AutoMovieArchetypeRefusal &&
        refusal.axis === "hop.interval" &&
        base.instants.filter(
          (event: (typeof base.instants)[number]): boolean =>
            event.label === "takeoff",
        ).length === 1,
    );
  }

  const moving: ReturnType<typeof rideBicycle> = rideBicycle(bicycle, {
    ...course,
    legs: [{ kind: "turn", radius: 8, angle: 90 }],
  });
  const stopped: ReturnType<typeof rideBicycle> = rideBicycle(bicycle, {
    ...course,
    startSpeed: 0,
    acceleration: 2,
  });
  const climbing: ReturnType<typeof rideBicycle> = rideBicycle(bicycle, {
    ...course,
    legs: [{ kind: "straight", length: 12, rise: 1 }],
  });

  const elevated: ReturnType<typeof rideBicycle> = {
    ...ground,
    at: (at: number): ReturnType<typeof ground.at> => {
      const shown: ReturnType<typeof ground.at> = ground.at(at);
      const placement: IAutoMovieTransform = shown.placement;
      return {
        ...shown,
        placement: {
          ...placement,
          translation: {
            ...placement.translation,
            y: placement.translation.y + (0.03 * (at - takeoff)) / flight,
          },
        },
      };
    },
  };

  for (const [base, interval] of [
    [elevated, [takeoff, touchdown]],
    [climbing, [takeoff, touchdown]],
    [moving, [takeoff, touchdown]],
    [stopped, [0, flight]],
  ] as const) {
    let refusal: unknown;
    try {
      rideBicycle.hop(base, interval);
    } catch (error) {
      refusal = error;
    }
    check(
      "the hop refuses a stationary, turning, climbing or elevated approach",
      refusal instanceof AutoMovieArchetypeRefusal &&
        refusal.axis === "hop.approach",
    );
  }
  TestValidator.equals("off-road bicycle observations", findings, []);
}

/** The bicycle wheel whose tire a check reads. */
type WheelEnd = "front" | "rear";

/** A provider's world pose in the rigid format the performer consumes. */
function rigid(transform: IAutoMovieTransform): IAutoMovieRigidTransform {
  return { position: transform.translation, rotation: transform.rotation };
}

/** Lowest point of a posed tire, whose axle stays level in the straight hop. */
function tirePoint(
  sample: ReturnType<ReturnType<typeof rideBicycle>["at"]>,
  end: WheelEnd,
): IAutoMovieVector3 {
  const tire: IAutoMovieModelPart = sample.archetype.parts.find(
    (part: IAutoMovieModelPart): boolean => part.id === `wheel-${end}`,
  )!;
  if (
    tire.geometry.type !== "primitive" ||
    tire.geometry.shape.type !== "cylinder" ||
    tire.transform === null
  )
    throw new Error("The bicycle tire must be a placed cylinder.");
  const wheel: IAutoMovieTransform = AutoMovieArchetypeFrame.compose(
    sample.placement,
    tire.transform,
  );
  const axis: IAutoMovieVector3 = AutoMovieArchetypeFrame.axis(wheel, "y");
  if (!nclose(axis.y, 0))
    throw new Error("The hop must keep the tire axis level.");
  return {
    ...wheel.translation,
    y: wheel.translation.y - tire.geometry.shape.radius,
  };
}
