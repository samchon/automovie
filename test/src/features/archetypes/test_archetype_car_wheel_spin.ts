import {
  type ArchetypeCourse,
  createCar,
  driveCar,
} from "@automovie/archetypes";
import { Quaternion } from "@automovie/engine";
import type { IAutoMovieModelPart, IAutoMovieVector3 } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

/**
 * A driven car's road wheels roll with the distance: one turn per wheel circumference, forward on a forward leg and back on a reversed one.
 *
 * Scenarios, for each class at one seed:
 * 1. After 10 m of a straight, each of the four spin knobs is at 10 / (pi wheelDiameter) turns, taken modulo a turn, within 1e-9 degrees, and each wheel's hub bar has turned by that angle about the car's `+X`, its top moving forward.
 * 2. Backing 4 m after driving 10 m leaves the wheels at 6 m's worth of turns.
 * 3. Standing still before the course begins, the wheels have not turned.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Drives produced cars and reads the spin travels and the drawn hub bars; a wheel that skids, turns backward going forward, keeps turning forward while reversing, or turns its knob without its hub is caught.
 * @evidence contracts/development/testing.md#independent-expectations Rolling without slipping: a wheel turns once per circumference, pi times its diameter, of distance; the hub's sense is the right-hand turn about the axle that carries its top forward.
 * @evidence contracts/development/testing.md#distinguishing-cases Every class, a forward and a reversed leg, and a car standing before its start; the steering belongs to `test_archetype_ride_car`.
 * @evidence contracts/development/testing.md#execution-ownership A unit test over in-memory models, discovered by its exported name; it starts no host.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the three scenarios and what each pins.
 */
export function test_archetype_car_wheel_spin(): void {
  const findings: string[] = [];
  const spins: readonly createCar.Affordance[] = ["frontLeftSpin", "frontRightSpin", "rearLeftSpin", "rearRightSpin"];
  for (const kind of createCar.KINDS) {
    const car: ReturnType<typeof createCar> = createCar({ kind }, 4);
    const diameter: number = car.dimensions.wheelDiameter!;
    const expected = (metres: number): number =>
      ((((metres / (Math.PI * diameter)) * 360) % 360) + 360) % 360;
    const base: Omit<ArchetypeCourse.ICourse, "legs"> = {
      start: { x: 0, z: 0, heading: 0 },
      cruise: 3,
      acceleration: 1,
      deceleration: 1,
      at: 2,
    };
    const ride: ReturnType<typeof driveCar> = driveCar(car, {
      ...base,
      legs: [
        { kind: "straight", length: 10 },
        { kind: "straight", length: 4, reverse: true },
      ],
      speeds: [0, 0],
    });

    // 1. After 10 m forward.
    const forward: ReturnType<typeof createCar> = ride.at(ride.plan.when(10)).archetype;
    for (const id of spins)
      if (Math.abs(forward.travel(id) - expected(10)) > 1e-9)
        findings.push(`${kind}: ${id} at ${forward.travel(id)}, not ${expected(10)}`);
    const hub = (archetype: ReturnType<typeof createCar>): IAutoMovieVector3 =>
      Quaternion.rotateVector(
        archetype.parts.find((p: IAutoMovieModelPart): boolean => p.id === "hub-rear-left")!.transform!.rotation,
        { x: 0, y: 1, z: 0 },
      );
    const turned: number = (Math.atan2(hub(forward).z, hub(forward).y) * 180) / Math.PI;
    if (Math.abs((((turned - expected(10)) % 360) + 540) % 360 - 180) > 1e-6)
      findings.push(`${kind}: the hub bar turned ${turned}, not ${expected(10)}`);

    // 2. Back 4 m.
    const back: ReturnType<typeof createCar> = ride.at(ride.duration).archetype;
    if (Math.abs(back.travel("rearRightSpin") - expected(6)) > 1e-9)
      findings.push(`${kind}: after backing the wheels are at ${back.travel("rearRightSpin")}, not ${expected(6)}`);

    // 3. Before the start.
    if (ride.at(1).archetype.travel("frontLeftSpin") !== 0)
      findings.push(`${kind}: the wheels turn before the car moves`);
  }
  TestValidator.equals("road wheels roll with the distance", findings, []);
}
