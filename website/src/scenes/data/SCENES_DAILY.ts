import type { IScene } from "../structures/IScene";
import { SceneBuild } from "./SceneBuild";

const { act, at, object, person, scene, seat, to }: typeof SceneBuild =
  SceneBuild;

/**
 * The kerb stepped over on the stairs-and-ladder scene: a Euro crate lying
 * across the walker's way, its length along `+X` and its footprint centred
 * on (`x`, `z`). The crate is placed with these dimensions and the step over
 * is given its near side, height and depth from the same numbers, so the law
 * crosses exactly the solid the visitor sees.
 */
const KERB: {
  x: number;
  z: number;
  length: number;
  depth: number;
  height: number;
} = { x: 2, z: 0.38, length: 0.6, depth: 0.4, height: 0.2 };

/** How far a standing person's toes lie ahead of their floor point, metres (an estimate across the site's bodies), from which a climb measures where its stairs or ladder begin. */
const TOE: number = 0.14;

/**
 * The flight climbed on the stairs-and-ladder scene: the stairs are placed
 * with these risers and treads, their first riser `start` ahead of the
 * toes, and the climb is given the same numbers, so the feet land on the
 * treads the visitor sees.
 */
const STAIRS: { count: number; riser: number; tread: number; start: number } = {
  count: 6,
  riser: 0.17,
  tread: 0.28,
  start: 0.05,
};

/**
 * The fixed ladder climbed on the same scene: placed with this rung count
 * and spacing, its rungs `start` ahead of the toes and turned to be climbed
 * facing +Z, and the climb is given the same numbers.
 */
const LADDER: { rungs: number; spacing: number; start: number } = {
  rungs: 6,
  spacing: 0.3,
  start: 0.15,
};

/** The everyday scenes composed from the lexicon and placed objects. */
export const SCENES_DAILY: readonly IScene[] = [
  scene(
    {
      id: "cafe",
      title: "Café",
      summary:
        "Two friends sit down across a table: one lifts a mug to sip and sets it down, then nods; the other checks a phone and sips; a third arrives, stands by the table and waves them over.",
      setting: "everyday",
      roles: { ana: "friend", ben: "friend", cal: "latecomer" },
      needs: [],
      refusedUntil: 3528,
      featured: 5,
    },
    "cafe",
    [
      person("ana", "f1", -0.92, 1.5, 90, [
        act("sit", { seat: seat("chairA"), seconds: 1 }),
        act("pickUp", { prop: "mug", handle: "handle" }),
        act("toastSip", { prop: "mug" }),
        act("putDown", { prop: "mug", at: { x: -0.65, y: 0.75, z: 1.65 } }),
        act("gesture", { kind: "nod" }),
        act("handOnHeart"),
      ]),
      person("ben", "m1", 0.92, 1.5, 270, [
        act("sit", { seat: seat("chairB"), seconds: 1 }),
        act("checkPhone", { seconds: 2 }),
        act("toastSip"),
        act("handOnHeart"),
      ]),
      person("cal", "m2", 3, -1, 0, [
        act("stroll", { to: to(0.6, 2.6) }),
        act("handsClasped"),
        act("comeHere"),
      ]),
    ],
    [
      object("table", "createTable", "dining", 0, 1.5),
      object("chairA", "createSeat", "dining", -1.05, 1.5, 90),
      object("chairB", "createSeat", "dining", 1.05, 1.5, 270),
      object("mug", "createDrinkware", "mug", -0.7, 1.5, 0, 0.75),
    ],
  ),
  scene(
    {
      id: "office",
      title: "Office",
      summary:
        "Two people at work: one types standing at a counter, rubs their eyes and thinks; the other checks a watch at a desk, shifts, takes a call, gets up and switches the light.",
      setting: "everyday",
      roles: { dee: "writer", eli: "colleague" },
      needs: [],
    },
    "office",
    [
      person("dee", "f2", -1, 0, 0, [
        act("typeText", {
          keyboard: { at: { x: -1, y: 1.05, z: 0.4 }, yaw: 0 },
          text: "the scene opens",
        }),
        act("rubEyes"),
        act("thinking", { seconds: 1.5 }),
      ]),
      person("eli", "m2", 1, 0.15, 0, [
        act("sit", { seat: seat("chairE"), seconds: 0.5 }),
        act("checkWatch"),
        act("shift", { by: 0.1 }),
        act("handToFace", { task: "phone" }),
        act("rise"),
        act("approach", {
          target: { kind: "prop", subject: "switch", point: "press" },
          at: 0.15,
        }),
        act("operate", {
          mechanism: {
            kind: "button",
            at: { kind: "prop", subject: "switch", point: "press" },
          },
        }),
      ]),
    ],
    [
      object("deskD", "createTable", "counter", -1, 0.6),
      object("deskE", "createTable", "desk", 1, 0.75),
      object("chairE", "createSeat", "office", 1, -0.15),
      object("switch", "createSwitch", "rocker", 1.6, 0.4, 270),
    ],
  ),
  scene(
    {
      id: "morning-routine",
      title: "Morning routine",
      summary:
        "Someone wakes up: a big stretch, a neck roll, rubbing the eyes, a shave, cream, a look at the watch.",
      setting: "everyday",
      roles: { fay: "early riser" },
      needs: [],
    },
    "morning",
    [
      person("fay", "f1", 0, 0, 0, [
        act("bigStretch"),
        act("neckRoll"),
        act("rubEyes"),
        act("shave"),
        act("applyCream"),
        act("flickHair"),
        act("checkWatch"),
      ]),
    ],
  ),
  scene(
    {
      id: "smoking-break",
      title: "Smoking break",
      summary:
        "Two colleagues outside at a standing counter: one takes up a cigarette, smokes, taps the ash and stubs it out; the other lights up, stands with hands in pockets, arms crossed, thinking.",
      setting: "everyday",
      roles: { gus: "smoker", hal: "colleague" },
      needs: [],
    },
    "smoke",
    [
      person("gus", "m2", 0, 0.12, 0, [
        act("pickUp", { prop: "cig", handle: "grip" }),
        act("smoke", { prop: "cig" }),
        act("ashTap", {
          prop: "cig",
          target: {
            kind: "point",
            at: { x: -0.1, y: 0.91, z: 0.5 },
            frame: "world",
          },
        }),
        act("smoke", { prop: "cig" }),
        act("stubOut", {
          prop: "cig",
          target: {
            kind: "point",
            at: { x: -0.1, y: 0.91, z: 0.5 },
            frame: "world",
          },
        }),
        act("scratchNape", { side: "left" }),
      ]),
      person("hal", "m1", 1.1, 0.6, 270, [
        act("lightCigarette"),
        act("handsInPockets", { seconds: 2 }),
        act("armsCrossed"),
        act("thinking", { seconds: 2 }),
        act("handsOnHips"),
      ]),
    ],
    [
      object("counter", "createTable", "counter", 0, 0.65, 180),
      object("cig", "createSmoking", "cigarette", -0.18, 0.42, 90, 0.91),
    ],
  ),
  scene(
    {
      id: "tourists",
      title: "Tourists",
      summary:
        "Three tourists stroll and stop: one fans herself and waves the others over, one takes a selfie and fans himself, one checks her phone and gives a thumbs up.",
      setting: "everyday",
      roles: { ivy: "photographer", jay: "tourist", kit: "tourist" },
      needs: [],
    },
    "tourists",
    [
      person("ivy", "f2", -1, 0, 0, [
        act("stroll", { to: to(-1, 2) }),
        act("fanSelf"),
        act("comeHere"),
      ]),
      person("jay", "m1", 0, -0.5, 0, [
        act("stroll", { to: to(0, 1.6) }),
        act("selfie"),
        act("fanSelf"),
      ]),
      person("kit", "f1", 1, 0, 0, [
        act("stroll", { to: to(1, 2.2) }),
        act("checkPhone", { seconds: 2 }),
        act("thumbsUp"),
      ]),
    ],
  ),
  scene(
    {
      id: "picnic",
      title: "Picnic",
      summary:
        "Four friends on the grass: one sits cross-legged, one on the floor, one kneels and sits back, one lies still; a toast goes round.",
      setting: "everyday",
      roles: { lea: "friend", max: "friend", nia: "friend", oto: "friend" },
      needs: [],
      refusedUntil: 3528,
    },
    "picnic",
    [
      person("lea", "f1", -1, 0, 45, [act("sitCrossLegged"), act("toastSip")]),
      person("max", "m1", 1, 0, 315, [act("sitOnFloor"), act("toastSip")]),
      person("nia", "f2", 0, 1.4, 180, [act("kneelSit"), act("sniff")]),
      person("oto", "m2", 0, -1.2, 0, [act("lieStill")]),
    ],
  ),
  scene(
    {
      id: "fright",
      title: "A fright",
      summary:
        "Something goes off: a walker startles and takes cover, one winces and braces for impact, one dives for cover, and one stumbles and drops to a knee.",
      setting: "everyday",
      roles: {
        pat: "passer-by",
        quy: "passer-by",
        ray: "passer-by",
        sue: "passer-by",
      },
      needs: [],
    },
    "fright",
    [
      person("pat", "m1", -1.5, 0, 0, [
        act("stroll", { to: to(-1.5, 1) }),
        act("startle"),
        act("takeCover"),
      ]),
      person("quy", "f1", -0.5, 0.5, 0, [act("wince"), act("braceForImpact")]),
      person("ray", "m2", 0.5, 0, 0, [act("diveForCover")]),
      person("sue", "f2", 1.5, 0.5, 0, [act("stumble"), act("kneelBriefly")]),
    ],
  ),
  scene(
    {
      id: "farewell",
      title: "Farewell at the station",
      summary:
        "Three people part: kisses on the cheek and the forehead, a fist bump and a pinky promise, a pat on the shoulder and a hand on the back, a blown kiss, and one trudges away.",
      setting: "everyday",
      roles: { tia: "traveller", uli: "friend", val: "friend" },
      needs: [],
    },
    "farewell",
    [
      person("tia", "f1", 0.3, 0.15, 0, [
        act("cheekKiss", { partner: "uli" }),
        act("fistBump", { partner: "val" }),
        act("pinkyPromise", { partner: "val" }),
        act("blownKiss"),
        act("blownKissSend"),
        act("trudge", { to: to(0, -3) }),
      ]),
      person("uli", "m1", 0, 0.55, 180, [
        act("cheekKiss", { partner: "tia" }),
        act("kiss", { partner: "tia", region: "forehead" }),
        act("shoulderPat", { target: at("val", "shoulderLeft") }),
        act("comfort", { target: at("val", "upperBack") }),
      ]),
      person("val", "f2", 0.5, 0.45, 240, [
        act("fistBump", { partner: "tia" }),
        act("pinkyPromise", { partner: "tia" }),
        act("handOnHeart"),
      ]),
    ],
  ),
  scene(
    {
      id: "left-luggage",
      title: "Left luggage",
      summary:
        "At the left-luggage counter an attendant lifts a tote by its handle and hands it over by the strap to the traveller beside him.",
      setting: "everyday",
      roles: { att: "attendant", trv: "traveller" },
      needs: [],
    },
    "left-luggage",
    [
      person("att", "m2", 0, 0.12, 0, [
        act("pickUp", { prop: "bag", handle: "handle" }),
        act("handOver", { prop: "bag", to: "trv", handle: "strap" }),
      ]),
      person("trv", "m2", -0.65, 0.3, 90, [
        act("stand", { seconds: 1 }),
        act("receive", { prop: "bag", from: "att", handle: "strap" }),
      ]),
    ],
    [
      object("counter", "createTable", "counter", 0, 0.65, 180),
      object("bag", "createBag", "tote", -0.18, 0.42, 90, 0.91),
    ],
  ),
  scene(
    {
      id: "charades",
      title: "Charades",
      summary:
        "Three friends talk with their hands only: thumbs up, counting to three and air quotes; I don't know, a facepalm, okay and a victory sign; come here, halt, hush, a finger snap and hands up.",
      setting: "everyday",
      roles: { wes: "friend", xan: "friend", yui: "friend" },
      needs: [],
    },
    "charades",
    [
      person("wes", "m1", 0, 0, 30, [
        act("thumbsUp"),
        act("countOne"),
        act("countTwo"),
        act("countThree"),
        act("airQuotes"),
      ]),
      person("xan", "f1", 1.1, 0.4, 270, [
        act("dontKnow"),
        act("facepalm"),
        act("okSign"),
        act("victorySign"),
      ]),
      person("yui", "m2", 0.4, 1.1, 200, [
        act("comeHere"),
        act("halt"),
        act("hush"),
        act("fingerSnap"),
        act("handsUp"),
      ]),
    ],
  ),
  scene(
    {
      id: "doorway",
      title: "At a door",
      summary:
        "One person takes a hinged door by its push plate and pushes, the door itself staying shut, then waves over a friend, who walks up.",
      setting: "everyday",
      roles: { ada: "host", bea: "friend" },
      needs: [],
    },
    "doorway",
    [
      person("ada", "f1", 0, 0.7, 0, [
        act("openDoor", { door: "door", handle: "push", seconds: 1.5 }),
        act("comeHere"),
      ]),
      person("bea", "m1", 1.2, -1.5, 0, [
        act("stand", { seconds: 1.5 }),
        act("walk", { to: to(0.8, 0) }),
      ]),
    ],
    [object("door", "createDoor", "hinged", 0, 1)],
  ),
  scene(
    {
      id: "dressing-room",
      title: "Dressing room",
      summary:
        "Someone bends to a bag, puts on a hat, takes a knee and rises, and rolls the shoulders.",
      setting: "everyday",
      roles: { cyd: "actor" },
      needs: [],
    },
    "dressing",
    [
      person("cyd", "f2", 0, 0, 0, [
        act("bend", {
          toward: { kind: "prop", subject: "bag", point: "handle" },
          strategy: "squat",
        }),
        act("dress", { item: "hat" }),
        act("kneel", { kind: "one", hold: 0.6 }),
        act("selfAction", { kind: "shoulderRoll" }),
      ]),
    ],
    [object("bag", "createBag", "tote", -0.15, 0.35)],
  ),
  scene(
    {
      id: "stairs-and-ladder",
      title: "Stairs and ladder",
      summary:
        "One person climbs a flight of six stairs, another climbs six rungs of a fixed ladder, and a third steps over a crate lying in the way and braces.",
      setting: "everyday",
      roles: { dot: "climber", eve: "climber", fin: "walker" },
      needs: [],
    },
    "climb",
    [
      person("dot", "f1", -1.5, 0, 0, [
        act("climbStairs", {
          pattern: "stepOverStep",
          count: STAIRS.count,
          riser: STAIRS.riser,
          tread: STAIRS.tread,
          start: STAIRS.start,
        }),
      ]),
      person("eve", "m1", 0.5, 0, 0, [
        act("climbLadder", {
          rungs: LADDER.rungs,
          spacing: LADDER.spacing,
          start: LADDER.start,
        }),
      ]),
      person("fin", "m2", 2, -1, 0, [
        act("walk", { to: to(2, 0) }),
        act("stepOver", {
          obstacle: {
            at: { x: KERB.x, y: 0, z: KERB.z - KERB.depth / 2 },
            height: KERB.height,
            depth: KERB.depth,
          },
        }),
        act("brace", { kind: "push", seconds: 1 }),
      ]),
    ],
    [
      object(
        "stairs",
        "createStairs",
        undefined,
        -1.5,
        TOE + STAIRS.start,
        0,
        0,
        {
          steps: STAIRS.count,
          riser: STAIRS.riser,
          tread: STAIRS.tread,
        },
      ),
      object(
        "ladder",
        "createLadder",
        "fixed",
        0.5,
        TOE + LADDER.start,
        180,
        0,
        {
          rungs: LADDER.rungs,
          spacing: LADDER.spacing,
        },
      ),
      object("kerb", "createLoad", "crate", KERB.x, KERB.z, 0, 0, {
        length: KERB.length,
        depth: KERB.depth,
        height: KERB.height,
      }),
    ],
  ),
];
