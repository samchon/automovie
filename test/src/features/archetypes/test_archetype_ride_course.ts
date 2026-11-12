import {
  ArchetypeCourse,
  ArchetypeFrame,
  ArchetypeRefusal,
  ArchetypeRide,
  createBicycle,
  createCar,
  createCart,
  createMotorcycle,
  driveCar,
  rideBicycle,
  rideMotorcycle,
} from "@automovie/archetypes";
import { Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { nclose, vclose } from "../internal/predicates";

/** A course along +Z for 20 m, a quarter turn to the left on a 10 m radius, then 15 m straight. */
const COURSE: ArchetypeCourse.ICourse = {
  start: { x: 0, z: 0, heading: 0 },
  legs: [
    { kind: "straight", length: 20 },
    { kind: "turn", radius: 10, angle: 90 },
    { kind: "straight", length: 15 },
  ],
  cruise: 6,
  acceleration: 2,
  deceleration: 3,
};

/**
 * A moving support follows its course, and what a person operates on it moves as the course demands.
 *
 * Scenarios:
 * 1. Course geometry: the path is 20 + 5 pi + 15 m long; it ends at (10 + 15, 30) on (X, Z) facing 90 degrees, a quarter turn to the left of `+Z` being `+X`; halfway round the turn the root is 10 m from the turn's centre at (10, 20).
 * 2. Speed profile: the support starts and ends at rest, reaches the cruising speed after cruise over acceleration seconds, never exceeds it, and its distance never decreases; the running time is the trapezoid's. The instants run `depart`, `cruise`, `turn2Start`, `turn2End`, `brake`, `stop` in time order. A course too short to reach its cruising speed peaks at the square root of 2 L a b / (a + b); its instants are `depart`, `brake`, `stop` with no `cruise`, and `brake` falls at peak over acceleration seconds, where the speed is the peak.
 * 3. A cart goes along unchanged: its handle's world frame is the course placement applied to the handle's model frame.
 * 4. A car's steering wheel is straight on the straights and, in the turn, turned to the left by its steering ratio times the angle whose tangent is the wheelbase over the rear axle's path radius; a turn tighter than the lock allows is refused at that leg's radius with the least radius, the root's radius with the road wheels at lock.
 * 5. A bicycle's crank turns once per development (wheel circumference times chainring over sprocket) of distance, and its top-dead-centre instants alternate left and right half a development apart; it leans into the turn by the arctangent of v squared over g r, to the left.
 * 6. A motorcycle leans by the same balance. A 10 m turn at 12 m/s is refused for the motorcycle and for the bicycle with the least radius v squared over g tan 50 degrees; `admitLean` refuses the 6 m/s course at a 15 degree limit with that limit's least radius and admits it at 30 degrees.
 * 7. A right turn: after 5 m straight, a quarter turn of negative angle on a 10 m radius ends at (-10, 15) facing `-X`; the heading never increases, the curvature in the turn is minus a tenth, the root stays 10 m from the centre at (-10, 5), and a single-track vehicle's lean there is negative, to the right.
 * 8. A malformed course is refused at the field at fault: no legs, a start that is not finite, a cruise, acceleration, deceleration, length or radius that is not positive, and a turn of zero angle.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Plans courses and samples rides of produced vehicles; a wrong arc, a turn bending to the wrong side, a speed profile that does not come to rest, a missing or mistimed instant, a steering angle off the Ackermann relation, a crank that does not integrate distance by the gear, a lean to the wrong side, a refusal carrying the wrong bound, or a malformed course planned anyway is caught.
 * @evidence contracts/development/testing.md#independent-expectations Arc length r theta and the end points are plane geometry worked here; the trapezoid's times follow from v = a t; the car's road wheel angle is the low-speed Ackermann relation tan(delta) = L / R_rear with R_rear squared = R squared - (L / 2) squared for a root at mid wheelbase, and its least radius is that relation at the lock, half the lock-to-lock turns over the steering ratio; the development is the chain drive's; the lean is the steady-turn balance tan(theta) = v squared / (g r) with g = 9.80665 m/s squared, solved for r at the limit; 50 degrees is Pirelli's road figure. The refused fields are those `ArchetypeCourse.ICourse` states as positive, finite or nonzero.
 * @evidence contracts/development/testing.md#distinguishing-cases Straight against turning for each vehicle, a left against a right turn, an admissible against a refused turn and limit, a long against a short course, one malformed course per rule; the vehicles' static dimensions belong to `test_archetype_ride_bands` and a gear's tooth counts to `test_archetype_contract_refusal`.
 * @evidence contracts/development/testing.md#execution-ownership A unit test over in-memory models, discovered by its exported name; it starts no host.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the eight scenarios and what each pins.
 */
export function test_archetype_ride_course(): void {
  const findings: string[] = [];
  const plan: ArchetypeCourse.IPlan = ArchetypeCourse.plan("test", COURSE);
  const place = (seconds: number): IAutoMovieVector3 =>
    plan.at(seconds).placement.translation;

  // 1. Geometry.
  if (!nclose(plan.length, 35 + 5 * Math.PI, 1e-9))
    findings.push("path length");
  if (!vclose(place(plan.duration), { x: 25, y: 0, z: 30 }, 1e-9))
    findings.push(`end point ${JSON.stringify(place(plan.duration))}`);
  if (
    !vclose(
      ArchetypeFrame.axis(plan.at(plan.duration).placement, "z"),
      { x: 1, y: 0, z: 0 },
      1e-9,
    )
  )
    findings.push("end heading");
  const middle: IAutoMovieVector3 = place(plan.when(20 + 2.5 * Math.PI));
  if (!nclose(Math.hypot(middle.x - 10, middle.z - 20), 10, 1e-9))
    findings.push("the turn is not an arc about its centre");

  // 2. Speed profile.
  const up: number = 6 / 2;
  const down: number = 6 / 3;
  const duration: number = up + down + (plan.length - 9 - 6) / 6;
  if (!nclose(plan.duration, duration, 1e-9)) findings.push("running time");
  if (
    !nclose(plan.at(0).speed, 0, 1e-12) ||
    !nclose(plan.at(plan.duration).speed, 0, 1e-9) ||
    !nclose(plan.at(up).speed, 6, 1e-9) ||
    !nclose(plan.at(up / 2).speed, 3, 1e-9)
  )
    findings.push("speed at the profile's corners");
  let last: number = 0;
  for (let k: number = 0; k <= 200; k++) {
    const state: ArchetypeCourse.IState = plan.at((plan.duration * k) / 200);
    if (state.speed > 6 + 1e-9 || state.distance < last - 1e-12)
      findings.push(`speed or distance at sample ${k}`);
    last = state.distance;
  }
  TestValidator.equals(
    "instants in order",
    plan.instants.map((i: { label: string }): string => i.label),
    ["depart", "cruise", "turn2Start", "turn2End", "brake", "stop"],
  );
  const short: ArchetypeCourse.IPlan = ArchetypeCourse.plan("test", {
    ...COURSE,
    legs: [{ kind: "straight", length: 6 }],
  });
  const peak: number = Math.sqrt((2 * 6 * 2 * 3) / 5);
  if (!nclose(short.peak, peak, 1e-9))
    findings.push("a short course's peak speed");
  const braking: { seconds: number; label: string } | undefined =
    short.instants.find((i: { label: string }): boolean => i.label === "brake");
  if (
    short.instants.map((i: { label: string }): string => i.label).join(",") !==
      "depart,brake,stop" ||
    braking === undefined ||
    !nclose(braking.seconds, peak / 2, 1e-9) ||
    !nclose(short.at(braking.seconds).speed, peak, 1e-9) ||
    !nclose(short.duration, peak / 2 + peak / 3, 1e-9)
  )
    findings.push(
      `a short course's instants ${JSON.stringify(short.instants)} do not brake at its peak`,
    );

  // 3. A cart goes along unchanged.
  const cart: ReturnType<typeof createCart> = createCart(
    { kind: "trolley" },
    1,
  );
  const pushed: ArchetypeRide.IRide<
    createCart.Affordance,
    createCart.Dimension
  > = ArchetypeRide.along(cart, COURSE);
  const turning: number = plan.when(20 + 2.5 * Math.PI);
  if (
    !vclose(
      pushed.frame("handle", turning).translation,
      ArchetypeFrame.compose(
        plan.at(turning).placement,
        cart.affordance("handle").frame,
      ).translation,
      1e-12,
    )
  )
    findings.push("the cart's handle is not carried by the course");

  // 4. A car's steering wheel.
  const car: ReturnType<typeof createCar> = createCar({ kind: "sedan" }, 8);
  const drive: ReturnType<typeof driveCar> = driveCar(car, COURSE);
  const wheelbase: number = car.dimensions.wheelbase!;
  const steer: number =
    car.dimensions.steeringRatio! *
    ((Math.atan(wheelbase / Math.sqrt(100 - (wheelbase * wheelbase) / 4)) *
      180) /
      Math.PI);
  if (!nclose(drive.at(1).archetype.state.wheel ?? 0, 0, 1e-12))
    findings.push("the wheel is turned on a straight");
  if (!nclose(drive.at(turning).archetype.state.wheel ?? 0, steer, 1e-9))
    findings.push(
      `the wheel is at ${drive.at(turning).archetype.state.wheel}, not ${steer} degrees`,
    );
  const tight: unknown = caught(() =>
    driveCar(car, {
      ...COURSE,
      legs: [{ kind: "turn", radius: 2, angle: 90 }],
    }),
  );

  // The road wheels at lock turn half the lock-to-lock angle over the steering ratio; the rear axle then runs on L / tan of it and the root half a wheelbase ahead of the axle.
  const lock: number =
    (((car.dimensions.lockTurns! * 180) / car.dimensions.steeringRatio!) *
      Math.PI) /
    180;
  least(
    findings,
    "the car's lock",
    tight,
    "course.legs[0].radius",
    Math.hypot(wheelbase / Math.tan(lock), wheelbase / 2),
  );

  // 5. A bicycle's crank and lean.
  const bicycle: ReturnType<typeof createBicycle> = createBicycle({}, 8);
  const pedalled: ReturnType<typeof rideBicycle> = rideBicycle(
    bicycle,
    COURSE,
    {
      chainring: 50,
      sprocket: 25,
    },
  );
  const development: number = Math.PI * bicycle.dimensions.wheelDiameter! * 2;
  const quarter: number = plan.when(development * 1.25);
  if (!nclose(pedalled.at(quarter).archetype.state.crank ?? 0, 90, 1e-6))
    findings.push(
      `after a development and a quarter the crank is at ${pedalled.at(quarter).archetype.state.crank}`,
    );
  const centres: { seconds: number; label: string }[] =
    pedalled.instants.filter((i: { label: string }): boolean =>
      i.label.endsWith("TopDeadCentre"),
    );
  if (
    centres.length !== Math.floor(plan.length / (development / 2)) ||
    centres[0]!.label !== "rightTopDeadCentre" ||
    centres[1]!.label !== "leftTopDeadCentre" ||
    !nclose(plan.at(centres[1]!.seconds).distance, development, 1e-6)
  )
    findings.push("top dead centres are not half a development apart");
  const lean: number = Math.atan((6 * 6) / (9.80665 * 10));
  const up3: IAutoMovieVector3 = ArchetypeFrame.axis(
    pedalled.at(turning).placement,
    "y",
  );

  // Turning left while heading between +Z and +X, the inside of the turn is toward the centre at (10, 20).
  const inward: IAutoMovieVector3 = Vector3.normalize(
    Vector3.subtract({ x: 10, y: 0, z: 20 }, { ...middle, y: 0 }),
  );
  if (!nclose(Math.acos(up3.y), lean, 1e-9) || !(Vector3.dot(up3, inward) > 0))
    findings.push(
      "the bicycle does not lean into the turn by the balance angle",
    );

  // 6. A motorcycle.
  const machine: ReturnType<typeof createMotorcycle> = createMotorcycle(
    { kind: "motorcycle" },
    8,
  );
  if (
    !nclose(
      Math.acos(
        ArchetypeFrame.axis(
          rideMotorcycle(machine, COURSE).at(turning).placement,
          "y",
        ).y,
      ),
      lean,
      1e-9,
    )
  )
    findings.push("the motorcycle's lean");
  const balance = (speed: number, limit: number): number =>
    (speed * speed) / (9.80665 * Math.tan((limit * Math.PI) / 180));
  least(
    findings,
    "a motorcycle past 50 degrees",
    caught(() => rideMotorcycle(machine, { ...COURSE, cruise: 12 })),
    "course.legs[1].radius",
    balance(12, 50),
  );
  least(
    findings,
    "a bicycle past 50 degrees",
    caught(() => rideBicycle(bicycle, { ...COURSE, cruise: 12 })),
    "course.legs[1].radius",
    balance(12, 50),
  );
  least(
    findings,
    "a 15 degree limit",
    caught(() => ArchetypeCourse.admitLean("test", COURSE, 15)),
    "course.legs[1].radius",
    balance(6, 15),
  );
  if (caught(() => ArchetypeCourse.admitLean("test", COURSE, 30)) !== undefined)
    findings.push("a 10 m turn at 6 m/s is refused at a 30 degree limit");

  // 7. A right turn: facing +Z, the right is -X, so the centre is at (-10, 5).
  const right: ArchetypeCourse.IPlan = ArchetypeCourse.plan("test", {
    ...COURSE,
    legs: [
      { kind: "straight", length: 5 },
      { kind: "turn", radius: 10, angle: -90 },
    ],
  });
  const finish: ArchetypeCourse.IState = right.at(right.duration);
  if (
    !nclose(right.length, 5 + 5 * Math.PI, 1e-9) ||
    !vclose(finish.placement.translation, { x: -10, y: 0, z: 15 }, 1e-9) ||
    !vclose(
      ArchetypeFrame.axis(finish.placement, "z"),
      { x: -1, y: 0, z: 0 },
      1e-9,
    )
  )
    findings.push(
      `a right turn ends at ${JSON.stringify(finish.placement.translation)}`,
    );
  let facing: number = Infinity;
  for (let k: number = 0; k <= 100; k++) {
    const state: ArchetypeCourse.IState = right.at((right.duration * k) / 100);
    const forward: IAutoMovieVector3 = ArchetypeFrame.axis(
      state.placement,
      "z",
    );
    const heading: number = Math.atan2(forward.x, forward.z);
    const at: IAutoMovieVector3 = state.placement.translation;
    const turns: boolean = state.distance > 5 + 1e-9;
    if (heading > facing + 1e-9)
      findings.push(`a right turn's heading rises at sample ${k}`);
    if (!nclose(state.curvature, turns ? -0.1 : 0, 1e-12))
      findings.push(`a right turn's curvature at sample ${k}`);
    if (turns && !nclose(Math.hypot(at.x + 10, at.z - 5), 10, 1e-9))
      findings.push(`a right turn leaves its arc at sample ${k}`);
    if (turns && state.speed > 0 && !(ArchetypeCourse.lean(state) < 0))
      findings.push(`a right turn leans to the left at sample ${k}`);
    facing = heading;
  }

  // 8. Malformed courses, each wrong in one field.
  const malformed: readonly (readonly [string, ArchetypeCourse.ICourse])[] = [
    ["course.legs", { ...COURSE, legs: [] }],
    [
      "course.start.x",
      { ...COURSE, start: { x: Number.NaN, z: 0, heading: 0 } },
    ],
    ["course.start.z", { ...COURSE, start: { x: 0, z: Infinity, heading: 0 } }],
    [
      "course.start.heading",
      { ...COURSE, start: { x: 0, z: 0, heading: Number.NaN } },
    ],
    ["course.cruise", { ...COURSE, cruise: 0 }],
    ["course.acceleration", { ...COURSE, acceleration: -2 }],
    ["course.deceleration", { ...COURSE, deceleration: 0 }],
    ["course.legs[0]", { ...COURSE, legs: [{ kind: "straight", length: 0 }] }],
    [
      "course.legs[1]",
      {
        ...COURSE,
        legs: [
          { kind: "straight", length: 5 },
          { kind: "turn", radius: -10, angle: 90 },
        ],
      },
    ],
    [
      "course.legs[0].angle",
      { ...COURSE, legs: [{ kind: "turn", radius: 10, angle: 0 }] },
    ],
  ];
  for (const [axis, course] of malformed) {
    const refused: unknown = caught(() => ArchetypeCourse.plan("test", course));
    if (
      !(refused instanceof ArchetypeRefusal) ||
      refused.kind !== "parameter" ||
      refused.axis !== axis
    )
      findings.push(
        `a course wrong at ${axis} gave ${refused instanceof ArchetypeRefusal ? refused.axis : String(refused)}`,
      );
  }
  TestValidator.equals("rides follow their course", findings, []);
}

/** Add a finding unless what was thrown is a refusal of a turn's radius, at the stated leg, whose least radius is the expected one to a nanometre and unbounded above. */
function least(
  findings: string[],
  name: string,
  thrown: unknown,
  axis: string,
  radius: number,
): void {
  if (
    !(thrown instanceof ArchetypeRefusal) ||
    thrown.kind !== "parameter" ||
    thrown.axis !== axis ||
    thrown.feasible?.kind !== "range" ||
    thrown.feasible.minimum === null ||
    !nclose(thrown.feasible.minimum, radius, 1e-9) ||
    thrown.feasible.maximum !== null
  )
    findings.push(
      `${name}: expected a refusal at ${axis} with a least radius of ${radius} m, got ${thrown instanceof ArchetypeRefusal ? thrown.message : String(thrown)}`,
    );
}

/** Run an operation and return what it throws, or undefined. */
function caught(operation: () => unknown): unknown {
  try {
    operation();
  } catch (error) {
    return error;
  }
  return undefined;
}
