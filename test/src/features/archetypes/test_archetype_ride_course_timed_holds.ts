import {
  AutoMovieArchetypeCourse,
  AutoMovieArchetypeRefusal,
  type AutoMovieArchetypeRide,
  createCar,
  createMotorcycle,
  driveCar,
  rideMotorcycle,
} from "@automovie/archetypes";
import { Quaternion } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { nclose, vclose } from "../internal/predicates";

/** World forward in the course's conventional heading. */
const NORTH: IAutoMovieVector3 = { x: 0, y: 0, z: 1 };

/** Duration of the neighboring velocity observations, in film seconds. */
const NEAR: number = 1e-4;

/**
 * Equal world positions at distinct film seconds hold through each interval.
 *
 * The fixture approaches and leaves its main stop along +Z. It also holds
 * at the beginning and end, where there is only one moving neighbor.
 * An eastbound departure from the same hold has incompatible facing.
 *
 * Scenarios:
 *
 * 1. Each dwell keeps its authored position, zero speed, its distance and its facing at both ends and inside, read in either order.
 * 2. The moving cubics meet each dwell with continuous position and facing and a vanishing speed.
 * 3. A distance or second past the course reads its terminal dwell.
 * 4. A departure perpendicular to the arrival refuses at its sample, naming the second.
 * 5. A sloping approach keeps its pitch through the dwell, and a pure change of height still travels.
 * 6. A car and a motorcycle on a course with a stop hold their whole pose through it.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Explains all three held spans, neighboring forward directions, film seconds and what the vehicle control measures.
 * @evidence contracts/development/testing.md#behavioral-verification Reads the native public timed plan and real car and motorcycle consumers. The path, orientation, distance, velocity and departure are sampled at authored times and both sides of their boundaries.
 * @evidence contracts/development/testing.md#independent-expectations The two trips are two metres each and share their authored direction. Stationary marks give the exact world points and zero speed. The alternate exit is perpendicular. The inverse distance returns the first second of each dwell, and total film duration includes the terminal dwell.
 * @evidence contracts/development/testing.md#distinguishing-cases Starts and ends with dwells, puts multiple samples inside the intermediate dwell, refuses an incompatible departure, replays in reverse order, and checks a non-stationary change in height at fixed floor coordinates.
 * @evidence contracts/development/testing.md#execution-ownership Synchronous in-memory course and vehicle pose reads through installed package exports.
 */
export function test_archetype_ride_course_timed_holds(): void {
  const samples: readonly AutoMovieArchetypeCourse.ISample[] = [
    sample(2, 7, 2),
    sample(3, 7, 2),
    sample(4, 7, 2),
    sample(6, 7, 4),
    sample(8, 7, 4),
    sample(9, 7, 4),
    sample(11, 7, 6),
    sample(12, 7, 6),
  ];
  const plan: AutoMovieArchetypeCourse.IPlan = AutoMovieArchetypeCourse.timed(
    "exhibition",
    samples,
  );
  const holds: readonly IHold[] = [
    {
      from: 2,
      to: 4,
      position: { x: 7, y: 1, z: 2 },
      heading: NORTH,
      distance: 0,
    },
    {
      from: 6,
      to: 9,
      position: { x: 7, y: 1, z: 4 },
      heading: NORTH,
      distance: 2,
    },
    {
      from: 11,
      to: 12,
      position: { x: 7, y: 1, z: 6 },
      heading: NORTH,
      distance: 4,
    },
  ];

  TestValidator.equals(
    "absolute film duration includes the terminal dwell",
    plan.duration,
    12,
  );
  TestValidator.predicate(
    "the two trips total four metres",
    nclose(plan.length, 4, 1e-9),
  );
  for (const hold of holds) {
    const times: readonly number[] = [
      hold.from,
      hold.from + NEAR,
      (hold.from + hold.to) / 2,
      hold.to - NEAR,
      hold.to,
    ];
    const forward: AutoMovieArchetypeCourse.IState[] = times.map(plan.at);
    for (const [index, pose] of forward.entries()) {
      TestValidator.equals(
        "constant authored position at " + times[index],
        pose.placement.translation,
        hold.position,
      );
      TestValidator.predicate(
        "held speed, distance and heading at " + times[index],
        pose.speed === 0 &&
          pose.curvature === 0 &&
          nclose(pose.distance, hold.distance, 1e-9) &&
          vclose(facing(pose), hold.heading, 1e-9),
      );
    }
    TestValidator.equals(
      "held pose is seek-order independent",
      [...times].reverse().map(plan.at),
      [...forward].reverse(),
    );
    TestValidator.predicate(
      "distance inverse gives the first arrival at " + hold.from,
      nclose(plan.when(forward[0]!.distance), hold.from, 1e-9),
    );
  }

  for (const [seconds, held] of [
    [4 + NEAR, holds[0]!],
    [6 - NEAR, holds[1]!],
    [9 + NEAR, holds[1]!],
    [11 - NEAR, holds[2]!],
  ] as const) {
    const close: AutoMovieArchetypeCourse.IState = plan.at(seconds);
    TestValidator.predicate(
      "the moving cubic reaches the constant span with continuous position and zero limiting speed at " +
        seconds,
      close.speed > 0 &&
        close.speed < 1e-3 &&
        vclose(close.placement.translation, held.position, 1e-6) &&
        vclose(facing(close), held.heading, 1e-9),
    );
  }
  TestValidator.equals(
    "a distance beyond the path reads its final film second",
    plan.when(plan.length + 1),
    12,
  );
  TestValidator.equals(
    "partial seek beyond the terminal dwell preserves its pose",
    plan.at(15),
    plan.at(12),
  );
  let turning: unknown;
  try {
    AutoMovieArchetypeCourse.timed("perpendicular departure after a hold", [
      ...samples.slice(0, -2),
      sample(11, 9, 4),
      sample(12, 9, 4),
    ]);
  } catch (error) {
    turning = error;
  }
  TestValidator.predicate(
    "a departure that cannot keep standing facing refuses at its authored sample",
    turning instanceof AutoMovieArchetypeRefusal &&
      turning.axis === "samples[5]" &&
      turning.reason.includes("9 s"),
  );

  const grade: AutoMovieArchetypeCourse.IPlan = AutoMovieArchetypeCourse.timed(
    "sloped course",
    [
      { seconds: 0, x: 7, y: 0, z: 0 },
      { seconds: 1, x: 7, y: 0.5, z: 1 },
      { seconds: 2, x: 7, y: 0.5, z: 1 },
      { seconds: 3, x: 7, y: 1, z: 2 },
    ],
  );
  TestValidator.predicate(
    "a sloping approach keeps its displayed orientation during a hold",
    vclose(facing(grade.at(1.5)), facing(grade.at(1 - NEAR)), 1e-9),
  );
  const vertical: AutoMovieArchetypeCourse.IPlan =
    AutoMovieArchetypeCourse.timed("height change", [
      { seconds: 0, x: 7, z: 4 },
      { seconds: 2, x: 7, y: 2, z: 4 },
    ]);
  TestValidator.predicate(
    "fixed floor coordinates with changing height still travel",
    vertical.at(1).speed === 1 && vertical.at(1).placement.translation.y === 1,
  );

  const straight: AutoMovieArchetypeCourse.IPlan =
    AutoMovieArchetypeCourse.timed("straight hold", [
      sample(0, 0, 0),
      sample(2, 0, 2),
      sample(3, 0, 2),
      sample(4, 0, 2),
      sample(6, 0, 4),
    ]);
  const car: AutoMovieArchetypeRide.IRide<
    createCar.Affordance,
    createCar.Dimension
  > = driveCar(createCar({ kind: "sedan" }, 2), straight);
  const cycle: AutoMovieArchetypeRide.IRide<
    createMotorcycle.Affordance,
    createMotorcycle.Dimension
  > = rideMotorcycle(createMotorcycle({ kind: "motorcycle" }, 2), straight);
  TestValidator.equals(
    "car pose and wheel articulation hold at the stop",
    car.at(2.25),
    car.at(3.75),
  );
  TestValidator.equals(
    "motorcycle pose and wheel articulation hold at the stop",
    cycle.at(2.25),
    cycle.at(3.75),
  );
}

/** One authored dwell: its film seconds, the held root position, its facing and the distance travelled before it. */
interface IHold {
  /** The first film second of the dwell. */
  from: number;

  /** The last film second of the dwell. */
  to: number;

  /** The held root position, world metres. */
  position: IAutoMovieVector3;

  /** The held world forward direction. */
  heading: IAutoMovieVector3;

  /** The distance travelled along the course before the dwell, metres. */
  distance: number;
}

/** An elevated world mark with integral horizontal position components. */
function sample(
  seconds: number,
  x: number,
  z: number,
): AutoMovieArchetypeCourse.ISample {
  return { seconds, x, y: 1, z };
}

/** Read world forward by rotating the model's conventional forward axis. */
function facing(state: AutoMovieArchetypeCourse.IState): IAutoMovieVector3 {
  return Quaternion.rotateVector(state.placement.rotation, NORTH);
}
