import {
  AutoMovieArchetypeCar,
  AutoMovieArchetypeFrame,
  AutoMovieArchetypeUnits,
} from "@automovie/archetypes";
import type {
  IAutoMovieAffordance,
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

/**
 * A car's accelerator, steering wheel, doors and seats stand where the
 * packaging standards and a measured sedan place them for its seat height.
 *
 * Scenarios, for every class at four seeds and both driving sides:
 *
 * 1. The accelerator's plate faces the sole out of SAE J1516's pedal plane, at
 *    78.96 - 0.15 z - 0.0173 z squared degrees from the floor with z the seat
 *    height H30 in centimetres, within 1e-9.
 * 2. The accelerator's plate lies at the ball of foot, 203 mm up that plane from
 *    the heel point on the cabin floor: its height above the floor is 203 mm
 *    times the sine of the angle (plus the frame's 5 mm lift off the plate
 *    along the sole), within 1e-9 m.
 * 3. The driver's centreline is 381 mm outboard of the car's on the driving side
 *    (SAE J826 5.3.4): the steering wheel is centred on it and the accelerator
 *    lies 127 mm to its right, under the right foot of feet 254 mm apart (ISO
 *    6549 5.7.2.1).
 * 4. The steering wheel's centre lies 550 mm aft of the ball of foot (SAE J1100's
 *    L6) and 646 mm above the heel point (H17), the values of a mid-size sedan
 *    package, within 1e-9 m.
 * 5. The front door's hinge stands 578.6 mm behind the front axle and its opening
 *    is 1155 mm long (the 2023 Honda Accord's NCAP stations), except a van's,
 *    whose opening ends at its bulkhead, the load length ahead of the rear
 *    doors' 0.04 m inner panel on a 958 mm front overhang (Ford's Transit
 *    Custom figures); the ball of foot lies SAE J1516's tool reference
 *    distance, 793.7 + 0.903387 z - 0.00225518 z squared mm with z = H30 in mm,
 *    ahead of a seating reference point 262 mm ahead of the door's rear edge
 *    (the 2018 Accord's driver H-point to B-post striker).
 * 6. The cabin floor, a provisional height, lies above the rocker panel's measured
 *    lower edge, 176 mm, and below the belt line 745 mm above that edge (the
 *    2018 Accord's side impact report); the door opening's threshold is the
 *    floor and its top the window's top, 176 + 745 + 413 mm above the ground,
 *    except on a pickup, whose belt is its bed's rail.
 * 7. Outside a van, the rear bench's seating reference point lies 203 mm ahead of
 *    the rear doors' trailing edge, which lies 2059 mm behind the front doors'
 *    leading edge, so the rear seat's front edge is 963 mm behind the driver's,
 *    at the driver's height (the 2018 Accord's report); a sedan's and a
 *    hatchback's rear opening runs from the middle pillar to that trailing
 *    edge, 904 mm.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Describes the pedal, steering wheel, driver's station, hinge and seat geometry, cabin floor and rear bench across the four vehicle types.
 * @evidence contracts/development/testing.md#behavioral-verification Builds cars across the chosen seeds and driving sides and reads actual pedal, steering, door and seat frames. It distinguishes the measured station conditions from the explicit provisional floor bounds.
 * @evidence contracts/development/testing.md#independent-expectations Uses SAE and ISO pedal references, the 203 mm ball-of-foot height and 550 mm wheel offset, and the stated cited cabin and door measurements. The floor fixture imposes a measured rocker and seat interval.
 */
export function test_archetype_car_controls(): void {
  const findings: string[] = [];
  const close = (a: number, b: number): boolean => Math.abs(a - b) <= 1e-9;
  for (const kind of AutoMovieArchetypeCar.KINDS)
    for (const drive of ["left", "right"] as const)
      for (const seed of [0, 3, 7, 12]) {
        const car: ReturnType<typeof AutoMovieArchetypeCar.create> =
          AutoMovieArchetypeCar.create({ kind, drive }, seed);
        const label: string = `${kind} ${drive}@${seed}`;
        const h30: number = car.dimensions.seatHeight!;
        const z: number = h30 * 100;
        const angle: number =
          (78.96 - 0.15 * z - 0.0173 * z * z) * AutoMovieArchetypeUnits.DEGREE;
        const pedal: IAutoMovieTransform = car.affordance("accelerator").frame;
        const sole: IAutoMovieVector3 = AutoMovieArchetypeFrame.axis(
          pedal,
          "y",
        );
        if (!close(sole.y, Math.cos(angle)) || !close(sole.z, -Math.sin(angle)))
          findings.push(`${label}: the pedal plane is not J1516's`);

        // The floor: a van's drawn side step, otherwise the provisional constant, bounded by the measured rocker and belt line.
        const floor: number =
          kind === "van"
            ? car.dimensions.sideStep!
            : AutoMovieArchetypeCar.FLOOR;
        if (kind !== "van" && !(floor > 0.176 && floor < 0.176 + 0.745))
          findings.push(
            `${label}: the floor ${floor} m is not between the rocker's lower edge and the belt line`,
          );
        const lift: number = 0.005 * Math.cos(angle);
        if (!close(pedal.translation.y - lift - floor, 0.203 * Math.sin(angle)))
          findings.push(`${label}: the accelerator is not at the ball of foot`);
        const ball: IAutoMovieVector3 = {
          x: pedal.translation.x,
          y: pedal.translation.y - lift,
          z: pedal.translation.z + 0.005 * Math.sin(angle),
        };
        const centreline: number = (drive === "left" ? 1 : -1) * 0.381;
        if (!close(pedal.translation.x, centreline - 0.127))
          findings.push(
            `${label}: the accelerator is not under the right foot`,
          );
        const wheel: IAutoMovieVector3 =
          car.affordance("wheel").frame.translation;
        if (!close(wheel.x, centreline))
          findings.push(
            `${label}: the steering wheel is off the driver's centreline`,
          );
        if (!close(ball.z - wheel.z, 0.55) || !close(wheel.y - floor, 0.646))
          findings.push(
            `${label}: the steering wheel is ${ball.z - wheel.z} m aft and ${wheel.y - floor} m up`,
          );

        // The front door from the front axle, and the seating reference point from the door's rear edge: the Accord's, except that a van's cab closes at its bulkhead, the load length ahead of its rear doors' 0.04 m inner panel, the van standing on its 958 mm front overhang.
        const hinge: number = car.affordance("driverDoor").frame.translation.z;
        const aperture: IAutoMovieAffordance = car.affordance("driverAperture");
        const wheelbase: number = car.dimensions.wheelbase!;
        const pillar: number =
          kind === "van"
            ? wheelbase / 2 +
              0.958 -
              car.dimensions.length! +
              0.04 +
              car.dimensions.loadLength!
            : hinge - 1.155;
        if (
          !close(wheelbase / 2 - hinge, 0.5786) ||
          !close(aperture.width!, hinge - pillar)
        )
          findings.push(
            `${label}: the front door does not span from its hinge to its middle pillar`,
          );
        const mm: number = h30 * 1000;
        const aft: number =
          (793.7 + 0.903387 * mm - 0.00225518 * mm * mm) / 1000;
        if (!close(ball.z, pillar + 0.262 + aft))
          findings.push(
            `${label}: the ball of foot is not J1516's distance ahead of the seating reference point`,
          );

        // The door opening's threshold and top.
        if (!close(aperture.frame.translation.y, floor))
          findings.push(
            `${label}: the door opening's threshold is not the floor`,
          );
        if (
          kind !== "pickup" &&
          !close(floor + aperture.height!, 0.176 + 0.745 + 0.413)
        )
          findings.push(
            `${label}: the door opening's top is not the measured window's`,
          );

        // The rear bench and the rear doors.
        if (kind === "van") continue;
        const front: IAutoMovieVector3 =
          car.affordance("driverSeat").frame.translation;
        const rear: IAutoMovieVector3 =
          car.affordance("rearSeat").frame.translation;
        if (
          !close(rear.z - front.z, -2.059 + 0.203 + 1.155 - 0.262) ||
          !close(rear.y, front.y)
        )
          findings.push(
            `${label}: the rear seat is ${front.z - rear.z} m behind the driver's and ${rear.y - front.y} m above it`,
          );
        if (
          kind !== "pickup" &&
          !close(car.affordance("rearLeftAperture").width!, 2.059 - 1.155)
        )
          findings.push(
            `${label}: the rear door does not end at the Accord's measured trailing edge`,
          );
      }
  TestValidator.equals(
    "the controls, doors and seats stand where the sources put them",
    findings,
    [],
  );
}
