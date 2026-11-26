import type { IPlaygroundComposition } from "../../playground/structures/IPlaygroundComposition";
import type { IScene } from "../structures/IScene";
import { SceneBuild } from "./SceneBuild";

const { act, object, person, scene, seat, to }: typeof SceneBuild = SceneBuild;

/** The place-and-stop course for a two-wheeler after its rider takes the seat. */
const TWO_WHEELS: NonNullable<IPlaygroundComposition.IObject["course"]> = {
  at: 4.6,
  cruise: 0.5,
  acceleration: 0.6,
  deceleration: 0.6,
  legs: [
    { kind: "straight", length: 1.2 },
    { kind: "turn", radius: 3, angle: 15 },
    { kind: "straight", length: 0.6 },
  ],
};

/** The car seat an occupant takes, which names its seat, door handle and aperture. */
type SceneCarRole = "driver" | "passenger";

/** One occupant of the car trip and the side it boards from. */
interface ICarRider {
  /** The performer. */
  subject: string;

  /** The scene body. */
  body: string;

  /** The seat role. */
  role: SceneCarRole;

  /** The car's side, 1 on +X. */
  side: number;

  /** The stance beside the closed door, in scene metres. */
  start: { x: number; z: number };

  /** The heading of the approach, degrees. */
  approach: number;

  /** The heading at the door before getting in, degrees. */
  enter: number;
}

/** The car's boarding marks and road course use a shared, authored film clock. */
function carRide(): IScene {
  const depart: number = 13.1;
  const door: IPlaygroundComposition.IJointKey[] = [
    { seconds: 0, value: 0 },
    { seconds: 0.6, value: 0 },
    { seconds: 3.15, value: 45 },
    { seconds: 12.3, value: 45 },
    { seconds: depart, value: 0 },
  ];
  const car: IPlaygroundComposition.IObject = {
    ...object("car", "createCar", "sedan", 0, 0),
    joints: { driverDoor: door, passengerDoor: door },
    course: {
      ...TWO_WHEELS,
      at: depart,
      cruise: 0.6,
      legs: [
        { kind: "straight", length: 1.1 },
        { kind: "turn", radius: 7, angle: 10 },
        { kind: "straight", length: 0.6 },
      ],
    },
  };
  const riders: readonly ICarRider[] = [
    {
      subject: "drv",
      body: "m1",
      role: "driver",
      side: 1,
      start: { x: 1.27, z: -0.08 },
      approach: 270,
      enter: 90,
    },
    {
      subject: "pas",
      body: "f1",
      role: "passenger",
      side: -1,
      start: { x: -1.15, z: -0.2 },
      approach: 90,
      enter: 270,
    },
  ];
  return scene(
    {
      id: "car-trip",
      title: "A short car trip",
      summary:
        "A driver and passenger board together, take a gentle bend and come to a stop.",
      setting: "ride",
      roles: { drv: "driver", pas: "passenger" },
      needs: [],
    },
    "car-trip",
    riders.map(
      ({
        subject,
        body,
        role,
        side,
        start,
        approach,
        enter,
      }: ICarRider): SceneBuild.Performer =>
        person(subject, body, start.x, start.z, approach, [
          act("openDoor", {
            door: "car",
            handle: role + "DoorHandle",
            duration: 3.15,
          }),
          act("walk", { to: to(0.75 * side, -0.2), face: enter }),
          act("getIn", {
            seat: seat("car", role + "Seat"),
            through: { $aperture: "car", id: role + "Aperture" },
          }),
          act("ride", {
            on: "car",
            duration: 9,
            seat: role + "Seat",
            placeFeet: true,
            ...(role === "driver"
              ? {
                  hands: { right: "rightSteeringGrip" },
                  feet: { left: "driverLeftRest", right: "accelerator" },
                }
              : {
                  feet: {
                    left: "passengerLeftRest",
                    right: "passengerRightRest",
                  },
                }),
          }),
        ]),
    ),
    [car],
  );
}

/** A two-wheeler the ride scenes stage: a city bicycle or a motorcycle producer's kind. */
type SceneTwoWheeler = "city" | "scooter" | "motorcycle";

/** The vehicle's named foot supports, one per side. */
interface ISceneRideFeet {
  /** The left sole's support point. */
  left: string;

  /** The right sole's support point. */
  right: string;
}

/** Board a two-wheeler, pick up its controls and stay supported through a stop. */
function twoWheelRide(
  kind: SceneTwoWheeler,
  id: string,
  title: string,
  summary: string,
  feet: ISceneRideFeet,
): IScene {
  const bicycle: boolean = kind === "city";
  const seatName: string = bicycle ? "saddle" : "seat";
  const support: IPlaygroundComposition.IObject = {
    ...object(
      "vehicle",
      bicycle ? "createBicycle" : "createMotorcycle",
      bicycle ? undefined : kind,
      0,
      0,
    ),
    course: bicycle ? { ...TWO_WHEELS, at: 5.6 } : TWO_WHEELS,
    // A saddle that lets both casts maintain sole contact at bottom dead center.
    ...(bicycle ? { params: { saddleHeight: 0.62 } } : {}),
  };
  const enter: SceneBuild.Action = bicycle
    ? act("bikeTransfer", {
        on: support.subject,
        mode: "mount",
        line: { x: 0, z: -0.6, heading: 0 },
      })
    : act("sit", { seat: seat(support.subject, seatName), hold: 0.25 });
  const leave: SceneBuild.Action = act("bikeTransfer", {
    on: support.subject,
    mode: "dismount",
    line: { x: 0.26, z: 3.25, heading: 15 },
  });
  return scene(
    {
      id,
      title,
      summary,
      setting: "ride",
      roles: { rider: "rider" },
      needs: [],
    },
    id,
    [
      person("rider", "m1", bicycle ? 0.6 : 0.25, bicycle ? -0.2 : 0.2, 0, [
        enter,
        act("ride", {
          on: support.subject,
          duration: 10,
          seat: seatName,
          hands: { left: "leftGrip", right: "rightGrip" },
          feet,
          ...(kind === "scooter" ? { placeFeet: true } : {}),
        }),
        ...(bicycle ? [leave] : []),
      ]),
    ],
    [support],
  );
}

/** Representative occupied vehicle takes with their native controls. */
export const SCENES_VEHICLES: readonly IScene[] = [
  carRide(),
  scene(
    {
      id: "park-a-cart",
      title: "Park a cart",
      summary:
        "A shopper takes the cart's bar, pushes it along the aisle and lets it come to rest.",
      setting: "ride",
      roles: { pusher: "shopper" },
      needs: [],
    },
    "trolley",
    [
      person("pusher", "m1", 0, -0.75, 0, [
        act("pushPull", {
          prop: "cart",
          way: "push",
          left: "leftHandle",
          right: "rightHandle",
          to: { x: 0, y: 0, z: 0.35 },
        }),
        act("stand", { hold: 0.8 }),
      ]),
    ],
    [object("cart", "createCart", "trolley", 0, 0)],
  ),
  twoWheelRide(
    "city",
    "a-bicycle-ride",
    "A bicycle ride",
    "A cyclist mounts a stopped bicycle, pedals around a bend and dismounts after stopping.",
    { left: "leftPedal", right: "rightPedal" },
  ),
  twoWheelRide(
    "scooter",
    "a-scooter-ride",
    "A scooter ride",
    "A rider takes the grips and floorboard of a scooter, follows a bend and stops.",
    { left: "leftFloorboard", right: "rightFloorboard" },
  ),
  twoWheelRide(
    "motorcycle",
    "a-motorcycle-ride",
    "A motorcycle ride",
    "A rider mounts a motorcycle, takes the footrests and grips, and rides a gentle bend.",
    { left: "leftFootrest", right: "rightFootrest" },
  ),
];
