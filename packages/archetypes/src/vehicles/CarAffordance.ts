/**
 * The affordance ids of a car `createCar` builds; a class lacks the ids of the
 * parts it does not have:
 *
 * - `driverDoor`, `passengerDoor`, and on a sedan, a hatchback and a pickup
 *   `rearLeftDoor`, `rearRightDoor`: the side doors' hinges at their front
 *   edges; a positive travel swings a door outward.
 * - `driverDoorHandle`, `passengerDoorHandle`, `rearLeftDoorHandle`,
 *   `rearRightDoorHandle`: the outside handles, each riding its door.
 * - `driverAperture`, `passengerAperture`, `rearLeftAperture`,
 *   `rearRightAperture`: the door openings, passed through into the car.
 * - `rearLeftSill`, `rearRightSill`: the bounded floor strip at each rear
 *   opening.
 * - `driverWindow`, `passengerWindow`, `rearLeftWindow`, `rearRightWindow`: each
 *   door's glass, sliding down into it, riding the door; and
 *   `driverWindowOpening` and the rest, the opening above the glass, its
 *   threshold riding the glass's top edge, clear to `height` with the glass
 *   fully down.
 * - `driverSeat`, `passengerSeat`, and except in a van `rearSeat`: the seats,
 *   facing forward; `driverSeatBack` and the rest, each back's reclining hinge,
 *   a positive travel tipping it back; absent where `recline` is 0, a back that
 *   does not recline.
 * - `wheel`: the steering wheel, its axis toward the driver; its travel is half
 *   the lock-to-lock turn to either side, positive to the left.
 * - `frontLeftWheel`, `frontRightWheel`: the front road wheels' steering, each
 *   about the upright through its centre, positive to the left, following
 *   `wheel` by its Ackermann angle (`createCar.ackermann`), so the inner wheel
 *   of a turn steers more than the outer; a `wheel` articulation because a road
 *   wheel steers to either side of straight, which a `knob`'s range from 0 does
 *   not allow.
 * - `frontLeftSpin`, `frontRightSpin`, `rearLeftSpin`, `rearRightSpin`: each road
 *   wheel's roll about its axle, a positive travel rolling it forward, the
 *   front pair riding their steering.
 * - `rightSteeringGrip`: the steering wheel's right rim, carried by the wheel's
 *   turn.
 * - `driverLeftRest`, `passengerLeftRest`, `passengerRightRest`: named sole
 *   contact points on the front cabin floor.
 * - `accelerator`: the accelerator pedal under the driver's right foot.
 * - `bonnet`: the bonnet's hinge at its rear edge; a positive travel lifts its
 *   front.
 * - `boot`, `load`: a sedan's boot lid or a hatchback's tailgate, a positive
 *   travel lifting it, and the boot's floor.
 * - `slidingDoor`, `slidingAperture`, `cargo`: a van's sliding side door on the
 *   kerb side, running back along `+X` of its frame, the opening it clears, and
 *   the cargo floor.
 * - `tailgate`, `bed`: a pickup's tailgate, a positive travel lowering it, and
 *   the bed's floor.
 */
export type CarAffordance =
  | "driverDoor"
  | "passengerDoor"
  | "rearLeftDoor"
  | "rearRightDoor"
  | "driverDoorHandle"
  | "passengerDoorHandle"
  | "rearLeftDoorHandle"
  | "rearRightDoorHandle"
  | "driverAperture"
  | "passengerAperture"
  | "rearLeftAperture"
  | "rearRightAperture"
  | "rearLeftSill"
  | "rearRightSill"
  | "driverWindow"
  | "passengerWindow"
  | "rearLeftWindow"
  | "rearRightWindow"
  | "driverWindowOpening"
  | "passengerWindowOpening"
  | "rearLeftWindowOpening"
  | "rearRightWindowOpening"
  | "driverSeat"
  | "passengerSeat"
  | "rearSeat"
  | "driverSeatBack"
  | "passengerSeatBack"
  | "rearSeatBack"
  | "wheel"
  | "frontLeftWheel"
  | "frontRightWheel"
  | "frontLeftSpin"
  | "frontRightSpin"
  | "rearLeftSpin"
  | "rearRightSpin"
  | "rightSteeringGrip"
  | "driverLeftRest"
  | "passengerLeftRest"
  | "passengerRightRest"
  | "accelerator"
  | "bonnet"
  | "boot"
  | "load"
  | "slidingDoor"
  | "slidingAperture"
  | "cargo"
  | "tailgate"
  | "bed";
