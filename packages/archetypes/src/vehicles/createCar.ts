import {
  ArchetypeDraw,
  type AutoMovieArchetype,
  AutoMovieArchetypeBuilder,
  AutoMovieArchetypeDrawSession,
  AutoMovieArchetypeUnits,
  type IAutoMovieArchetypeBand,
} from "../core";
import { CAR_BANDS } from "./CAR_BANDS";
import { CAR_MODELS } from "./CAR_MODELS";
import { CarBody } from "./CarBody";
import { CarCabin } from "./CarCabin";
import { CarRear } from "./CarRear";

/**
 * A car: a sedan, a hatchback, a panel van or a crew-cab pickup, with doors,
 * windows, a bonnet and a boot, tailgate or sliding door that open, reclining
 * seats, the driver's controls, and road wheels that steer and spin.
 *
 * The car stands on its wheels with the middle of its wheelbase over the
 * origin, its front toward `+Z`. The body is an open frame (a floor, a bonnet,
 * a roof on pillars and low door panels) so the seats and the controls show
 * through it. The driver sits on the side `drive` names; `left` is `+X`.
 * Everything a driver's and a passenger's act reads is an affordance: the
 * doors' hinges with their handles and the openings behind them, the windows
 * that slide down and the openings above them, the seats and their reclining
 * backs, the steering wheel, the accelerator, the bonnet, and what the class
 * carries behind the cabin: a boot's lid and `load` floor, a van's sliding door
 * and `cargo` floor, a pickup's tailgate and `bed`. The front road wheels steer
 * as the steering wheel turns, and every road wheel spins on a `knob` that
 * `driveCar` turns by the distance covered. Getting in by a front door is
 * `HumanTravelCar.getIn`. The opt-in `HumanTravelCarExit.getOut` stages exit
 * from the rear bench through an already-open adjacent rear door. Rear-door
 * entry, sliding doors and tailgates serve static staging (#3498).
 *
 * @param params The class, its read model and tyre, the driving side and any
 *   dimension the author fixes.
 * @param seed The seed that picks the model and its tyre and draws every
 *   dimension left free inside its band; absent, the first model and tyre, and
 *   each dimension the middle of its band.
 * @returns The car.
 * @throws {AutoMovieArchetypeRefusal} For a fixed dimension outside its band or
 *   one the class lacks, or a model or tyre the class does not offer.
 * @evidence contracts/development/common.md#meaningful-documentation States the car's origin and front, why the body is open, which side the driver is on, what each class carries and what the affordances cover.
 * @evidence contracts/development/implementation.md#principled-implementation Pick one read model of the class whole and one of its tyres (`CAR_MODELS`, `ArchetypeDraw.model`), so no car mixes two models' figures, draw the remaining dimensions with the model's own ranges, lay the body out once (`CarBody.layout`), then build the shell (`CarBody`), the class's rear (`CarRear`), the wheels, the doors, the seats and the controls on that layout. The interior is laid out from the driver's seating reference point as SAE J1100 does.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure The body, the rear and the cabin are their own modules, each building from the one layout.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The accelerator and the steering wheel are placed by SAE J1516's pedal plane and ball of foot and a sedan package's L6 and H17. The overhangs, belt line, windows, doors, firewall and both rows' seating reference points along the car are the 2018 and 2023 Honda Accords' NCAP measurements. Four values remain named provisional ones, each stating the source to read: the cabin floor's height (`FLOOR`, bounded below by the read rocker edge and above by the derived belt line), the H-point's height over the cushion (`HIP`), the rear seat's height and the door handles' place (`HANDLE`). The brake, the gear lever, the mirror and the driver's belt grip are not built until a source places them. Every class's cabin is these Accord pieces placed on its read model's overall size, so one car mixes makers; each model's own pillar and roof stations are queued to be read. A van's middle pillar is its read bulkhead, no source giving its door station (`CarBody.layout`). Bands read at search results only are marked provisional.
 * @evidence contracts/development/implementation.md#efficient-algorithms About sixty parts.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each call builds one independent model.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
 */
export function createCar(
  params: createCar.IParams,
  seed?: number | string,
): AutoMovieArchetype<createCar.Affordance, createCar.Dimension> {
  const draw: AutoMovieArchetypeDrawSession<createCar.Dimension> =
    new AutoMovieArchetypeDrawSession<createCar.Dimension>(
      "car",
      createCar.UNITS,
      seed,
      params,
    );
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
  // One read model of the class, then one of the tyres it is offered on; its own ranges join the class's bands, and its figures are laid over the draw.
  const model: {
    name: createCar.Model | undefined;
    figures: Readonly<Partial<Record<createCar.Dimension, number>>>;
  } = draw.model<createCar.Model>(
    "model",
    params.model,
    CAR_MODELS.figures[kind],
  );
  const fitted: {
    figures: Readonly<Partial<Record<createCar.Dimension, number>>>;
  } = draw.model<createCar.Tyre>(
    "tyre",
    params.tyre,
    CAR_MODELS.tyres[model.name!],
  );
  const drawn: Partial<Record<createCar.Dimension, number>> = draw.dimensions(
    { ...createCar.BANDS[kind], ...CAR_MODELS.ranges[model.name!] },
    createCar.BANDS,
  );
  const d: Partial<Record<createCar.Dimension, number>> = {
    ...drawn,
    ...model.figures,
    ...fitted.figures,
  };
  const builder: AutoMovieArchetypeBuilder<
    createCar.Affordance,
    createCar.Dimension
  > = new AutoMovieArchetypeBuilder({
    material: "composite",
    id: params.id,
    name: kind,
    draw,
  });
  const layout: CarBody.ILayout = CarBody.layout(kind, side, d);
  CarBody.shell(builder, layout);
  CarRear.build(builder, layout);
  CarBody.wheels(builder, layout);
  CarCabin.doors(builder, layout);
  CarCabin.seats(builder, layout);
  CarCabin.controls(builder, layout);
  return builder.build(d.mass!, { rests: "rubber", ground: "asphalt" });
}

/** Companion types, constants and bands of {@link createCar}. */
export namespace createCar {
  /** The classes of car. */
  export type Kind = "sedan" | "hatchback" | "van" | "pickup";

  /** Every class, for a caller that reads one at run time. */
  export const KINDS: readonly Kind[] = ["sedan", "hatchback", "van", "pickup"];

  /**
   * The cabin floor (the heel's rest) above the ground of a sedan, a hatchback
   * and a pickup, metres, a provisional value: 0.30 m, a typical floor, not
   * read at a source. It fixes only the interior's height above the ground: the
   * seat height (SAE J1100's H30), SAE J1516, L6 and H17 fix everything above
   * it, and the doors' openings start at it. What is read bounds it: it lies
   * above the rocker's lower edge (`ROCKER`, 176 mm) and so above the 128 to
   * 146 mm ground clearance of the two Honda hatchbacks (Honda Jazz Hybrid and
   * Civic Hybrid specifications), and below the belt line (`ROCKER` plus
   * `BELT`, 921 mm). The source to read is J1100's H5 of a named sedan less its
   * H30 (SAE 2021-36-0030; the Ergonomics 2012 vehicle ingress and egress
   * study, https://doi.org/10.1080/00140139.2012.722694; UMTRI's ingress,
   * egress and seating studies). A van's floor is its measured side step.
   */
  export const FLOOR: number = 0.3;

  /**
   * The rocker panel's lower edge above the ground at the middle pillar,
   * metres: 176 mm, the 2018 Honda Accord 1.5T LX's sill height at the
   * B-pillar, measured from the ground to the body's lower edge (NHTSA side
   * impact report M20185302, data sheet 10, p. 21,
   * https://nrd-static.nhtsa.dot.gov/reports/vehdb/v10000/v10100/v10193R001.pdf).
   */
  export const ROCKER: number = 0.176;

  /**
   * The belt line, the doors' top edge and the side windows' bottom, above the
   * rocker's lower edge at the middle pillar, metres: 745 mm, the same report's
   * sill height to window bottom sill (data sheet 10). A pickup's belt line is
   * its bed's rail.
   */
  export const BELT: number = 0.745;

  /**
   * The side windows' opening above the belt line, metres: 413 mm, the same
   * report's front window opening (data sheet 10).
   */
  export const WINDOW: number = 0.413;

  /**
   * The front overhang's share of the length beyond the wheelbase: 0.457, the
   * same report's front axle to the front of the car (941 mm) over its length
   * (4889 mm) less its wheelbase (2830 mm) (data sheet 10).
   */
  export const OVERHANG: number = 0.457;

  /**
   * The front door's lower leading edge behind the front axle, metres: 578.6
   * mm. The 2023 Honda Accord LX's front axle lies 3992.1 mm ahead of its rear
   * bumper: its 2835 mm wheelbase plus the rear overhang that `OVERHANG` leaves
   * of its 4966 mm length. Its doors' lower leading edges average 3413.5 mm
   * ahead of the same bumper (NHTSA NCAP report NCAP-MGA-23-030, data sheets 1
   * and 12, pp. 6 and 21,
   * https://nrd-static.nhtsa.dot.gov/reports/vehdb/v10000/v15000/v15005R001.pdf).
   */
  export const DOOR_AXLE: number = 0.5786;

  /**
   * The front door's lower leading edge aft of the firewall, metres: 390.5 mm,
   * the 2023 report's firewall (3804) less the mean of its doors' lower leading
   * edges (3409 and 3418) (data sheet 12).
   */
  export const DOOR_LEAD: number = 0.3905;

  /**
   * The front door's length at its foot, metres: 1155 mm, the same report's
   * mean lower leading edge (3413.5) less its mean lower trailing edge (2258.5)
   * (data sheet 12).
   */
  export const DOOR_SPAN: number = 1.155;

  /**
   * The driver's seating reference point ahead of the middle pillar, metres:
   * 262 mm. This is the 2018 Accord's driver H-point to B-post striker along
   * the car (M20185302, data sheet 3, p. 13), with the striker taken at the
   * front door's trailing edge, where the door latches to it. SAE J1516 and the
   * sedan package's L6 and H17 place the steering wheel from it.
   */
  export const PILLAR_SGRP: number = 0.262;

  /**
   * The rear doors' trailing edge behind the front doors' leading edge, metres:
   * 2059 mm, the 2018 Accord's front door leading edge (849 mm) and rear door
   * trailing edge (1210 mm) on either side of the side impact's centreline
   * (M20185302, data sheet 10).
   */
  export const REAR_DOOR: number = 2.059;

  /**
   * The rear seat's H-point ahead of the rear doors' trailing edge, metres: 203
   * mm, the 2018 Accord's rear passenger H-point to C-post striker along the
   * car (M20185302, data sheet 3), the striker taken at the rear door's
   * trailing edge, where the door latches to it.
   */
  export const REAR_SGRP: number = 0.203;

  /**
   * The seating reference point above the cushion's surface, metres, a
   * provisional value: 97.5 mm, recalled as the height of the H-point machine's
   * (HPM-II's) H-point above its seat pan and not read at a source. The public
   * sample of ISO 20176:2020 ends before its Annex A (the machine's
   * description) and Annex B (its specification and tolerances), which are the
   * source to read, as is SAE J4002. The rear seat's cushion lies at the front
   * seats' height, also a provisional value: the source to read is SAE J1100's
   * H5 or H30 of a named sedan's second row.
   */
  export const HIP: number = 0.0975;

  /**
   * The outside door handles' place, metres, a provisional value read by the
   * act that opens a door: each handle's middle `drop` below the belt line and
   * `aft` ahead of the door's rear edge, `length` long. The source to read is a
   * side NCAP report that locates the handle against the striker, or a maker's
   * body dimensions.
   */
  export const HANDLE: Readonly<{ drop: number; aft: number; length: number }> =
    { drop: 0.08, aft: 0.12, length: 0.12 };
  /**
   * The driver's occupant centreline outboard of the car's centreline, metres:
   * 381 mm (SAE J826, 1995, 5.3.4), mirrored for the front passenger.
   */
  export const OCCUPANT: number = 0.381;

  /**
   * The right foot's offset to the right of the occupant's centreline, metres:
   * half the 254 mm between a seated occupant's feet, centre to centre (ISO
   * 6549:1999, 5.7.2.1 and 5.7.1.1.1); the accelerator lies under it.
   */
  export const FOOT: number = 0.127;

  /**
   * The ball of foot's distance from the accelerator heel point along the pedal
   * plane, metres: 203 mm (SAE J1516, reaffirmed 1990, 3.3.4; ISO 20176:2020 p.
   * vii, consistent with ISO 6549 and SAE J1100, where it replaced an earlier
   * 200 mm).
   */
  export const BALL: number = 0.203;

  /**
   * The steering wheel's centre aft of the ball of foot, metres: SAE J1100's L6
   * of a typical mid-size sedan, 550 mm (Park, Jones, Ebert, Reed and Hallman
   * 2018, Traffic Injury Prevention 19:825, p. 827).
   */
  export const WHEEL_AFT: number = 0.55;

  /**
   * The steering wheel's centre above the accelerator heel point, metres: SAE
   * J1100's H17 of the same sedan, 646 mm (Park et al. 2018, p. 827).
   */
  export const WHEEL_HEIGHT: number = 0.646;

  /**
   * The pedal plane's angle from the floor at a seat height: SAE J1516's
   * equation 2.
   *
   * @param seatHeight The seating reference point above the accelerator heel
   *   point, SAE J1100's H30, metres.
   * @returns The angle, degrees, rising forward from the heel.
   */
  export function pedalPlane(seatHeight: number): number {
    const z: number = seatHeight * 100;
    return 78.96 - 0.15 * z - 0.0173 * z * z;
  }

  /**
   * How far the seating reference point lies aft of the ball of foot at a seat
   * height: SAE J1516's class A tool reference line.
   *
   * @param seatHeight SAE J1100's H30, metres.
   * @returns The distance aft, metres.
   */
  export function seatAft(seatHeight: number): number {
    const z: number = seatHeight * 1000;
    return (793.7 + 0.903387 * z - 0.00225518 * z * z) / 1000;
  }
  /**
   * A pickup's tailgate opening, degrees: it drops to level, held by its stays,
   * a quarter turn from shut by the geometry of a gate hinged at its foot.
   */
  export const TAILGATE: number = 90;

  /**
   * The spacing of the road wheels' steering table, degrees of the mean road
   * wheel angle per row: linear interpolation between rows this close stays
   * within a hundredth of a degree of the Ackermann angle, the curve's second
   * derivative being under a radian per radian squared over a car's lock.
   */
  export const STEER_STEP: number = 1;

  /**
   * The angle a front road wheel steers to so that its axle line meets the rear
   * axle's at the turn's centre: Ackermann steering geometry.
   *
   * @param centre The equivalent single wheel's angle at the middle of the
   *   front axle, degrees, positive to the left: the steering wheel's turn over
   *   the steering ratio, the angle `driveCar` turns the car's path by.
   * @param wheelbase The wheelbase, metres.
   * @param side The wheel's offset from the car's centre line, metres, positive
   *   to the left (`+X`): half the track.
   * @returns The wheel's steering angle, degrees, positive to the left; the
   *   inner wheel of a turn steers more than the outer.
   */
  export function ackermann(
    centre: number,
    wheelbase: number,
    side: number,
  ): number {
    const tangent: number = Math.tan(centre * AutoMovieArchetypeUnits.DEGREE);
    return (
      (Math.atan2(wheelbase * tangent, wheelbase - side * tangent) * 180) /
      Math.PI
    );
  }

  /**
   * The affordance ids; a class lacks the ids of the parts it does not have:
   *
   * - `driverDoor`, `passengerDoor`, and on a sedan, a hatchback and a pickup
   *   `rearLeftDoor`, `rearRightDoor`: the side doors' hinges at their front
   *   edges; a positive travel swings a door outward.
   * - `driverDoorHandle`, `passengerDoorHandle`, `rearLeftDoorHandle`,
   *   `rearRightDoorHandle`: the outside handles, each riding its door.
   * - `driverAperture`, `passengerAperture`, `rearLeftAperture`,
   *   `rearRightAperture`: the door openings, passed through into the car.
   * - `driverWindow`, `passengerWindow`, `rearLeftWindow`, `rearRightWindow`:
   *   each door's glass, sliding down into it, riding the door; and
   *   `driverWindowOpening` and the rest, the opening above the glass, its
   *   threshold riding the glass's top edge, clear to `height` with the glass
   *   fully down.
   * - `driverSeat`, `passengerSeat`, and except in a van `rearSeat`: the seats,
   *   facing forward; `driverSeatBack` and the rest, each back's reclining
   *   hinge, a positive travel tipping it back; absent where `recline` is 0, a
   *   back that does not recline.
   * - `wheel`: the steering wheel, its axis toward the driver; its travel is half
   *   the lock-to-lock turn to either side, positive to the left.
   * - `frontLeftWheel`, `frontRightWheel`: the front road wheels' steering, each
   *   about the upright through its centre, positive to the left, following
   *   `wheel` by its Ackermann angle (`ackermann`), so the inner wheel of a
   *   turn steers more than the outer; a `wheel` articulation because a road
   *   wheel steers to either side of straight, which a `knob`'s range from 0
   *   does not allow.
   * - `frontLeftSpin`, `frontRightSpin`, `rearLeftSpin`, `rearRightSpin`: each
   *   road wheel's roll about its axle, a positive travel rolling it forward,
   *   the front pair riding their steering.
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
   *   kerb side, running back along `+X` of its frame, the opening it clears,
   *   and the cargo floor.
   * - `tailgate`, `bed`: a pickup's tailgate, a positive travel lowering it, and
   *   the bed's floor.
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

  /**
   * The free dimensions, metres unless stated; a class lacks those of the parts
   * it does not have:
   *
   * - `length`, `width`, `height`, `wheelbase`: the car's overall sizes.
   * - `wheelDiameter`: a road wheel with its tyre.
   * - `seatHeight`: the seating reference point above the heel's rest, SAE
   *   J1100's H30.
   * - `steeringDiameter`: the steering wheel's rim.
   * - `steeringAngle`: the steering wheel's plane from upright, degrees.
   * - `steeringRatio`: steering wheel turn over road wheel turn, a ratio.
   * - `lockTurns`: steering wheel turns from lock to lock, a count.
   * - `doorSwing`: a side door's widest opening, degrees.
   * - `pedalTravel`: how far a pedal is pressed.
   * - `bonnetSwing`: the bonnet's widest opening, degrees.
   * - `recline`: how far a seat back reclines from its upright setting, degrees.
   * - `bootSwing`: a boot lid's or tailgate's widest opening, degrees; a sedan
   *   and a hatchback.
   * - `sideDoorWidth`, `sideDoorHeight`: a van's sliding door opening;
   *   `sideStep`: the step at it, the van's cabin floor; `cargoFloor`: the
   *   cargo floor's height; `loadLength`: the cargo floor's length to the
   *   bulkhead.
   * - `bedLength`, `bedWidth`, `bedDepth`, `bedFloor`: a pickup bed's floor
   *   length, inside width and depth, and its floor's height; its rail, at the
   *   floor's height plus its depth, is the pickup's belt line.
   * - `frontOverhang`: the front of the car to the front wheels' centre, where a
   *   model's source gives it; otherwise the layout takes the measured sedan's
   *   share (`OVERHANG`).
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
    | "frontOverhang"
    | "mass";

  /** Each dimension's unit, which its band and any model's figure for it share. */
  export const UNITS: Readonly<
    Record<Dimension, AutoMovieArchetypeDrawSession.Unit>
  > = {
    length: "m",
    width: "m",
    height: "m",
    wheelbase: "m",
    wheelDiameter: "m",
    seatHeight: "m",
    steeringDiameter: "m",
    steeringAngle: "degrees",
    steeringRatio: "",
    lockTurns: "",
    doorSwing: "degrees",
    pedalTravel: "m",
    bonnetSwing: "degrees",
    recline: "degrees",
    bootSwing: "degrees",
    sideDoorWidth: "m",
    sideDoorHeight: "m",
    sideStep: "m",
    cargoFloor: "m",
    loadLength: "m",
    bedLength: "m",
    bedWidth: "m",
    bedDepth: "m",
    bedFloor: "m",
    frontOverhang: "m",
    mass: "kg",
  };

  /**
   * The parameters: the class, the driving side, and any free dimension the
   * class has fixed to a value inside its band.
   */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** Which class. */
    kind: Kind;

    /** Which read model of the class; drawn from the seed when absent. */
    model?: Model;

    /**
     * Which of the model's tyres, for a model offered on more than one; drawn
     * from the seed when absent.
     */
    tyre?: Tyre;

    /** Which side the driver sits on; left (`+X`) when absent. */
    drive?: "left" | "right";

    /** The model's id, unique in a scene; `car` when absent. */
    id?: string;
  }

  /**
   * The read models: a hatchback's Jazz and Civic grades, a sedan's Corolla and
   * Camry, a van's Transit Custom L1 and L2, a pickup's Ranger 4x2 and 4x4
   * (`CAR_MODELS`).
   */
  export type Model =
    | "jazzElegance"
    | "jazzAdvance"
    | "jazzCrosstarAdvance"
    | "jazzAdvanceSport"
    | "civicElegance"
    | "civicSport"
    | "civicAdvance"
    | "corolla"
    | "camry"
    | "transitL1"
    | "transitL2"
    | "ranger4x2"
    | "ranger4x4";

  /**
   * The tyres a model is offered on: the Transit's R16C and R17C, the Ranger's
   * R17 and R18.
   */
  export type Tyre = "r16c" | "r17c" | "r17" | "r18";

  /**
   * The band of each free dimension, by class; a model's own figures and ranges
   * are `CAR_MODELS`'s.
   */
  export const BANDS: Readonly<
    Record<Kind, Readonly<Partial<Record<Dimension, IAutoMovieArchetypeBand>>>>
  > = CAR_BANDS;
}
