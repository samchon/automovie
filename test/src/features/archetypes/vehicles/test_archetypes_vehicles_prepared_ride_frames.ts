import {
  AutoMovieArchetypeCourse,
  AutoMovieArchetypeFrame,
  AutoMovieArchetypeRefusal,
  AutoMovieArchetypeRide,
  createBicycle,
  createCar,
  createWheelchair,
  driveCar,
  rideBicycle,
  rideWheelchair,
} from "@automovie/archetypes";
import { Vector3 } from "@automovie/engine";
import type {
  IAutoMovieAffordance,
  IAutoMovieTransform,
} from "@automovie/interface";
import { HumanObject } from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { qclose } from "../../internal/qclose";
import { vclose } from "../../internal/vclose";

/**
 * Narrow vehicle reads equal the same displayed material frames.
 *
 * Scenarios:
 *
 * 1. Fixed seats and rotating rims, pedals and wheels on shuffled seeks.
 * 2. A model-only callback is retained, while a narrow callback can avoid it.
 * 3. The Human prop adapter retains the projected selected travel.
 * 4. Independent timed car seats avoid the wheel material quadrature.
 */
export function test_archetypes_vehicles_prepared_ride_frames(): void {
  const course = {
    start: { x: 0, z: 0, heading: 12 },
    cruise: 2,
    startSpeed: 2,
    endSpeed: 2,
    legs: [{ kind: "turn", angle: 32, radius: 14 }],
  } as const;
  const car: ReturnType<typeof createCar> = createCar({ kind: "hatchback" });
  const bike: ReturnType<typeof createBicycle> = createBicycle();
  const chair: ReturnType<typeof createWheelchair> = createWheelchair({
    kind: "selfPropelled",
  });
  const drive: ReturnType<typeof driveCar> = driveCar(car, course);
  compare(drive, ["wheel", "frontRightSpin"]);
  const bicycle: ReturnType<typeof rideBicycle> = rideBicycle(bike, course);
  compare(bicycle, ["saddle", "leftGrip", "leftPedal"]);
  compare(rideWheelchair(chair, course), ["seat", "leftRim", "rightRim"]);
  let full: number = 0;
  const supplied: ReturnType<
    typeof AutoMovieArchetypeRide.along<
      createCar.Affordance,
      createCar.Dimension
    >
  > = AutoMovieArchetypeRide.along(car, course, (state) => ({
    get archetype(): typeof car {
      ++full;
      return car.articulate({ wheel: 45 });
    },
    placement: state.placement,
    frame: (id: createCar.Affordance): IAutoMovieTransform | undefined =>
      id === "wheel" ? car.affordance("wheel").frame : undefined,
  }));
  supplied.frame("wheel", 1);
  TestValidator.equals("selected foreign frame avoids full pose", full, 0);
  supplied.frame("frontLeftSpin", 1);
  TestValidator.equals(
    "a model-only frame uses the full foreign pose",
    full,
    1,
  );

  let fault: unknown;
  try {
    drive.frame("unknown" as createCar.Affordance, 1);
  } catch (error) {
    fault = error;
  }
  TestValidator.predicate(
    "an unknown frame is still refused",
    fault instanceof AutoMovieArchetypeRefusal,
  );

  const prop: ReturnType<typeof HumanObject.prop> = HumanObject.prop(
    "car",
    car,
    {
      at: { x: 0, y: 0, z: 0 },
      yaw: 0,
    },
  );
  const site: IAutoMovieAffordance | undefined = prop.articulateSite?.(
    "wheel",
    { wheel: 45 },
  );
  TestValidator.predicate(
    "the prop narrow adapter reads the displaced wheel",
    site !== undefined &&
      qclose(
        site.frame.rotation,
        car.articulate({ wheel: 45 }).affordance("wheel").frame.rotation,
        1e-12,
      ),
  );

  const timed: AutoMovieArchetypeCourse.IPlan = AutoMovieArchetypeCourse.timed(
    "car",
    [
      { seconds: 0, x: 0, z: 0 },
      { seconds: 1, x: 0.03, z: 3 },
      { seconds: 2, x: 0.12, z: 6 },
      { seconds: 3, x: 0.27, z: 9 },
    ],
  );
  let states: number = 0;
  const tracked: typeof timed = {
    ...timed,
    at: (seconds: number): AutoMovieArchetypeCourse.IState => {
      ++states;
      return timed.at(seconds);
    },
  };
  const timedRide: ReturnType<typeof driveCar> = driveCar(car, tracked);
  const preparation: number = states;
  const offsets: readonly number[] = [2.87, 0.15, 1.64, 2.72];
  for (const seconds of offsets) timedRide.frame("driverSeat", seconds);
  TestValidator.equals(
    "each unseen fixed seat needs only the current course state",
    states - preparation,
    offsets.length,
  );
  const read: number = states;
  for (const seconds of offsets) timedRide.frame("frontLeftSpin", seconds);
  TestValidator.predicate(
    "the wheel reads its bounded current interval after a separate preparation",
    preparation > offsets.length && states - read === offsets.length * 6,
  );

  // Parallel wheel axes give the fixed fork one longitudinal component even
  // though the displayed axle centres sweep distinct arcs.
  const second: number = 0.72;
  const step: number = 1 / 1024;
  const forward: ReturnType<typeof AutoMovieArchetypeFrame.axis> =
    AutoMovieArchetypeFrame.axis(bicycle.at(second).placement, "z");
  const centreVelocity = (id: "frontSpin" | "rearSpin"): typeof forward =>
    Vector3.scale(
      Vector3.subtract(
        bicycle.frame(id, second + step).translation,
        bicycle.frame(id, second - step).translation,
      ),
      1 / (2 * step),
    );
  const front: typeof forward = centreVelocity("frontSpin");
  const rear: typeof forward = centreVelocity("rearSpin");
  TestValidator.predicate(
    "a fixed bicycle fork shares longitudinal wheel travel through distinct centre arcs",
    Math.abs(Vector3.length(front) - Vector3.length(rear)) > 1e-6 &&
      Math.abs(Vector3.dot(Vector3.subtract(front, rear), forward)) < 1e-9,
  );
}

/** Compare a narrow world read with the frame composed from the full model. */
function compare<I extends string, D extends string>(
  ride: AutoMovieArchetypeRide.IRide<I, D>,
  ids: readonly I[],
): void {
  for (const seconds of [1.7, 0.12, 2.61, -1, 0.12, ride.duration + 1]) {
    const full: AutoMovieArchetypeRide.ISample<I, D> = ride.at(seconds);
    for (const id of ids) {
      const selected: IAutoMovieTransform = ride.frame(id, seconds);
      const expected: IAutoMovieTransform = AutoMovieArchetypeFrame.compose(
        full.placement,
        full.archetype.affordance(id).frame,
      );
      TestValidator.predicate(
        `narrow ${id} at ${seconds}`,
        vclose(selected.translation, expected.translation, 1e-12) &&
          qclose(selected.rotation, expected.rotation, 1e-12),
      );
    }
  }
}
