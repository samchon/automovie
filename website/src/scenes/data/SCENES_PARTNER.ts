import type { IScene } from "../structures/IScene";
import { SceneBuild } from "./SceneBuild";

const { act, at, object, person, planned, scene, seat, to } = SceneBuild;

/** The partner, riding and work scenes composed from the lexicon of #3392. */
export const SCENES_PARTNER: readonly IScene[] = [
  scene(
    {
      id: "partner-dance",
      title: "Partner dance",
      summary:
        "A pair in closed hold, an underarm turn and a spin; leading and following each other arrive with the two-body campaign.",
      setting: "partner",
      roles: { lea: "lead", fol: "follower" },
      needs: [3392, 3437],
      featured: 4,
    },
    "dance",
    [
      person("lea", "m1", 0, 0, 0, [act("closedHold"), act("underarmTurn"), act("spin")]),
      person("fol", "f1", 0, 0.45, 180, [act("closedHold"), act("spin"), act("underarmTurn")]),
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
    [person("rid", "f1", 0, -0.6, 90, [act("sit", { seat: seat("horse") }), act("ride", { on: "horse", seconds: 6 })])],
    [object("horse", "createHorse", undefined, 0, 0, 90)],
  ),
  planned(
    {
      id: "into-a-car",
      title: "Into a car",
      summary: "Two people open the car's front doors and get in, ducking under the frame.",
      setting: "ride",
      needs: [3392, 3498, 3520],
    },
    {
      cast: "a driver and a passenger; a sedan",
      pieces:
        "openDoor and getIn of the gait family through the car's door handles and seats; a door pulled through its whole swing carries the handle beyond the arm, so each must step with it (#3520)",
    },
  ),  scene(
    {
      id: "workshop",
      title: "Workshop",
      summary:
        "Four workers: a hammer, a saw and a screwdriver, a box carried across, a cart pushed, a load carried on the hip and tossed over.",
      setting: "work",
      roles: { w1: "carpenter", w2: "carpenter", w3: "carrier", w4: "cleaner" },
      needs: [3392, 3433],
    },
    "workshop",
    [
      person("w1", "m1", -1, 0, 0, [act("hammer", { on: at("w1", "palmLeft") }), act("saw", { on: at("w1", "palmLeft"), cycles: 3 })]),
      person("w2", "f1", 0, 0, 0, [act("screw", { on: at("w2", "palmLeft") }), act("useTool", { tool: "screwdriver", on: at("w2", "palmLeft") })]),
      person("w3", "m2", 1.5, -1, 0, [act("carryBox", { to: to(1.5, 2) }), act("pushCart", { to: to(1.5, -1) })]),
      person("w4", "f2", -2.5, 1, 0, [
        act("carry", { to: to(-2.5, 1.8), how: "twoHands" }), act("carryOnHip", { to: to(-2.5, 2.5) }), act("toss", { at: at("w3", "sternum") })]),
    ],
    [
      object("bench", "createTable", "counter", -0.5, 0.6),
      object("box", "createBox", undefined, 1.5, -0.6),
      object("cart", "createCart", "trolley", 2.3, 0),
      object("broom", "createLongTool", "broom", -2.8, 0.6),
    ],
  ),
];
