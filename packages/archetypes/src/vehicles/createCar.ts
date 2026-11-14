import {
  type Archetype,
  ArchetypeBuilder,
  ArchetypeDraw,
  type IArchetypeBand,
} from "../core";
import { CAR_BANDS } from "./CAR_BANDS";
import { CarBody } from "./CarBody";
import { CarCabin } from "./CarCabin";
import { CarRear } from "./CarRear";

/**
 * A car: a sedan, a hatchback, a panel van or a crew-cab pickup, with doors, windows, a bonnet and a boot, tailgate or sliding door that open, reclining seats, the driver's controls, and road wheels that steer and spin.
 *
 * The car stands on its wheels with the middle of its wheelbase over the origin, its front toward `+Z`. The body is an open frame (a floor, a bonnet, a roof on pillars and low door panels) so the seats and the controls show through it. The driver sits on the side `drive` names; `left` is `+X`. Everything a driver's and a passenger's act reads is an affordance: the doors' hinges with their handles and the openings behind them, the windows that slide down and the openings above them, the seats and their reclining backs, the steering wheel, the pedals and the gear lever, the driver's belt, the mirror, the bonnet, and what the class carries behind the cabin: a boot's lid and `load` floor, a van's sliding door and `cargo` floor, a pickup's tailgate and `bed`. The front road wheels steer as the steering wheel turns, and every road wheel spins on a `knob` that `driveCar` turns by the distance covered. Getting in by a front door is `HumanTravelCar.getIn`; getting out, and in by a rear door, a sliding door or over a tailgate, has no motion law yet, so those openings serve static staging until one is written (#3498).
 *
 * @param params The class, the driving side and any dimension the author fixes.
 * @param seed The seed that draws every dimension left free inside its band; absent, each takes the middle of its band.
 * @returns The car.
 * @throws {ArchetypeRefusal} For a fixed dimension outside its band or one the class lacks.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the car's origin and front, why the body is open, which side the driver is on, what each class carries and what the affordances cover.
 * @evidence contracts/development/implementation.md#principled-implementation Draw the dimensions, lay the body out once (`CarBody.layout`), then build the shell (`CarBody`), the class's rear (`CarRear`), the wheels, the doors, the seats and the controls on that layout. The interior is laid out from the driver's seating reference point as SAE J1100 does.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure The body, the rear and the cabin are their own modules, each building from the one layout.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The offsets of the controls from the seating reference point and the belt line are named constants marked as unsourced; bands read at search results only are marked provisional.
 * @evidence contracts/development/implementation.md#efficient-algorithms About sixty parts.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each call builds one independent model.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
 */
export function createCar(
  params: createCar.IParams,
  seed?: number | string,
): Archetype<createCar.Affordance, createCar.Dimension> {
  const kind: createCar.Kind = ArchetypeDraw.choice(
    "car",
    "kind",
    params.kind,
    createCar.KINDS,
  );
  const side: number =
    ArchetypeDraw.choice("car", "drive", params.drive ?? "left", [
      "left",
      "right",
    ]) === "left"
      ? 1
      : -1;
  const d: Partial<Record<createCar.Dimension, number>> =
    ArchetypeDraw.dimensions(
      "car",
      createCar.BANDS[kind],
      seed,
      params,
      createCar.BANDS,
    );
  const builder: ArchetypeBuilder<createCar.Affordance, createCar.Dimension> =
    new ArchetypeBuilder({
      archetype: "car",
      id: params.id,
      name: kind,
      dimensions: d,
    });
  const layout: CarBody.ILayout = CarBody.layout(kind, side, d);
  CarBody.shell(builder, layout);
  CarRear.build(builder, layout);
  CarBody.wheels(builder, layout);
  CarCabin.doors(builder, layout);
  CarCabin.seats(builder, layout);
  CarCabin.controls(builder, layout);
  return builder.build(d.mass!);
}

/**
 * Companion types, constants and bands of {@link createCar}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Each kind, affordance, dimension and layout constant states what it is and where it comes from.
 * @evidence contracts/development/design.md#principled-representation Closed unions, one cited band per dimension per class, and the interior laid out from the seating reference point as SAE J1100 does.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The dimensions an entering, driving and loading act reads (#3372, #3498): seat height, the wheel's place, size and turn, the doors' swing, the pedals' travel, the openings and the load floors.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Layout offsets no source gave are exported constants that say so, not numbers buried in the builders.
 */
export namespace createCar {
  /** The classes of car. */
  export type Kind = "sedan" | "hatchback" | "van" | "pickup";

  /** Every class, for a caller that reads one at run time. */
  export const KINDS: readonly Kind[] = ["sedan", "hatchback", "van", "pickup"];

  /** The cabin floor (the heel's rest) above the ground of a sedan, a hatchback and a pickup, metres: a typical floor over the 128 to 146 mm ground clearance of the two Honda hatchbacks; not read at a source. A van's floor is its measured side step. */
  export const FLOOR: number = 0.3;

  /** The belt line, the doors' top edge, above the cabin floor, metres: a typical package, not read at a source. A pickup's belt line is its bed's rail. */
  export const BELT: number = 0.55;

  /** The driver's seating reference point behind the front axle, metres: a typical package, not read at a source. */
  export const REFERENCE: number = 1.25;

  /** The seating reference point above the cushion's surface, metres: the 97.5 mm of the SAE J826 H-point machine, recalled and not read at a source. */
  export const HIP: number = 0.0975;

  /** The heel point ahead of the seating reference point, metres: SAE J1100's L53, which the standard defines without a value; a typical sedan's, not read at a source. */
  export const HEEL: number = 0.85;

  /** The bulkhead ahead of the heel point, metres: the pedal pads stand 0.1 m ahead of the heel and travel on from there; an estimate, not read at a source. */
  export const FOOTWELL: number = 0.16;

  /** The steering wheel's centre from the seating reference point, metres ahead and up: SAE J1100's L11 and H17 are measured from the heel point and given no value; a typical package, not read at a source. */
  export const WHEEL: Readonly<{ ahead: number; up: number }> = {
    ahead: 0.42,
    up: 0.33,
  };

  /** A pickup's tailgate opening, degrees: it drops to level, held by its stays, a quarter turn from shut by the geometry of a gate hinged at its foot. */
  export const TAILGATE: number = 90;

  /** The spacing of the road wheels' steering table, degrees of the mean road wheel angle per row: linear interpolation between rows this close stays within a hundredth of a degree of the Ackermann angle, the curve's second derivative being under a radian per radian squared over a car's lock. */
  export const STEER_STEP: number = 1;

  /**
   * The angle a front road wheel steers to so that its axle line meets the rear axle's at the turn's centre: Ackermann steering geometry.
   *
   * @param centre The equivalent single wheel's angle at the middle of the front axle, degrees, positive to the left: the steering wheel's turn over the steering ratio, the angle `driveCar` turns the car's path by.
   * @param wheelbase The wheelbase, metres.
   * @param side The wheel's offset from the car's centre line, metres, positive to the left (`+X`): half the track.
   * @returns The wheel's steering angle, degrees, positive to the left; the inner wheel of a turn steers more than the outer.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the geometry, each input's unit and sign, and the result.
   * @evidence contracts/development/implementation.md#principled-implementation The rear axle's turning radius is the wheelbase over the tangent of the middle angle; a wheel offset `side` toward the centre turns on that radius less `side`, so its angle's tangent is the wheelbase over that, written as an arctangent of two terms so a straight wheel and a turn either way are one expression (Ackermann steering geometry, Wikipedia, https://en.wikipedia.org/wiki/Ackermann_steering_geometry, not read at a primary). King-pin inclination and caster are left out.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One expression.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No case to special-case.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function ackermann(
    centre: number,
    wheelbase: number,
    side: number,
  ): number {
    const tangent: number = Math.tan((centre * Math.PI) / 180);
    return (
      (Math.atan2(wheelbase * tangent, wheelbase - side * tangent) * 180) /
      Math.PI
    );
  }

  /**
   * The affordance ids; a class lacks the ids of the parts it does not have:
   *
   * - `driverDoor`, `passengerDoor`, and on a sedan, a hatchback and a pickup `rearLeftDoor`, `rearRightDoor`: the side doors' hinges at their front edges; a positive travel swings a door outward.
   * - `driverDoorHandle`, `passengerDoorHandle`, `rearLeftDoorHandle`, `rearRightDoorHandle`: the outside handles, each riding its door.
   * - `driverAperture`, `passengerAperture`, `rearLeftAperture`, `rearRightAperture`: the door openings, passed through into the car.
   * - `driverWindow`, `passengerWindow`, `rearLeftWindow`, `rearRightWindow`: each door's glass, sliding down into it, riding the door; and `driverWindowOpening` and the rest, the opening above the glass, its threshold riding the glass's top edge, clear to `height` with the glass fully down.
   * - `driverSeat`, `passengerSeat`, and except in a van `rearSeat`: the seats, facing forward; `driverSeatBack` and the rest, each back's reclining hinge, a positive travel tipping it back.
   * - `wheel`: the steering wheel, its axis toward the driver; its travel is half the lock-to-lock turn to either side, positive to the left.
   * - `frontLeftWheel`, `frontRightWheel`: the front road wheels' steering, each about the upright through its centre, positive to the left, following `wheel` by its Ackermann angle (`ackermann`), so the inner wheel of a turn steers more than the outer; a `wheel` articulation because a road wheel steers to either side of straight, which a `knob`'s range from 0 does not allow.
   * - `frontLeftSpin`, `frontRightSpin`, `rearLeftSpin`, `rearRightSpin`: each road wheel's roll about its axle, a positive travel rolling it forward, the front pair riding their steering.
   * - `accelerator`, `brake`: the pedals.
   * - `gear`: the gear lever's fore-and-aft slide, and `gearKnob` the knob a hand holds, riding it.
   * - `driverBelt`: where the driver's hand takes the belt on the pillar behind the door.
   * - `mirror`: the rear-view mirror's face.
   * - `bonnet`: the bonnet's hinge at its rear edge; a positive travel lifts its front.
   * - `boot`, `load`: a sedan's boot lid or a hatchback's tailgate, a positive travel lifting it, and the boot's floor.
   * - `slidingDoor`, `slidingAperture`, `cargo`: a van's sliding side door on the kerb side, running back along `+X` of its frame, the opening it clears, and the cargo floor.
   * - `tailgate`, `bed`: a pickup's tailgate, a positive travel lowering it, and the bed's floor.
   */
  export type Affordance =
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
    | "accelerator"
    | "brake"
    | "gear"
    | "gearKnob"
    | "driverBelt"
    | "mirror"
    | "bonnet"
    | "boot"
    | "load"
    | "slidingDoor"
    | "slidingAperture"
    | "cargo"
    | "tailgate"
    | "bed";

  /**
   * The free dimensions, metres unless stated; a class lacks those of the parts it does not have:
   *
   * - `length`, `width`, `height`, `wheelbase`: the car's overall sizes.
   * - `wheelDiameter`: a road wheel with its tyre.
   * - `seatHeight`: the seating reference point above the heel's rest, SAE J1100's H30.
   * - `steeringDiameter`: the steering wheel's rim.
   * - `steeringAngle`: the steering wheel's plane from upright, degrees.
   * - `steeringRatio`: steering wheel turn over road wheel turn, a ratio.
   * - `lockTurns`: steering wheel turns from lock to lock, a count.
   * - `doorSwing`: a side door's widest opening, degrees.
   * - `pedalTravel`: how far a pedal is pressed.
   * - `bonnetSwing`: the bonnet's widest opening, degrees.
   * - `recline`: how far a seat back reclines from its upright setting, degrees.
   * - `bootSwing`: a boot lid's or tailgate's widest opening, degrees; a sedan and a hatchback.
   * - `sideDoorWidth`, `sideDoorHeight`: a van's sliding door opening; `sideStep`: the step at it, the van's cabin floor; `cargoFloor`: the cargo floor's height; `loadLength`: the cargo floor's length to the bulkhead.
   * - `bedLength`, `bedWidth`, `bedDepth`, `bedFloor`: a pickup bed's floor length, inside width and depth, and its floor's height; its rail, at the floor's height plus its depth, is the pickup's belt line.
   * - `mass`: kerb mass, kilograms.
   */
  export type Dimension =
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
    | "mass";

  /** The parameters: the class, the driving side, and any free dimension the class has fixed to a value inside its band. */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** Which class. */
    kind: Kind;

    /** Which side the driver sits on; left (`+X`) when absent. */
    drive?: "left" | "right";

    /** The model's id, unique in a scene; `car` when absent. */
    id?: string;
  }

  /** The band of each free dimension, by class. */
  export const BANDS: Readonly<
    Record<Kind, Readonly<Partial<Record<Dimension, IArchetypeBand>>>>
  > = CAR_BANDS;
}
