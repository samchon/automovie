/**
 * The free dimensions of a car `AutoMovieArchetypeCar` builds, metres unless
 * stated; a class lacks those of the parts it does not have:
 *
 * - `length`, `width`, `height`, `wheelbase`: the car's overall sizes.
 * - `wheelDiameter`: a road wheel with its tyre.
 * - `seatHeight`: the seating reference point above the heel's rest, SAE J1100's
 *   H30.
 * - `steeringDiameter`: the steering wheel's rim.
 * - `steeringAngle`: the steering wheel's plane from upright, degrees.
 * - `steeringRatio`: steering wheel turn over road wheel turn, a ratio.
 * - `lockTurns`: steering wheel turns from lock to lock, a count.
 * - `doorSwing`: a side door's widest opening, degrees.
 * - `pedalTravel`: how far a pedal is pressed.
 * - `bonnetSwing`: the bonnet's widest opening, degrees.
 * - `recline`: how far a seat back reclines from its upright setting, degrees.
 * - `bootSwing`: a boot lid's or tailgate's widest opening, degrees; a sedan and
 *   a hatchback.
 * - `sideDoorWidth`, `sideDoorHeight`: a van's sliding door opening; `sideStep`:
 *   the step at it, the van's cabin floor; `cargoFloor`: the cargo floor's
 *   height; `loadLength`: the cargo floor's length to the bulkhead.
 * - `bedLength`, `bedWidth`, `bedDepth`, `bedFloor`: a pickup bed's floor length,
 *   inside width and depth, and its floor's height; its rail, at the floor's
 *   height plus its depth, is the pickup's belt line.
 * - `frontOverhang`: the front of the car to the front wheels' centre, where a
 *   model's source gives it; otherwise the layout takes the measured sedan's
 *   share (`AutoMovieArchetypeCar.OVERHANG`).
 * - `mass`: kerb mass, kilograms.
 */
export type CarDimension =
  | "length"
  | "width"
  | "height"
  | "wheelbase"
  | "wheelDiameter"
  | "seatHeight"
  | "steeringDiameter"
  | "steeringAngle"
  | "steeringRatio"
  | "lockTurns"
  | "doorSwing"
  | "pedalTravel"
  | "bonnetSwing"
  | "recline"
  | "bootSwing"
  | "sideDoorWidth"
  | "sideDoorHeight"
  | "sideStep"
  | "cargoFloor"
  | "loadLength"
  | "bedLength"
  | "bedWidth"
  | "bedDepth"
  | "bedFloor"
  | "frontOverhang"
  | "mass";
