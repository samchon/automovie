import {
  type AutoMovieArchetypeCourse,
  AutoMovieArchetypeRefusal,
  AutoMovieArchetypeUnits,
  createCar,
  driveCar,
} from "@automovie/archetypes";
import { Quaternion } from "@automovie/engine";
import type {
  IAutoMovieModelPart,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

/** A tenth of a degree, the issue's bound for a road wheel's steering angle (#3475). */
const TENTH: number = 0.1;

/**
 * A driven car's front road wheels steer with its steering wheel: each to the angle that points it at the turn's centre, the inner wheel more than the outer.
 *
 * Scenarios, for a sedan and a hatchback at two seeds each, through a left and a right quarter turn of 12 m radius driven by `driveCar`:
 * 1. Each front wheel's drawn axle turns about the upright by the angle whose tangent is the wheelbase over the rear axle's path radius less or plus half the track, within 0.1 degree, and `travel` reads the same angle.
 * 2. The inner wheel of each turn steers more than the outer, both toward the turn, and straight on the straight leg.
 * 3. The two angles' cotangents average to the cotangent of the steering wheel's turn over the steering ratio within 0.1 degree: the single equivalent wheel the steering ratio is defined at.
 * 4. Setting a road wheel's travel in a state is refused, giving the steering wheel as its leader.
 */
export function test_unit_archetypes_core_ride_car(): void {
  const findings: string[] = [];
  const RADIUS: number = 12;
  for (const kind of createCar.KINDS)
    for (const seed of [3, 11]) {
      const car: ReturnType<typeof createCar> = createCar({ kind }, seed);
      const wheelbase: number = car.dimensions.wheelbase!;
      const ratio: number = car.dimensions.steeringRatio!;
      const centre = (
        archetype: ReturnType<typeof createCar>,
        part: string,
      ): IAutoMovieModelPart =>
        archetype.parts.find(
          (p: IAutoMovieModelPart): boolean => p.id === part,
        )!;
      const track: number =
        centre(car, "wheel-front-left").transform!.translation.x -
        centre(car, "wheel-front-right").transform!.translation.x;

      // The drawn wheel's axle runs along its part's +Y, outward on either side: its turn about the upright, read on the half of the line toward +X.
      const steered = (
        archetype: ReturnType<typeof createCar>,
        part: string,
      ): number => {
        const axle: IAutoMovieVector3 = Quaternion.rotateVector(
          centre(archetype, part).transform!.rotation,
          { x: 0, y: 1, z: 0 },
        );
        const sign: number = axle.x < 0 ? -1 : 1;
        return (
          Math.atan2(-sign * axle.z, sign * axle.x) /
          AutoMovieArchetypeUnits.DEGREE
        );
      };
      for (const side of [1, -1]) {
        const course: AutoMovieArchetypeCourse.ICourse = {
          start: { x: 0, z: 0, heading: 0 },
          legs: [
            { kind: "straight", length: 10 },
            { kind: "turn", radius: RADIUS, angle: 90 * side },
          ],
          cruise: 4,
          acceleration: 2,
          deceleration: 3,
        };
        const ride: ReturnType<typeof driveCar> = driveCar(car, course);
        const label: string = `${kind}@${seed} turning ${side > 0 ? "left" : "right"}`;
        const straight: ReturnType<typeof createCar> = ride.at(1).archetype;
        if (
          Math.abs(steered(straight, "wheel-front-left")) > 1e-9 ||
          Math.abs(steered(straight, "wheel-front-right")) > 1e-9
        )
          findings.push(`${label}: a road wheel is turned on the straight`);
        const turning: ReturnType<typeof createCar> = ride.at(
          ride.plan.when(10 + (RADIUS * Math.PI) / 4),
        ).archetype;

        // 1. Each wheel's axle points at the turn's centre on the rear axle's line.
        const axle: number = Math.sqrt(
          RADIUS * RADIUS - (wheelbase * wheelbase) / 4,
        );
        const expected = (offset: number): number =>
          side *
          (Math.atan(wheelbase / (axle - side * offset)) /
            AutoMovieArchetypeUnits.DEGREE);
        const left: number = steered(turning, "wheel-front-left");
        const right: number = steered(turning, "wheel-front-right");
        for (const [name, angle, offset, id] of [
          ["left", left, track / 2, "frontLeftWheel"],
          ["right", right, -track / 2, "frontRightWheel"],
        ] as const) {
          if (Math.abs(angle - expected(offset)) > TENTH)
            findings.push(
              `${label}: the ${name} wheel steers ${angle}, not ${expected(offset)}`,
            );
          if (Math.abs(turning.travel(id) - angle) > 1e-6)
            findings.push(
              `${label}: the ${name} wheel's travel is ${turning.travel(id)}`,
            );
        }

        // 2. The inner wheel more than the outer, both toward the turn.
        const [inner, outer]: [number, number] =
          side > 0 ? [left, right] : [right, left];
        if (!(side * outer > 0 && side * inner > side * outer))
          findings.push(`${label}: inner ${inner} and outer ${outer}`);

        // 3. The equivalent single wheel is the steering wheel's turn over the ratio.
        const cot = (degrees: number): number =>
          1 / Math.tan(degrees * AutoMovieArchetypeUnits.DEGREE);
        const equivalent: number =
          Math.atan(2 / (cot(left) + cot(right))) /
          AutoMovieArchetypeUnits.DEGREE;
        if (Math.abs(equivalent - turning.travel("wheel") / ratio) > TENTH)
          findings.push(
            `${label}: the wheels' equivalent ${equivalent} is not the steering ${turning.travel("wheel") / ratio}`,
          );
      }

      // 4. A road wheel is set by its steering wheel only.
      let thrown: unknown = null;
      try {
        car.articulate({ frontLeftWheel: 5 });
      } catch (error) {
        thrown = error;
      }
      if (
        !(thrown instanceof AutoMovieArchetypeRefusal) ||
        thrown.axis !== "frontLeftWheel" ||
        thrown.feasible?.kind !== "alternatives" ||
        thrown.feasible.values.join() !== "wheel"
      )
        findings.push(
          `${kind}@${seed}: a road wheel's travel is admitted in a state`,
        );
    }
  TestValidator.equals(
    "road wheels steer with the steering wheel",
    findings,
    [],
  );
}
