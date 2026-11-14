import { ArchetypeFrame, createCar } from "@automovie/archetypes";
import type {
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

/**
 * A car's pedals and steering wheel stand where the packaging standards place them for its seat height.
 *
 * Scenarios, for every class at four seeds and both driving sides:
 * 1. The accelerator's plate faces the sole out of SAE J1516's pedal plane, at 78.96 - 0.15 z - 0.0173 z squared degrees from the floor with z the seat height H30 in centimetres, within 1e-9.
 * 2. The accelerator's plate lies at the ball of foot, 203 mm up that plane from the heel point on the cabin floor: its height above the floor is 203 mm times the sine of the angle (plus the frame's 5 mm lift off the plate along the sole), within 1e-9 m.
 * 3. The steering wheel's centre lies 550 mm aft of the ball of foot (SAE J1100's L6) and 646 mm above the heel point (H17), the values of a mid-size sedan package, within 1e-9 m.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Produces cars and reads the pedal and wheel contacts' frames; a pedal on another plane, off the ball of foot, or a wheel at another distance from the pedals is caught.
 * @evidence contracts/development/testing.md#independent-expectations The angle is SAE J1516's equation 2 (reaffirmed 1990), the 203 mm its 3.3.4 and ISO 20176:2020's, and L6 and H17 Park et al. 2018's sedan package, each worked here from the car's drawn seat height and its floor, not read from the producer's layout.
 * @evidence contracts/development/testing.md#distinguishing-cases Four classes, four seeds spreading the seat height through its band, and both driving sides; the seat's own place belongs to the seating tests.
 * @evidence contracts/development/testing.md#execution-ownership A unit test over in-memory models, discovered by its exported name; it starts no host.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the three scenarios and what each pins.
 */
export function test_archetype_car_controls(): void {
  const findings: string[] = [];
  for (const kind of createCar.KINDS)
    for (const drive of ["left", "right"] as const)
      for (const seed of [0, 3, 7, 12]) {
        const car: ReturnType<typeof createCar> = createCar({ kind, drive }, seed);
        const label: string = `${kind} ${drive}@${seed}`;
        const z: number = car.dimensions.seatHeight! * 100;
        const angle: number = ((78.96 - 0.15 * z - 0.0173 * z * z) * Math.PI) / 180;
        const pedal: IAutoMovieTransform = car.affordance("accelerator").frame;
        const sole: IAutoMovieVector3 = ArchetypeFrame.axis(pedal, "y");
        if (Math.abs(sole.y - Math.cos(angle)) > 1e-9 || Math.abs(sole.z + Math.sin(angle)) > 1e-9)
          findings.push(`${label}: the pedal plane is not J1516's`);

        // The floor is the driver's door opening's threshold.
        const floor: number = car.affordance("driverAperture").frame.translation.y;
        const lift: number = 0.005 * Math.cos(angle);
        if (Math.abs(pedal.translation.y - lift - floor - 0.203 * Math.sin(angle)) > 1e-9)
          findings.push(`${label}: the accelerator is not at the ball of foot`);
        const ball: IAutoMovieVector3 = {
          x: pedal.translation.x,
          y: pedal.translation.y - lift,
          z: pedal.translation.z + 0.005 * Math.sin(angle),
        };
        const wheel: IAutoMovieVector3 = car.affordance("wheel").frame.translation;
        if (Math.abs(ball.z - wheel.z - 0.55) > 1e-9 || Math.abs(wheel.y - floor - 0.646) > 1e-9)
          findings.push(`${label}: the steering wheel is ${ball.z - wheel.z} m aft and ${wheel.y - floor} m up`);
      }
  TestValidator.equals("the controls stand where the standards put them", findings, []);
}
