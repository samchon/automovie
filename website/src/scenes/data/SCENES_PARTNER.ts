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

/** Where the first carpenter's saw lies on the bench and is put back, floor metres. */
const SAW_A: { x: number; z: number } = { x: -1.03, z: 0.42 };

/** Where the second carpenter's hammer lies on the bench and is put back, floor metres. */
const HAMMER_B: { x: number; z: number } = { x: -0.23, z: 0.42 };

/** The residential rise and tread of `createKerb`'s step, in metres. */
const GOODNIGHT_STEP: { height: number; depth: number } = {
  height: 0.196,
  depth: 0.254,
};

/** The partner, riding and work scenes composed from the lexicon of #3392. */
export const SCENES_PARTNER: readonly IScene[] = [
  scene(
    {
      id: "shoulder-greeting",
      title: "Shoulder greeting",
      summary:
        "Two friends wave, shake hands, chat and clasp each other's shoulder.",
      setting: "partner",
      roles: { a: "guest", b: "guest" },
      needs: [],
    },
    "shoulder-greeting",
    [
      person("a", "m1", 0, -4, 0, [
        act(
          "look",
          {
            target: {
              kind: "point",
              frame: "world",
              at: { x: 0, y: 1.7, z: 0.45 },
            },
            seconds: 0.8,
          },
          { anchor: "greet-seen" },
        ),
        act("gesture", { kind: "wave" }, { anchor: "greet-wave" }),
        act("walk", { to: to(0, -0.45), face: 0 }),
        act("handshake", { partner: "b" }, { anchor: "greet-shake" }),
        act("gesture", { kind: "palmsUp" }),
        act("gesture", { kind: "nod" }),
      ]),
      person("b", "m1", 0, 0.45, 180, [
        act("look", { target: at("a", "face"), seconds: 0.6 }),
        act(
          "gesture",
          { kind: "wave", side: "left" },
          { sync: { of: "greet-wave", event: "strokeStart", offset: 0.1 } },
        ),
        act("gesture", { kind: "beckon" }),
        act("handshake", { partner: "a" }, { sync: { of: "greet-shake" } }),
        act("gesture", { kind: "shrug" }),
        act("gesture", { kind: "nod" }),
      ]),
    ],
    [],
    [mutual("shoulderClasp", { one: "a", other: "b" }, { hold: 1 })],
  ),
  scene(
    {
      id: "partner-dance",
      title: "Partner dance",
      summary:
        "A couple spins, she turns under his arm, they walk a promenade and she closes in.",
      setting: "partner",
      roles: { lea: "lead", fol: "follower" },
      needs: [],
      featured: 9,
    },
    "dance",
    [
      person("lea", "m1", 0, 0, 0, [
        act("closedHold", { hold: 0.4 }),
        act("spin"),
        act(
          "gesture",
          {
            kind: "raiseHand",
            side: "left",
            hold: 0.6,
            effort: { time: -0.5 },
          },
          { anchor: "dance-arch" },
        ),
        act("danceLead", { to: to(0, 2.2) }, { anchor: "dance-walk" }),
        act("handOnHeart"),
        act("gesture", { kind: "nod" }),
      ]),
      person("fol", "f1", 0, 0.45, 180, [
        act("closedHold", { hold: 0.4 }),
        act("spin"),
        act(
          "underarmTurn",
          {},
          { sync: { of: "dance-arch", event: "strokeStart" } },
        ),
        act("step", { direction: "left", steps: 1 }),
        act(
          "walk",
          { to: to(-0.5, 2), face: 0 },
          { sync: { of: "dance-walk", event: "start" } },
        ),
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
        "A parent steps up to the door, kisses his grown child's forehead and they wave goodnight.",
      setting: "partner",
      roles: { par: "parent", kid: "grown child" },
      needs: [],
    },
    "goodnight",
    [
      person("par", "m1", 0, -3.4, 0, [
        act("walk", { to: to(0, 0) }),
        act("climbStairs", {
          count: 1,
          riser: GOODNIGHT_STEP.height,
          tread: GOODNIGHT_STEP.depth,
          start: 0.05,
          on: "entryStep",
        }),
        act("foreheadKiss", { partner: "kid" }),
        act(
          "look",
          {
            with: "trunk",
            cue: "seen",
            target: {
              kind: "point",
              frame: "world",
              at: { x: 0.8, y: 1.75, z: 0.54 },
            },
          },
          { anchor: "goodnight-turned" },
        ),
        act("checkWatch"),
        act("look", {
          target: {
            kind: "point",
            frame: "world",
            at: { x: 0, y: 1.6, z: 0.9 },
          },
          seconds: 1,
        }),
        act("gesture", { kind: "wave" }, { anchor: "goodnight-wave" }),
      ]),
      person("kid", "f2", 0, 0.9, 180, [
        act("look", { target: at("par", "face"), cue: "seen", seconds: 1 }),
        act("gesture", { kind: "wave" }),
        act("stand", { seconds: 2.5, sway: 0 }),
        act(
          "flickOff",
          { target: at("par", "shoulderLeft") },
          {
            sync: { of: "goodnight-turned", event: "end" },
          },
        ),
        act(
          "gesture",
          { kind: "wave", side: "left" },
          {
            sync: {
              of: "goodnight-wave",
              event: "strokeStart",
              offset: 0.3,
            },
          },
        ),
      ]),
    ],
    [object("entryStep", "createKerb", "step", 0, 0.31, 0, 0, GOODNIGHT_STEP)],
  ),
  scene(
    {
      id: "carried-off",
      title: "Carried off",
      summary:
        "A guest wilts in the heat, and a firefighter hurries over and carries her off.",
      setting: "partner",
      roles: { fir: "firefighter", gst: "guest" },
      needs: [],
    },
    "carried-off",
    [
      person("fir", "m2", 0, -4.5, 0, [
        act(
          "look",
          {
            target: {
              kind: "point",
              frame: "world",
              at: { x: 0, y: 1.3, z: 0.35 },
            },
            with: "trunk",
            cue: "seen",
          },
          { anchor: "faint-seen" },
        ),
        act("hurry", { to: to(0, 0) }),
        act("comfort", { target: at("gst", "shoulderLeft") }),
        act(
          "walk",
          { to: to(0, -5.5) },
          {
            anchor: "carry",
            over: [act("bearing", { carry: "overShoulder", seconds: 6.5 })],
          },
        ),
      ]),
      person("gst", "f1", 0, 0.35, 180, [
        act("fanSelf"),
        act("gesture", { kind: "touchFace", region: "forehead" }),
        act("wince"),
        act(
          "borne",
          { by: "fir", carry: "overShoulder", seconds: 6.5, lift: 1 },
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
        "Two judoka bow, loosen up and square off, and one throws the other with a shoulder throw.",
      setting: "partner",
      roles: { tor: "tori", uke: "uke" },
      needs: [],

      // The alternate cast cannot maintain the sleeve contact at these marks.
      bodySwap: false,
    },
    "judo",
    [
      person("tor", "m2", 0, -0.27, 8, [
        act("gesture", { kind: "bow", depth: 30 }),
        act("selfAction", { kind: "shoulderRoll" }),
        act("selfAction", { kind: "neckRoll" }),
        act("gesture", { kind: "squareShoulders" }),
        act("stand", { seconds: 1.5, sway: 0 }),
      ]),
      person("uke", "m1", 0.09, 0.27, 188, [
        act("gesture", { kind: "bow", depth: 30 }),
        act("selfAction", { kind: "neckRoll" }),
        act("selfAction", { kind: "shoulderRoll" }),
        act("gesture", { kind: "squareShoulders" }),
        act("stand", { seconds: 1.5, sway: 0 }),
      ]),
    ],
    // The tiles' tops are flush with the exchange's ground support plane.
    [-0.6096, 0, 0.6096].flatMap((x: number, column: number) =>
      [-0.65, 1.22].map((z: number, row: number) => ({
        ...object(
          `mat-${column}-${row}`,
          "createExerciseMat",
          "gym",
          x,
          z,
          0,
          -0.0127,
          {
            length: 1.87,
            width: 0.6096,
          },
        ),
        fixed: true,
      })),
    ),
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
      id: "wrestling-reset",
      title: "Wrestling reset",
      summary:
        "Two wrestlers shake hands and crouch; one shoots a single leg and is stopped.",
      setting: "partner",
      roles: { red: "initiator", blue: "defender" },
      needs: [],

      // The alternate cast cannot reach the staged grip at these marks.
      bodySwap: false,
    },
    "exercise-grapple-singleLeg",
    [
      person("red", "m1", 0, -2, 0, [
        act("bounce", { beats: 7 }),
        act("walk", { to: to(0, -0.21), face: 0 }),
        act("handshake", { partner: "blue" }, { anchor: "wr-shake" }),
        act("crouch", { hold: 0.6 }),
        act("stand", { seconds: 0.3, sway: 0 }),
      ]),
      person("blue", "m2", -0.46, 0.82, 165, [
        act("selfAction", { kind: "shoulderRoll" }),
        act("selfAction", { kind: "neckRoll" }),
        act("handshake", { partner: "red" }, { sync: { of: "wr-shake" } }),
        act("crouch", { hold: 0.6 }),
        act("stand", { seconds: 0.3, sway: 0 }),
      ]),
    ],
    [],
    [
      mutual(
        "grappling",
        { initiator: "red", receiver: "blue" },
        { kind: "singleLeg", outcome: "denied" },
      ),
    ],
  ),
  scene(
    {
      id: "rescue",
      title: "Rescue",
      summary:
        "A hurt woman waves for help; a rescuer hurries over, kneels and carries her off.",
      setting: "partner",
      roles: { res: "rescuer", hur: "the hurt" },
      needs: [],
    },
    "rescue",
    [
      person("res", "m2", 0, -3.5, 0, [
        act(
          "look",
          {
            target: {
              kind: "point",
              frame: "world",
              at: { x: 0, y: 1.2, z: 1.6 },
            },
            with: "trunk",
            cue: "seen",
          },
          { anchor: "rescue-seen" },
        ),
        act("hurry", { to: to(0, 1) }),
        act("kneelBriefly"),
        act(
          "walk",
          { to: to(0, -4.3) },
          {
            anchor: "carry",
            over: [act("bearing", { carry: "overShoulder", seconds: 5.8 })],
          },
        ),
      ]),
      person("hur", "f1", 0, 1.6, 180, [
        act("wince"),
        act("touch", {
          target: { kind: "self", region: "hipRight" },
          kind: "hold",
          hold: 1,
        }),
        act("gesture", { kind: "wave", count: 4 }),
        act("wince"),
        act("touch", {
          target: { kind: "self", region: "hipRight" },
          kind: "hold",
          hold: 0.3,
        }),
        act(
          "borne",
          { by: "res", carry: "overShoulder", seconds: 5.8, lift: 1 },
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
        "A rider mounts a standing horse, looks out, waves, points ahead and cheers.",
      setting: "ride",
      roles: { rid: "rider" },
      needs: [],
      view: "side",
    },
    "ride",
    [
      person("rid", "f1", 0, -0.6, 90, [
        act("sit", { seat: seat("horse") }),
        act(
          "ride",
          { on: "horse", seconds: 10 },
          {
            over: [
              act("look", {
                target: {
                  kind: "point",
                  frame: "world",
                  at: { x: 3, y: 2, z: 3 },
                },
                with: "head",
                seconds: 1.5,
              }),
              act("gesture", { kind: "wave", count: 3 }),
              act("gesture", {
                kind: "point",
                target: {
                  kind: "point",
                  frame: "world",
                  at: { x: 6, y: 1.5, z: -1 },
                },
                hold: 0.8,
              }),
              act("gesture", { kind: "cheer" }),
            ],
          },
        ),
      ]),
    ],
    [object("horse", "createHorse", undefined, 0, 0, 90)],
  ),
  scene(
    {
      id: "into-a-car",
      title: "Into a car",
      summary:
        "A driver and a passenger open the front doors, duck in to sit and nod.",
      setting: "ride",
      roles: { drv: "driver", pas: "passenger" },
      needs: [],
    },
    "into-a-car",
    [
      person("drv", "m1", 1.6, -3.4, 0, [
        act("checkWatch"),
        act("walk", { to: to(1.15, -0.2), face: 270 }),
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
        act("gesture", { kind: "nod" }),
      ]),
      person("pas", "f1", -1.6, -3.4, 0, [
        act("checkPhone", { seconds: 2 }),
        act("walk", { to: to(-1.15, -0.2), face: 90 }),
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
        act("gesture", { kind: "nod" }),
      ]),
    ],
    [object("car", "createCar", "sedan", 0, 0)],
  ),
  scene(
    {
      id: "workshop",
      title: "Workshop",
      summary:
        "Two carpenters hammer and saw at a bench while two porters carry and haul loads.",
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
        act("saw", { prop: "sawA", on: work(-1.05), cycles: 5 }),
        act("putDown", {
          prop: "sawA",
          at: { ...SAW_A, y: SceneBuild.COUNTER_TOP },
        }),
        taken("hammerA", "hammer"),
        act("hammer", { prop: "hammerA", on: work(-1.05) }),
        act("putDown", {
          prop: "hammerA",
          at: { ...HAMMER_A, y: SceneBuild.COUNTER_TOP },
        }),
      ]),
      person("w2", "f1", -0.05, 0.12, 0, [
        taken("hammerB", "hammer"),
        act("useTool", { tool: "hammer", prop: "hammerB", on: work(-0.15) }),
        act("putDown", {
          prop: "hammerB",
          at: { ...HAMMER_B, y: SceneBuild.COUNTER_TOP },
        }),
        act("wipe", { on: work(-0.05), cycles: 4 }),
        act("gesture", { kind: "touchFace", region: "forehead" }),
        taken("hammerB", "hammer"),
        act("useTool", { tool: "hammer", prop: "hammerB", on: work(-0.15) }),
      ]),
      person("w3", "m2", 1.5, -1, 0, [
        act("carryBox", { to: to(1.5, 2) }),
        act("pushCart", { to: to(1.5, -1) }),
        act("haul", { to: to(1.5, 1.2) }),
        act("gesture", { kind: "nod" }),
      ]),
      person("w4", "f2", -2.5, 1, 0, [
        act("carry", { to: to(-2.5, 1.8), how: "twoHands" }),
        act("carryOnHip", { to: to(-2.5, 2.5) }),
        act("toss", { at: at("w3", "sternum") }),
        act("walk", { to: to(-2.5, 1.3) }),
        act("haul", { to: to(-2.5, 2.2) }),
        act("gesture", { kind: "touchFace", region: "forehead" }),
      ]),
    ],
    [
      object("bench", "createTable", "counter", -0.5, 0.65, 180),
      tool("hammerA", "hammer", HAMMER_A.x, HAMMER_A.z),
      tool("sawA", "saw", SAW_A.x, SAW_A.z),
      tool("hammerB", "hammer", HAMMER_B.x, HAMMER_B.z),
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
    },
    "driving-a-screw",
    [
      person("w5", "f1", 0, 0, 0, [
        taken("driver", "screwdriver"),
        act("screw", {
          prop: "driver",
          on: { kind: "prop", subject: "bench", point: "top" },
        }),
      ]),
    ],
    [
      object("bench", "createTable", "workbench", -0.1, 0.52, 180, 0, {
        height: 0.9,
      }),
      { ...tool("driver", "screwdriver", -0.18, 0.4), y: 0.9 },
    ],
  ),
];
