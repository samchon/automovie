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

/** The car's boarding marks and road course use a shared, authored film clock. */
function carRide(): IScene {
  const door = [
    { seconds: 0, value: 0 },
    { seconds: 0.6, value: 0 },
    { seconds: 3.15, value: 45 },
    { seconds: 9.7, value: 45 },
    { seconds: 10.4, value: 0 },
  ];
  const car: IPlaygroundComposition.IObject = {
    ...object("car", "createCar", "sedan", 0, 0),
    joints: { driverDoor: door, passengerDoor: door },
    course: {
      ...TWO_WHEELS,
      at: 10.4,
      cruise: 0.6,
      legs: [
        { kind: "straight", length: 1.1 },
        { kind: "turn", radius: 7, angle: 10 },
        { kind: "straight", length: 0.6 },
      ],
    },
  };
  const riders = [
    {
      subject: "drv",
      body: "m1",
      role: "driver",
      side: 1,
      approach: 270,
      enter: 90,
    },
    {
      subject: "pas",
      body: "f1",
      role: "passenger",
      side: -1,
      approach: 90,
      enter: 270,
    },
  ] as const;
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
    riders.map(({ subject, body, role, side, approach, enter }) =>
      person(subject, body, 1.15 * side, -0.2, approach, [
        act("openDoor", {
          door: "car",
          handle: role + "DoorHandle",
          seconds: 3.15,
        }),
        act("walk", { to: to(0.75 * side, -0.2), face: enter }),
        act("getIn", {
          seat: seat("car", role + "Seat"),
          through: { $aperture: "car", id: role + "Aperture" },
        }),
        act("ride", {
          on: "car",
          seconds: 9,
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

/** Board a two-wheeler, pick up its controls and stay supported through a stop. */
function twoWheelRide(
  kind: "city" | "scooter" | "motorcycle",
  id: string,
  title: string,
  summary: string,
  feet: { left: string; right: string },
): IScene {
  const bicycle: boolean = kind === "city";
  const seatName: string = bicycle ? "saddle" : "seat";
  const support: IPlaygroundComposition.IObject = {
    ...object(
      "vehicle",
      bicycle ? "createBicycle" : "createMotorcycle",
      kind,
      0,
      0,
    ),
    course: bicycle ? { ...TWO_WHEELS, at: 5.6 } : TWO_WHEELS,
    // A saddle that lets both casts maintain sole contact at bottom dead center.
    ...(bicycle ? { params: { saddleHeight: 0.62 } } : {}),
  };
  const enter = bicycle
    ? act("bikeTransfer", {
        on: support.subject,
        mode: "mount",
        line: { x: 0, z: -0.6, heading: 0 },
      })
    : act("sit", { seat: seat(support.subject, seatName), seconds: 0.25 });
  const leave = act("bikeTransfer", {
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
          seconds: 10,
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
        act("stand", { seconds: 0.8 }),
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
