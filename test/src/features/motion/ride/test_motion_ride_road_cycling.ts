import {
  AutoMovieArchetypeCourse,
  AutoMovieArchetypeFrame,
  createBicycle,
  rideBicycle,
} from "@automovie/archetypes";
import { AutoMovieGravity, Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieModelPart,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanChain,
  IAutoMovieMotionHumanContactWindow,
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

import { bicycleRiders } from "../../internal/bicycleRiders";
import { collectTakeClean } from "../../internal/collectTakeClean";
import { fittedBicycle } from "../../internal/fittedBicycle";
import { motionHumanBody } from "../../internal/motionHumanBody";
import { nclose } from "../../internal/nclose";
import { vclose } from "../../internal/vclose";

/**
 * One road take begins rolling, accelerates through seated and standing
 * pedalling, starts freewheeling while standing, reseats, and brakes into a
 * flat turn.
 *
 * Scenarios:
 *
 * 1. The rolling start and powered effort move both wheels and change the pedal
 *    phase. During the brake and turn, the wheels keep rolling and the pedals
 *    hold.
 * 2. Both displayed soles and hands follow the bicycle throughout the effort,
 *    coast and turn. The pelvis clears the saddle in the effort and settles
 *    again.
 * 3. Both posed tires stay within 5 mm of the road. The cycle is upright on the
 *    straight and leans inward at the speed and radius of the turn.
 * 4. The small woman, whose inseam lies below the saddle band, is refused the
 *    fitted bicycle at its saddle height.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the authored phases, supports and road-height tolerance.
 * @evidence contracts/development/testing.md#behavioral-verification Observes wheel geometry, crank travel, moving contact frames and resolved Human poses at named beats and repeated film seconds.
 * @evidence contracts/development/testing.md#independent-expectations The course distances, gearing, circular wheel and pedal geometry, constant-deceleration speed and steady-turn balance give the analytic expectations. Human contact bounds reuse the existing bicycle effort tolerance.
 * @evidence contracts/development/testing.md#distinguishing-cases The powered straight and freewheel interval distinguish crank travel from wheel travel, the standing interval distinguishes feet and hands from seat support, and the turn contrasts with upright straight travel.
 * @evidence contracts/development/testing.md#execution-ownership Only a seeded production archetype, its authored course and the average Human performance.
 */
export function test_motion_ride_road_cycling(): void {
  bicycleRiders("road cycling", 8, (failures: string[]): void =>
    take("m-average", failures),
  );
}

/**
 * The riding body; the small woman is refused the bicycle, pinned by
 * `bicycleRiders`.
 */
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
  const startSpeed: number = 0.75;
  const cruise: number = 3.2;
  const turnSpeed: number = 2.2;
  const acceleration: number = 2;
  const deceleration: number = 1.5;
  const radius: number = 3.5;
  const straight: number = 8;
  const arc: number = (Math.PI * radius) / 3;
  const coastStart: number = 5;
  const route: AutoMovieArchetypeCourse.IPlan = AutoMovieArchetypeCourse.plan(
    "bicycle",
    {
      start: { x: 0, z: 0, heading: 0 },
      legs: [
        { kind: "straight", length: coastStart },
        { kind: "straight", length: straight - coastStart },
        { kind: "turn", radius, angle: 60 },
        { kind: "straight", length: 2 },
      ],
      startSpeed,
      cruise,
      acceleration,
      deceleration,
      speeds: [cruise, turnSpeed, turnSpeed, 0],
    },
  );
  const ride: ReturnType<typeof rideBicycle> = rideBicycle(bicycle, route, {
    chainring: 34,
    sprocket: 17,
    coast: [coastStart, route.length],
  });
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
    seed: "road-cycling",
    performers: [performer],
    composition: sit.node,
  }).duration;
  const part = (id: string, film: number): IAutoMovieTransform =>
    ride.frame(id as createBicycle.Affordance, film - depart);
  const prop: ReturnType<typeof HumanObject.prop> = HumanObject.prop(
    "bicycle",
    bicycle,
    origin,
    (film: number): IAutoMovieRigidTransform =>
      rigid(ride.at(film - depart).placement),
    part,
  );
  // Fit the rise to the second pedal revolution and freewheel before the
  // right pedal sweeps rearward beyond this rider's standing reach.
  const standsAt: number = 4.97;
  const lowersAt: number = 5.3;
  const reseatsAt: number = 5.83;
  const seatOff: number = route.when(4.42);
  const seatOn: number = route.when(reseatsAt);
  const lift: number = 0.04;
  const performance: HumanPerformance = new HumanPerformance({
    seed: "road-cycling",
    performers: [performer],
    laws: [AutoMovieMotionHumanRide.bicycleEffort],
    props: [prop],
    composition: sit.bicycleEffort({
      on: "bicycle",
      seat: "saddle",
      feet: { left: "leftPedal", right: "rightPedal" },
      hands: { left: "leftGrip", right: "rightGrip" },
      duration: ride.duration,
      seatOff,
      up: route.when(standsAt),
      lower: route.when(lowersAt),
      seatOn,
      lift,
    }).node,
  });
  collectTakeClean(`${key} road cycling performance`, performance, failures);
  const segment: IAutoMovieMotionHumanSegment =
    performance.segments("cyclist")[1]!;
  const rider: ReturnType<typeof HumanSignature> = HumanSignature(
    performance,
    "cyclist",
    body,
    saddle.yaw,
  );
  const circumference: number = Math.PI * bicycle.dimensions.wheelDiameter!;
  const brakingDistance: number =
    (cruise ** 2 - turnSpeed ** 2) / (2 * deceleration);
  const remaining: number = brakingDistance / 2;
  const findings: string[] = [];
  const check = (label: string, valid: boolean): void => {
    if (!valid) findings.push(label);
  };

  /**
   * Displayed rider point relative to an actual bicycle contact in the
   * carrier's axes.
   */
  const relative = (
    id: createBicycle.Affordance,
    point: IAutoMovieVector3,
    film: number,
  ): IAutoMovieVector3 =>
    Quaternion.rotateVector(
      Quaternion.inverse(ride.at(film - depart).placement.rotation),
      Vector3.subtract(point, part(id, film).translation),
    );
  const seatedFilm: number = depart + route.when(1.5);
  const seated: IAutoMovieVector3 = relative(
    "saddle",
    HumanSignature.region(rider, "seat", seatedFilm),
    seatedFilm,
  );
  const sides: readonly AutoMovieHumanSide[] = ["left", "right"];
  const wrist = (side: AutoMovieHumanSide, film: number): IAutoMovieVector3 =>
    relative(
      `${side}Grip`,
      HumanSignature.joint(rider, film, `${side}Hand`),
      film,
    );
  const grips: IAutoMovieVector3[] = sides.map(
    (side: AutoMovieHumanSide): IAutoMovieVector3 => wrist(side, seatedFilm),
  );

  check(
    "the rider and bicycle share the start and stop clock",
    nclose(segment.start, depart) &&
      nclose(performance.duration, depart + ride.duration),
  );
  const seatWindows: IAutoMovieMotionHumanContactWindow[] =
    segment.plan.contacts.filter(
      (window: IAutoMovieMotionHumanContactWindow): boolean =>
        window.part === "seat",
    );
  check(
    "the saddle carries the rider before and after the standing interval",
    vclose(
      seated,
      relative(
        "saddle",
        HumanSignature.region(rider, "seat", depart - 1e-6),
        depart - 1e-6,
      ),
      0.01,
    ) &&
      seatWindows.length === 2 &&
      nclose(seatWindows[0]!.from, 0) &&
      nclose(seatWindows[0]!.to, seatOff / ride.duration) &&
      nclose(seatWindows[1]!.from, seatOn / ride.duration) &&
      nclose(seatWindows[1]!.to, 1),
  );
  const poweredStanding: number = (standsAt + coastStart) / 2;
  const beats: readonly (readonly [string, number, number, boolean?])[] = [
    ["rolling start", 0, startSpeed],
    ["turn", straight + arc / 2, turnSpeed],
    ["standing and pedalling", poweredStanding, cruise, true],
    ["standing and coasting", (coastStart + lowersAt) / 2, cruise, true],
    [
      "seated acceleration",
      1.5,
      Math.sqrt(startSpeed ** 2 + 2 * acceleration * 1.5),
    ],
    [
      "braking",
      straight - remaining,
      Math.sqrt(turnSpeed ** 2 + 2 * deceleration * remaining),
    ],
    ["reseated", reseatsAt + 0.05, cruise],
    ["stopped", straight + arc + 2, 0],
    ["standing power repeated", poweredStanding, cruise, true],
  ];
  for (const [name, distance, speed, raised] of beats) {
    const second: number = route.when(distance);
    const film: number = depart + second;
    const sample: ReturnType<typeof ride.at> = ride.at(second);
    const crank: number =
      (Math.min(distance, coastStart) / (2 * circumference)) * 360;
    const wheel: number = (distance / circumference) * 360;
    check(
      `${name}: speed is ${sample.course.speed}, expected ${speed}`,
      nclose(sample.course.speed, speed, 1e-6),
    );
    check(
      `${name}: crank follows powered travel`,
      nclose(sample.archetype.travel("crank"), crank % 360, 1e-6),
    );
    for (const end of ["front", "rear"] as const) {
      const height: number = tireBottom(
        sample.archetype.parts.find(
          (p: IAutoMovieModelPart): boolean => p.id === `wheel-${end}`,
        )!,
        sample.placement,
      );
      check(
        `${name}: ${end} tire rolls and stays on the road (height ${height})`,
        nclose(sample.archetype.travel(`${end}Spin`), wheel % 360, 1e-6) &&
          Math.abs(height) <= 0.005,
      );
    }
    const up: IAutoMovieVector3 = AutoMovieArchetypeFrame.axis(
      sample.placement,
      "y",
    );
    const turning: boolean = straight < distance && distance < straight + arc;
    const inward: IAutoMovieVector3 = Vector3.subtract(
      { x: radius, y: 0, z: straight },
      sample.placement.translation,
    );
    check(
      `${name}: bicycle banks inward only on the turn`,
      turning
        ? nclose(
            up.y,
            Math.cos(
              Math.atan(speed ** 2 / (radius * AutoMovieGravity.STANDARD)),
            ),
            1e-8,
          ) && Vector3.dot(up, inward) > 0
        : vclose(up, { x: 0, y: 1, z: 0 }, 1e-8),
    );
    const seat: IAutoMovieVector3 = relative(
      "saddle",
      HumanSignature.region(rider, "seat", film),
      film,
    );
    check(
      `${name}: displayed pelvis ${raised ? "clears" : "meets"} the saddle (${seat.y - seated.y} m)`,
      raised
        ? nclose(seat.y - seated.y, lift, 0.01)
        : vclose(seat, seated, 0.01),
    );
    for (const [index, side] of sides.entries()) {
      const pedal: IAutoMovieVector3 = part(`${side}Pedal`, film).translation;
      const offset: IAutoMovieVector3 = relative("crank", pedal, film);
      const sign: number = side === "left" ? 1 : -1;
      const swing: number = (crank * Math.PI) / 180;
      const arm: number = bicycle.dimensions.crank!;
      check(
        `${name}: ${side} pedal follows the crank phase`,
        nclose(offset.y, sign * arm * Math.cos(swing), 1e-6) &&
          nclose(offset.z, sign * arm * Math.sin(swing), 1e-6),
      );
      const sole: ReturnType<typeof HumanFoot.sockets> = HumanFoot.sockets(
        body,
        HumanSignature.bones(rider, film),
        side,
      );
      const ball: IAutoMovieVector3 = sole.find(
        (socket): boolean => socket.socket === "ball",
      )!.point;
      const pedalGap: number = Vector3.distance(ball, pedal);
      check(
        `${name}: ${side} sole stays on the pedal (${pedalGap} m)`,
        pedalGap <= 0.015,
      );
      if (distance > 0) {
        const hand: IAutoMovieVector3 = wrist(side, film);
        const drift: number = Vector3.distance(hand, grips[index]!);
        check(
          `${name}: ${side} hand keeps its hold on the bar (${drift} m drift)`,
          Vector3.length(hand) <= body.measure.hand * 0.7 && drift <= 0.015,
        );
      }
    }
  }
  TestValidator.equals("road cycling observations", findings, []);
}

/** Read the root placement as the rigid transform that the rider consumes. */
function rigid(transform: IAutoMovieTransform): IAutoMovieRigidTransform {
  return { position: transform.translation, rotation: transform.rotation };
}

/** Lowest point of the posed cylindrical tire in world coordinates. */
function tireBottom(
  part: IAutoMovieModelPart,
  placement: IAutoMovieTransform,
): number {
  if (
    part.geometry.type !== "primitive" ||
    part.geometry.shape.type !== "cylinder" ||
    part.transform === null
  )
    throw new Error("The bicycle tire must be a placed cylinder.");
  const world: IAutoMovieTransform = AutoMovieArchetypeFrame.compose(
    placement,
    part.transform,
  );
  const axis: IAutoMovieVector3 = AutoMovieArchetypeFrame.axis(world, "y");
  const { radius, height }: typeof part.geometry.shape = part.geometry.shape;
  return (
    world.translation.y -
    radius * Math.hypot(axis.x, axis.z) -
    (height / 2) * Math.abs(axis.y)
  );
}
