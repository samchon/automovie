import type { IScene } from "../structures/IScene";
import { SceneBuild } from "./SceneBuild";

const { act, at, mutual, object, person, scene, seat, to }: typeof SceneBuild =
  SceneBuild;

/**
 * A work point on a bench top, just behind its front edge.
 *
 * @param x Along the bench, metres.
 * @returns The target.
 */
const work = (x: number): Record<string, unknown> => ({
  kind: "point",
  at: { x, y: SceneBuild.COUNTER_TOP, z: 0.4 },
  frame: "world",
});

/**
 * A one-hand tool lying level on the workshop's bench with its working end
 * toward the far side, where a pick-up takes it by its grip: `createTool`
 * stands a tool along +Y from the butt of its handle, so it is turned a
 * quarter turn about +X, its butt at the bench top.
 *
 * @param subject The tool's id.
 * @param kind The tool's kind (`createTool`).
 * @param x The butt's floor point, metres.
 * @param z The butt's floor point, metres.
 * @returns The tool.
 */
const tool = (
  subject: string,
  kind: string,
  x: number,
  z: number,
): ReturnType<typeof object> => ({
  ...object(subject, "createTool", kind, x, z, 0, SceneBuild.COUNTER_TOP),
  rotation: { x: Math.SQRT1_2, y: 0, z: 0, w: Math.SQRT1_2 },
});

/**
 * How a one-hand tool is taken up for its work, as the package's tool cases
 * take it: its `face` the working point, a hammer's line square to the
 * forearm, a saw's and a screwdriver's along it.
 *
 * @param kind The tool's kind.
 * @returns The use.
 */
const use = (kind: string): Record<string, string> => ({
  tip: "face",
  line: kind === "hammer" ? "square" : "forearm",
});

/**
 * Taking up a tool lying on the bench by its grip for its work.
 *
 * @param subject The tool's id.
 * @param kind The tool's kind.
 * @returns The pick-up.
 */
const taken = (subject: string, kind: string): ReturnType<typeof act> =>
  act("pickUp", { prop: subject, handle: "grip", use: use(kind) });

/** Where the first carpenter's hammer lies on the bench and is put back, floor metres. */
const HAMMER_A: { x: number; z: number } = { x: -1.13, z: 0.42 };

/** The partner, riding and work scenes composed from the lexicon of #3392. */
export const SCENES_PARTNER: readonly IScene[] = [
  scene(
    {
      id: "shoulder-greeting",
      title: "A shoulder greeting",
      summary:
        "Two people face each other and rest a hand on each other's shoulder before letting go.",
      setting: "partner",
      roles: { a: "guest", b: "guest" },
      needs: [],
    },
    "shoulder-greeting",
    [
      person("a", "m1", 0, 0, 0, [act("stand", { seconds: 0.3 })]),
      person("b", "m1", 0, 0.45, 180, [act("stand", { seconds: 0.3 })]),
    ],
    [],
    [mutual("shoulderClasp", { one: "a", other: "b" }, { hold: 0.8 })],
  ),
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
          at: 0.2,
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
        "Two judoka enter a staged shoulder throw, land on the mat and settle into the next beat.",
      setting: "partner",
      roles: { tor: "tori", uke: "uke" },
      needs: [],
    },
    "judo",
    [
      person("tor", "m2", 0, -0.25, 0, [act("stand", { seconds: 0.5 })]),
      person("uke", "m1", 0, 0.25, 180, [act("stand", { seconds: 0.5 })]),
    ],
    [],
    [
      mutual(
        "grappling",
        { initiator: "tor", receiver: "uke" },
        { kind: "seoiNage", outcome: "complete", side: "right" },
      ),
    ],
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
        "Two people open the car's front doors, step in beside the seats with their backs to them and get in, ducking under the frame.",
      setting: "ride",
      roles: { drv: "driver", pas: "passenger" },
      needs: [],
      refusedUntil: 3545,
    },
    "into-a-car",
    [
      person("drv", "m1", 1.15, -0.2, 270, [
        act("openDoor", {
          door: "car",
          handle: "driverDoorHandle",
          seconds: 0.9,
        }),
        act("walk", { to: to(0.75, -0.2), face: 90 }),
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
        act("walk", { to: to(-0.75, -0.2), face: 270 }),
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
        "Four workers: at the bench one takes up a hammer and hammers, lays it down and saws, another hammers a nail; a porter carries a mimed box across in both hands and pushes a mimed cart back, and another carries a load in both hands, then on the hip, and tosses something to the porter.",
      setting: "work",
      roles: { w1: "carpenter", w2: "carpenter", w3: "porter", w4: "porter" },
      needs: [],
    },
    "workshop",
    [
      person("w1", "m2", -0.95, 0.12, 0, [
        taken("hammerA", "hammer"),
        act("hammer", { prop: "hammerA", on: work(-1.05) }),
        act("putDown", {
          prop: "hammerA",
          at: { ...HAMMER_A, y: SceneBuild.COUNTER_TOP },
        }),
        taken("sawA", "saw"),
        act("saw", { prop: "sawA", on: work(-1.05), cycles: 3 }),
      ]),
      person("w2", "f1", -0.05, 0.12, 0, [
        taken("hammerB", "hammer"),
        act("useTool", { tool: "hammer", prop: "hammerB", on: work(-0.15) }),
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
      object("bench", "createTable", "counter", -0.5, 0.65, 180),
      tool("hammerA", "hammer", HAMMER_A.x, HAMMER_A.z),
      tool("sawA", "saw", -1.03, 0.42),
      tool("hammerB", "hammer", -0.23, 0.42),
    ],
  ),
  scene(
    {
      id: "driving-a-screw",
      title: "Driving a screw",
      summary:
        "A carpenter takes a screwdriver up from the bench in line with the forearm and drives a screw into the bench top.",
      setting: "work",
      roles: { w5: "carpenter" },
      needs: [],
      refusedUntil: 3543,
    },
    "driving-a-screw",
    [
      person("w5", "f1", 0, 0, 0, [
        taken("driver", "screwdriver"),
        act("screw", { prop: "driver", on: work(-0.1) }),
      ]),
    ],
    [
      object("bench", "createTable", "counter", 0, 0.53, 180),
      tool("driver", "screwdriver", -0.18, 0.3),
    ],
  ),
];
