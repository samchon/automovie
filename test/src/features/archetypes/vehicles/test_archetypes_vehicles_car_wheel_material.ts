import {
  AutoMovieArchetypeCar,
  AutoMovieArchetypeCourse,
  AutoMovieArchetypeFrame,
  createWheelchair,
  driveCar,
  rideWheelchair,
} from "@automovie/archetypes";
import type { IAutoMovieModelPart } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/nclose";
import { qclose } from "../../internal/qclose";

/**
 * Compare wheel travel with each centre's own turning radius.
 *
 * Scenarios:
 *
 * 1. Straight, left, mirrored and reversed circular legs.
 * 2. Shuffled reads and the exact joint between turned and straight legs.
 * 3. A timed wheelchair's differential travel through its heading sweep.
 */
export function test_archetypes_vehicles_car_wheel_material(): void {
  const car: ReturnType<typeof AutoMovieArchetypeCar.create> =
    AutoMovieArchetypeCar.create({ kind: "hatchback" }, 3);
  const circumference: number = Math.PI * car.dimensions.wheelDiameter!;
  const length: number = car.dimensions.wheelbase!;
  const radius: number = 12;
  const q: number = Math.sqrt(radius ** 2 - (length / 2) ** 2);
  const ids = [
    "frontLeftSpin",
    "frontRightSpin",
    "rearLeftSpin",
    "rearRightSpin",
  ] as const;
  const tyres: readonly string[] = [
    "wheel-front-left",
    "wheel-front-right",
    "wheel-rear-left",
    "wheel-rear-right",
  ];
  for (const reverse of [false, true])
    for (const sign of [-1, 1]) {
      const ride: ReturnType<typeof driveCar> = driveCar(car, {
        start: { x: 0, z: 0, heading: 0 },
        cruise: 2,
        startSpeed: 2,
        endSpeed: 2,
        legs: [
          { kind: "turn", radius, angle: sign * 12, reverse },
          { kind: "straight", length: 0.85, reverse },
        ],
      });
      const turn: number = (12 * Math.PI) / 180;
      const join: number = ride.plan.when(radius * turn);
      for (const seconds of [
        ride.duration,
        join / 3,
        join,
        0,
        join * 0.8,
        join / 3,
      ]) {
        const sample: ReturnType<typeof ride.at> = ride.at(seconds);
        const actualAngle: number = Math.min(
          turn,
          sample.course.distance / radius,
        );
        const straight: number = Math.max(
          0,
          sample.course.distance - radius * turn,
        );
        for (const [index, id] of ids.entries()) {
          const offset: number = car.affordance(id).frame.translation.x;
          const rear: number = q - sign * (reverse ? -1 : 1) * offset;
          const expectedRadius: number =
            index < 2 ? Math.hypot(rear, length) : rear;
          const expectedDistance: number =
            (expectedRadius * actualAngle + straight) * (reverse ? -1 : 1);
          const expectedSpin: number = wrapped(
            (expectedDistance * 360) / circumference,
          );
          TestValidator.predicate(
            `wheel ${id} at shuffled ${seconds}`,
            nclose(sample.archetype.travel(id), expectedSpin, 1e-9),
          );
          const wheelPart: string = tyres[index]!;
          const expected: IAutoMovieModelPart = car
            .articulate({
              wheel: sample.archetype.travel("wheel"),
              [id]: expectedSpin,
            })
            .parts.find(
              (part: IAutoMovieModelPart): boolean => part.id === wheelPart,
            )!;
          const displayed: IAutoMovieModelPart = sample.archetype.parts.find(
            (part: IAutoMovieModelPart): boolean => part.id === wheelPart,
          )!;
          TestValidator.predicate(
            "the displayed tyre uses the same material rotation",
            qclose(
              displayed.transform!.rotation,
              expected.transform!.rotation,
              1e-12,
            ),
          );
        }
      }
    }

  const chair: ReturnType<typeof createWheelchair> = createWheelchair({
    kind: "selfPropelled",
  });
  const plan: AutoMovieArchetypeCourse.IPlan = AutoMovieArchetypeCourse.timed(
    "wheelchair",
    [
      { seconds: 0, x: 0, z: 0 },
      { seconds: 1, x: 0.15, z: 1 },
      { seconds: 2, x: 0.6, z: 2 },
      { seconds: 3, x: 1.35, z: 3 },
    ],
  );
  const moving: ReturnType<typeof rideWheelchair> = rideWheelchair(chair, plan);
  const track: number =
    chair.affordance("leftSpin").frame.translation.x -
    chair.affordance("rightSpin").frame.translation.x;
  const before: ReturnType<typeof AutoMovieArchetypeFrame.axis> =
    AutoMovieArchetypeFrame.axis(plan.at(0).placement, "z");
  for (const seconds of [2.7, 0.17, 1.5, 0.17]) {
    const row: ReturnType<typeof moving.at> = moving.at(seconds);
    const forward: ReturnType<typeof AutoMovieArchetypeFrame.axis> =
      AutoMovieArchetypeFrame.axis(row.placement, "z");
    const swept: number =
      Math.atan2(forward.x, forward.z) - Math.atan2(before.x, before.z);
    const degrees: number =
      (track * swept * 360) / (Math.PI * chair.dimensions.wheelDiameter!);
    TestValidator.predicate(
      `the wheelchair tracks the continuous heading at ${seconds}`,
      nclose(
        wrapped(
          row.archetype.travel("rightSpin") - row.archetype.travel("leftSpin"),
        ),
        wrapped(degrees),
        1e-9,
      ),
    );
  }
}

/** Wrap a material degree measurement into the articulation range. */
function wrapped(degrees: number): number {
  return ((degrees % 360) + 360) % 360;
}
