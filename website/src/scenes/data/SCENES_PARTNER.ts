import type { IScene } from "../structures/IScene";
import { SceneBuild } from "./SceneBuild";

const {
  act,
  at,
  mutual,
  object,
  person,
  planned,
  scene,
  seat,
  to,
}: typeof SceneBuild = SceneBuild;

/** The partner, riding and work scenes composed from the lexicon of #3392. */
export const SCENES_PARTNER: readonly IScene[] = [
  scene(
    {
      id: "partner-dance",
      title: "Partner dance",
      summary:
        "A pair in closed hold, an underarm turn and a spin, then a walking promenade: he leads, she follows at his right and lays her hand on his shoulder; a hold kept while walking arrives with the two-body campaign.",
      setting: "partner",
      roles: { lea: "lead", fol: "follower" },
      needs: [3437],
      featured: 9,
    },
    "dance",
    [
      person("lea", "m1", 0, 0, 0, [
        act("closedHold"),
        act("underarmTurn"),
        act("spin"),
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
        "At the door a parent kisses a grown child on the forehead, and the child flicks a speck off the parent's shoulder.",
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
        "A firefighter carries a fainted guest out over the shoulder, the guest's body going with the carrier's chest.",
      setting: "partner",
      roles: { fir: "firefighter", gst: "guest" },
      needs: [3437, 3440],
    },
    "carried-off",
    [
      person("fir", "m2", 0, 0, 0, [
        act("bearing", { carry: "overShoulder", seconds: 4 }),
      ]),
      person("gst", "f1", 0, 0.35, 180, [
        act("carried", { by: "fir", on: "chest", seconds: 4 }),
      ]),
    ],
  ),
  scene(
    {
      id: "judo-randori",
      title: "Judo randori",
      summary:
        "The first half of a judo throw: tori takes the collar-and-sleeve grip as uke is drawn off balance forward; the turn in, the lift over the hip and the fall wait on force exchange.",
      setting: "partner",
      roles: { tor: "tori", uke: "uke" },
      needs: [3439],
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
        "One person kneels by another, carries them over the shoulder and walks off; the carried body rides rigidly until two-body contact lands.",
      setting: "partner",
      roles: { res: "rescuer", hur: "the hurt" },
      needs: [3437, 3440],
    },
    "rescue",
    [
      person("res", "m2", 0, 0, 0, [
        act("hurry", { to: to(0, 1) }),
        act("kneelBriefly"),
        act("bearing", { carry: "overShoulder", seconds: 4 }),
      ]),
      person("hur", "f1", 0, 1.6, 180, [
        act("borne", { by: "res", carry: "overShoulder", seconds: 4 }),
      ]),
    ],
  ),
  scene(
    {
      id: "ride-out",
      title: "Ride out",
      summary:
        "A rider mounts a horse, rides at the walk and rises to the trot, then dismounts.",
      setting: "ride",
      roles: { rid: "rider" },
      needs: [3494],
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
  planned(
    {
      id: "into-a-car",
      title: "Into a car",
      summary:
        "Two people open the car's front doors and get in, ducking under the frame.",
      setting: "ride",
      needs: [3498, 3520],
    },
    {
      cast: "a driver and a passenger; a sedan",
      pieces:
        "openDoor and getIn of the gait family through the car's door handles, openings and seats; a car door pulled through its swing carries the handle beyond the arm (1.37 of its length at the nearest stand), so each must step with it (#3520)",
    },
  ),
  scene(
    {
      id: "workshop",
      title: "Workshop",
      summary:
        "Four workers: a hammer, a saw and a screwdriver, a box carried across, a cart pushed, a load carried on the hip and tossed over.",
      setting: "work",
      roles: { w1: "carpenter", w2: "carpenter", w3: "carrier", w4: "cleaner" },
      needs: [3433],
    },
    "workshop",
    [
      person("w1", "m1", -1, 0, 0, [
        act("hammer", { on: at("w1", "palmLeft") }),
        act("saw", { on: at("w1", "palmLeft"), cycles: 3 }),
      ]),
      person("w2", "f1", 0, 0, 0, [
        act("screw", { on: at("w2", "palmLeft") }),
        act("useTool", { tool: "screwdriver", on: at("w2", "palmLeft") }),
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
    [
      object("bench", "createTable", "counter", -0.5, 0.6),
      object("box", "createBox", undefined, 1.5, -0.6),
      object("cart", "createCart", "trolley", 2.3, 0),
      object("broom", "createLongTool", "broom", -2.8, 0.6),
    ],
  ),
];
