import type { IScene } from "../structures/IScene";
import { SceneBuild } from "./SceneBuild";

const { act, at, object, person, planned, scene, seat, to } = SceneBuild;

/** The everyday scenes composed from the lexicon and placed objects of #3392. */
export const SCENES_DAILY: readonly IScene[] = [
  scene(
    {
      id: "cafe",
      title: "Café",
      summary:
        "Two friends sit at a table, sip and whisper; a third arrives, stands by the table and waves them over.",
      setting: "everyday",
      roles: { ana: "friend", ben: "friend", cal: "latecomer" },
      needs: [3392],
      featured: 5,
    },
    "cafe",
    [
      person("ana", "f1", -1.2, 1.5, 90, [
        act("sit", { seat: seat("chairA"), seconds: 1 }),
        act("pickUp", { prop: "mug", handle: "handle" }),
        act("toastSip", { prop: "mug" }),
        act("putDown", { prop: "mug", at: { x: -0.5, y: 0.75, z: 1.5 } }),
        act("whisper", { partner: "ben" }),
        act("handOnHeart"),
      ]),
      person("ben", "m1", 1.2, 1.5, 270, [
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
      object("chairA", "createSeat", "dining", -0.7, 1.5, 90),
      object("chairB", "createSeat", "dining", 0.7, 1.5, 270),
      object("mug", "createDrinkware", "mug", -0.56, 1.5, 0, 0.75),
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
      needs: [3392, 3446],
    },
    "office",
    [
      person("dee", "f2", -1, 0, 0, [
        act("typeText", { keyboard: { at: { x: -1, y: 1.0, z: 0.4 } }, text: "the scene opens" }),
        act("rubEyes"),
        act("thinking", { seconds: 1.5 }),
      ]),
      person("eli", "m1", 1, 0, 0, [
        act("sit", { seat: seat("chairE"), seconds: 0.5 }),
        act("checkWatch"),
        act("shift"),
        act("handToFace", { task: "phone" }),
        act("rise"),
        act("operate", { mechanism: { kind: "button", at: { kind: "prop", subject: "switch", point: "toggle" } } }),
      ]),
    ],
    [
      object("deskD", "createTable", "counter", -1, 0.6),
      object("deskE", "createTable", "desk", 1, 0.6),
      object("chairE", "createSeat", "office", 1, 0),
      object("switch", "createSwitch", "rocker", 1.6, 0.4, 270, 1.2),
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
      needs: [3392],
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
        "Two colleagues outside: one lights up, smokes and taps the ash, the other stands with hands in pockets, arms crossed, thinking.",
      setting: "everyday",
      roles: { gus: "smoker", hal: "colleague" },
      needs: [3392],
    },
    "smoke",
    [
      person("gus", "m2", -0.5, 0, 45, [
        act("lightCigarette"),
        act("smoke"),
        act("smoke"),
        act("scratchNape"),
      ]),
      person("hal", "m1", 0.5, 0.4, 225, [
        act("handsInPockets", { seconds: 2 }),
        act("armsCrossed"),
        act("thinking", { seconds: 2 }),
        act("handsOnHips"),
      ]),
    ],
  ),
  scene(
    {
      id: "tourists",
      title: "Tourists",
      summary:
        "Three tourists stroll, stop for a photograph and a selfie, fan themselves, and wave the others over.",
      setting: "everyday",
      roles: { ivy: "photographer", jay: "tourist", kit: "tourist" },
      needs: [3392],
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
      needs: [3392],
    },
    "picnic",
    [
      person("lea", "f1", -1, 0, 45, [act("sitCrossLegged"), act("toastSip")]),
      person("max", "m1", 1, 0, 315, [act("sitOnFloor"), act("toastSip")]),
      person("nia", "f2", 0, 1.4, 180, [act("kneelSit"), act("sniff")]),
      person("oto", "m2", 0, -1.2, 0, [act("lieStill", { seconds: 4 })]),
    ],
  ),
  scene(
    {
      id: "fright",
      title: "A fright",
      summary:
        "Something goes off: one startles, one winces, one braces for impact, one dives for cover and one stumbles.",
      setting: "everyday",
      roles: { pat: "passer-by", quy: "passer-by", ray: "passer-by", sue: "passer-by" },
      needs: [3392, 3430],
    },
    "fright",
    [
      person("pat", "m1", -1.5, 0, 0, [act("stroll", { to: to(-1.5, 1) }), act("startle"), act("takeCover")]),
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
        "Three people part: a kiss on the cheek, a pat on the shoulder, a fist bump and a blown kiss, and one trudges away.",
      setting: "everyday",
      roles: { tia: "traveller", uli: "friend", val: "friend" },
      needs: [3392],
    },
    "farewell",
    [
      person("tia", "f1", 0.3, 0.15, 0, [
        act("stand", { seconds: 3 }),
        act("receive", { prop: "bag", from: "uli", handle: "handle" }),
        act("putDown", { prop: "bag", at: { x: 0.25, y: 0, z: -0.15 } }),
        act("cheekKiss", { partner: "uli" }),
        act("fistBump", { partner: "val" }),
        act("blownKissSend"),
        act("trudge", { to: to(0, -3) }),
      ]),
      person("uli", "m1", 0, 0.55, 180, [
        act("pickUp", { prop: "bag", handle: "handle" }),
        act("handOver", { prop: "bag", to: "tia", handle: "handle" }),
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
    [
      object("bench", "createSeat", "bench", 0.45, 0.9, 270),
      object("bag", "createBag", "tote", 0.4, 0.9, 270, 0.45),
    ],
  ),
  scene(
    {
      id: "charades",
      title: "Charades",
      summary:
        "Three friends talk with their hands only: thumbs up, okay, I don't know, a facepalm, come here, halt, counting to five.",
      setting: "everyday",
      roles: { wes: "friend", xan: "friend", yui: "friend" },
      needs: [3392],
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
  planned(
    {
      id: "doorway",
      title: "Through a door",
      summary:
        "One person pulls a hinged door open and holds it; two others come through, one waved on.",
      setting: "everyday",
      needs: [3392, 3520],
    },
    {
      cast: "three people; a hinged door",
      pieces:
        "openDoor and passThrough of the gait family, comeHere; a door pulled through its whole swing carries the handle beyond the arm, so the host must step with it (#3520)",
    },
  ),  scene(
    {
      id: "dressing-room",
      title: "Dressing room",
      summary: "Someone bends, kneels, dresses and checks themselves.",
      setting: "everyday",
      roles: { cyd: "actor" },
      needs: [3392],
    },
    "dressing",
    [
      person("cyd", "f2", 0, 0, 0, [
        act("bend", { toward: at("cyd", "kneeLeft") }),
        act("dress", { item: "hat" }),
        act("kneel", { kind: "one", hold: 0.6 }),
        act("rise"),
        act("selfAction", { kind: "shoulderRoll" }),
      ]),
    ],
    [object("bag", "createBag", "tote", 0.6, 0.4)],
  ),
  scene(
    {
      id: "stairs-and-ladder",
      title: "Stairs and ladder",
      summary:
        "One person climbs a flight of stairs; another climbs a leaning ladder; a third steps over a bar and braces.",
      setting: "everyday",
      roles: { dot: "climber", eve: "climber", fin: "walker" },
      needs: [3392, 3436],
    },
    "climb",
    [
      person("dot", "f1", -1.5, 0, 0, [act("climbStairs", { pattern: "stepOverStep", count: 6 })]),
      person("eve", "m1", 0.5, 0, 0, [act("climbLadder", { rungs: 6 })]),
      person("fin", "m2", 2, -1, 0, [
        act("walk", { to: to(2, 0) }),
        act("stepOver"),
        act("brace", { kind: "push", seconds: 1 }),
      ]),
    ],
    [
      object("ladder", "createLadder", "leaning", 0.5, 0.5),
      object("bar", "createBar", "rail", 2, 0.4),
    ],
  ),
];
