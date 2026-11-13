import type { IScene } from "../structures/IScene";
import { SceneBuild } from "./SceneBuild";

const { act, at, object, person, scene, seat, to } = SceneBuild;

/** The partner, riding and work scenes composed from the lexicon of #3392. */
export const SCENES_PARTNER: readonly IScene[] = [
  scene(
    {
      id: "partner-dance",
      title: "Partner dance",
      summary:
        "A pair in closed hold: the lead leads, the follower follows, an underarm turn and a spin.",
      setting: "partner",
      roles: { lea: "lead", fol: "follower" },
      needs: [3392, 3437],
      featured: 4,
    },
    "dance",
    [
      person("lea", "m1", 0, 0, 0, [act("danceHold", { partner: "fol" }), act("danceLead", { partner: "fol" }), act("closedHold"), act("underarmTurn")]),
      person("fol", "f1", 0, 0.45, 180, [act("danceHold", { partner: "lea" }), act("danceFollow", { partner: "lea" }), act("closedHold"), act("spin")]),
    ],
  ),
  scene(
    {
      id: "judo-randori",
      title: "Judo randori",
      summary: "Two judoka grip, break the grip and throw.",
      setting: "partner",
      roles: { tor: "tori", uke: "uke" },
      needs: [3392, 3439],
    },
    "judo",
    [
      person("tor", "m2", 0, 0, 0, [act("judoGrip", { partner: "uke" }), act("judoThrow", { partner: "uke" })]),
      person("uke", "m1", 0, 0.7, 180, [act("judoGrip", { partner: "tor" }), act("judoBroken", { partner: "tor" })]),
    ],
  ),
  scene(
    {
      id: "rescue",
      title: "Rescue",
      summary:
        "One person kneels by another, carries them over the shoulder and walks off; the carried body rides rigidly until two-body contact lands.",
      setting: "partner",
      roles: { res: "rescuer", hur: "the hurt" },
      needs: [3392, 3437, 3440],
    },
    "rescue",
    [
      person("res", "m2", 0, 0, 0, [act("hurry", { to: to(0, 1) }), act("kneelBriefly"), act("bearing", { carry: "overShoulder", seconds: 4 })]),
      person("hur", "f1", 0, 1.6, 180, [act("borne", { by: "res", carry: "overShoulder", seconds: 4 })]),
    ],
  ),
  scene(
    {
      id: "ride-out",
      title: "Ride out",
      summary: "A rider mounts a horse, rides at the walk and rises to the trot, then dismounts.",
      setting: "ride",
      roles: { rid: "rider" },
      needs: [3392, 3494],
      view: "side",
    },
    "ride",
    [person("rid", "f1", -0.8, 0, 90, [act("ride", { on: "horse", seconds: 6 })])],
    [object("horse", "createHorse", undefined, 0, 0, 90)],
  ),
  scene(
    {
      id: "into-a-car",
      title: "Into a car",
      summary: "Two people open the car's doors and get in, ducking under the frame.",
      setting: "ride",
      roles: { dri: "driver", pas: "passenger" },
      needs: [3392, 3498],
    },
    "car",
    [
      person("dri", "m1", -1.4, 0, 90, [act("openDoor", { door: "car", handle: "driverHandle", seconds: 1 }), act("getIn", { seat: seat("car"), through: { door: "car" } })]),
      person("pas", "f1", 1.4, 0.3, 270, [act("openDoor", { door: "car", handle: "passengerHandle", seconds: 1 }), act("getIn", { seat: { $seat: "car", id: "passengerSeat" }, through: { door: "car" } })]),
    ],
    [object("car", "createCar", "sedan", 0, 0)],
  ),
  scene(
    {
      id: "workshop",
      title: "Workshop",
      summary:
        "Four workers: a hammer, a saw and a screwdriver at the bench, a box carried across, a cart pushed, a pot stirred and a broom swept.",
      setting: "work",
      roles: { w1: "carpenter", w2: "carpenter", w3: "carrier", w4: "cleaner" },
      needs: [3392, 3433],
    },
    "workshop",
    [
      person("w1", "m1", -1, 0, 0, [act("hammer", { on: at("w1", "palmLeft") }), act("saw", { on: at("w1", "palmLeft"), cycles: 3 })]),
      person("w2", "f1", 0, 0, 0, [act("screw", { on: at("w2", "palmLeft") }), act("useTool", { tool: "screwdriver", on: at("w2", "palmLeft") })]),
      person("w3", "m2", 1.5, -1, 0, [act("carryBox", { to: to(1.5, 2) }), act("pushCart", { to: to(1.5, -1) })]),
      person("w4", "f2", -2.5, 1, 0, [act("scrub", { on: at("w4", "palmLeft") }),
        act("carry", { to: to(-2.5, 1.8), how: "twoHands" }), act("stir", { on: at("w4", "palmLeft") }), act("haul", { to: to(-2.5, 2.5) })]),
    ],
    [
      object("bench", "createTable", "counter", -0.5, 0.6),
      object("box", "createBox", undefined, 1.5, -0.6),
      object("cart", "createCart", "trolley", 2.3, 0),
      object("broom", "createLongTool", "broom", -2.8, 0.6),
    ],
  ),
];
