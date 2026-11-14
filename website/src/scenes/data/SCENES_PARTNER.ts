import type { IScene } from "../structures/IScene";
import { SceneBuild } from "./SceneBuild";

const { act, at, mutual, object, person, scene, seat, to }: typeof SceneBuild =
  SceneBuild;

/**
 * A work point on the workshop's bench top, just behind its front edge.
 *
 * @param x Along the bench, metres.
 * @returns The target.
 */
const work = (x: number): Record<string, unknown> => ({
  kind: "point",
  at: { x, y: SceneBuild.COUNTER_TOP, z: 0.4 },
  frame: "world",
});

/** The partner, riding and work scenes composed from the lexicon of #3392. */
export const SCENES_PARTNER: readonly IScene[] = [
  scene(
    {
      id: "partner-dance",
      title: "Partner dance",
      summary:
        "A pair in closed hold: both spin and she turns under his arm, then a walking promenade: he leads, she follows at his right, closes in and lays her hand on his shoulder.",
      setting: "partner",
      roles: { lea: "lead", fol: "follower" },
      needs: [],
      featured: 9,
    },
    "dance",
    [
      person("lea", "m1", 0, 0, 0, [
        act("closedHold"),
        act("spin"),
        act("stand", { seconds: 2.5 }),
        act("danceLead", { to: to(0, 2) }),
        act("stand", { seconds: 2 }),
      ]),
      person("fol", "f1", 0, 0.45, 180, [
        act("closedHold"),
        act("spin"),
        act("underarmTurn"),
        act("danceFollow", { target: at("lea", "upperArmRight") }),
        act("approach", {
          target: at("lea", "upperArmRight"),
          side: "right",
          at: 0.15,
        }),
        act("danceHold", { target: at("lea", "shoulderRight") }),
      ]),
    ],
  ),
  scene(
    {
      id: "goodnight",
      title: "Goodnight",
      summary:
        "At night a parent kisses a grown child on the forehead, and the child flicks a speck off the parent's shoulder.",
      setting: "partner",
      roles: { par: "parent", kid: "grown child" },
      needs: [],
    },
    "goodnight",
    [
      person("par", "m1", 0, 0, 0, [
        act("foreheadKiss", { partner: "kid" }),
        act("stand", { seconds: 1.5 }),
      ]),
      person("kid", "f2", 0, 0.45, 180, [
        act("stand", { seconds: 1.5 }),
        act("flickOff", { target: at("par", "shoulderLeft") }),
      ]),
    ],
  ),
  scene(
    {
      id: "carried-off",
      title: "Carried off",
      summary:
        "A firefighter lifts a fainted guest over the shoulder and walks out carrying her.",
      setting: "partner",
      roles: { fir: "firefighter", gst: "guest" },
      needs: [],
    },
    "carried-off",
    [
      person("fir", "m2", 0, 0, 0, [
        act(
          "walk",
          { to: to(0, -3) },
          {
            anchor: "carry",
            over: [act("bearing", { carry: "overShoulder", seconds: 4 })],
          },
        ),
      ]),
      person("gst", "f1", 0, 0.35, 180, [
        act(
          "borne",
          { by: "fir", carry: "overShoulder", seconds: 4, lift: 1 },
          { sync: { of: "carry" } },
        ),
      ]),
    ],
  ),
  scene(
    {
      id: "judo-randori",
      title: "Judo randori",
      summary:
        "The first half of a judo throw: tori takes the collar-and-sleeve grip as uke is drawn off balance forward over the toes.",
      setting: "partner",
      roles: { tor: "tori", uke: "uke" },
      needs: [],
    },
    "judo",
    [
      person("tor", "m2", 0, 0, 0, [act("stand", { seconds: 0.5 })]),
      person("uke", "m1", 0, 0.7, 180, [act("stand", { seconds: 0.5 })]),
    ],
    [],
    [mutual("judoThrow", { tori: "tor", uke: "uke" })],
  ),
  scene(
    {
      id: "rescue",
      title: "Rescue",
      summary:
        "One person hurries to another, kneels, and walks off carrying them over the shoulder.",
      setting: "partner",
      roles: { res: "rescuer", hur: "the hurt" },
      needs: [],
    },
    "rescue",
    [
      person("res", "m2", 0, 0, 0, [
        act("hurry", { to: to(0, 1) }),
        act("kneelBriefly"),
        act(
          "walk",
          { to: to(0, -2) },
          {
            anchor: "carry",
            over: [act("bearing", { carry: "overShoulder", seconds: 4 })],
          },
        ),
      ]),
      person("hur", "f1", 0, 1.6, 180, [
        act(
          "borne",
          { by: "res", carry: "overShoulder", seconds: 4, lift: 1 },
          { sync: { of: "carry" } },
        ),
      ]),
    ],
  ),
  scene(
    {
      id: "ride-out",
      title: "Ride out",
      summary:
        "A rider takes the saddle of a standing horse and sits it for six seconds.",
      setting: "ride",
      roles: { rid: "rider" },
      needs: [],
      view: "side",
    },
    "ride",
    [
      person("rid", "f1", 0, -0.6, 90, [
        act("sit", { seat: seat("horse") }),
        act("ride", { on: "horse", seconds: 6 }),
      ]),
    ],
    [object("horse", "createHorse", undefined, 0, 0, 90)],
  ),
  scene(
    {
      id: "into-a-car",
      title: "Into a car",
      summary:
        "Two people open the car's front doors and get in, ducking under the frame.",
      setting: "ride",
      roles: { drv: "driver", pas: "passenger" },
      needs: [],
      refusedUntil: 3520,
    },
    "into-a-car",
    [
      person("drv", "m1", 1.15, -0.2, 270, [
        act("openDoor", {
          door: "car",
          handle: "driverDoorHandle",
          seconds: 0.9,
        }),
        act("getIn", {
          seat: seat("car", "driverSeat"),
          through: { $aperture: "car", id: "driverAperture" },
        }),
      ]),
      person("pas", "f1", -1.15, -0.2, 90, [
        act("openDoor", {
          door: "car",
          handle: "passengerDoorHandle",
          seconds: 0.9,
        }),
        act("getIn", {
          seat: seat("car", "passengerSeat"),
          through: { $aperture: "car", id: "passengerAperture" },
        }),
      ]),
    ],
    [object("car", "createCar", "sedan", 0, 0)],
  ),
  scene(
    {
      id: "workshop",
      title: "Workshop",
      summary:
        "Four workers: at the bench one hammers and saws, another drives a screw and hammers a nail; a porter carries a mimed box across in both hands and pushes a mimed cart back, and another carries a load in both hands, then on the hip, and tosses something to the porter.",
      setting: "work",
      roles: { w1: "carpenter", w2: "carpenter", w3: "porter", w4: "porter" },
      needs: [],
    },
    "workshop",
    [
      person("w1", "m2", -0.95, 0.12, 0, [
        act("hammer", { on: work(-1.05) }),
        act("saw", { on: work(-1.05), cycles: 3 }),
      ]),
      person("w2", "f1", -0.05, 0.12, 0, [
        act("screw", { on: work(-0.15) }),
        act("useTool", { tool: "hammer", on: work(-0.15) }),
      ]),
      person("w3", "m2", 1.5, -1, 0, [
        act("carryBox", { to: to(1.5, 2) }),
        act("pushCart", { to: to(1.5, -1) }),
      ]),
      person("w4", "f2", -2.5, 1, 0, [
        act("carry", { to: to(-2.5, 1.8), how: "twoHands" }),
        act("carryOnHip", { to: to(-2.5, 2.5) }),
        act("toss", { at: at("w3", "sternum") }),
      ]),
    ],
    [object("bench", "createTable", "counter", -0.5, 0.65, 180)],
  ),
];
