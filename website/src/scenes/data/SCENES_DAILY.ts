import type { IScene } from "../structures/IScene";
import { SceneBuild } from "./SceneBuild";

const { act, at, object, person, scene, seat, to, worn }: typeof SceneBuild =
  SceneBuild;

/** A dining table's top above the floor, metres: the middle of its band. */
const DINING_TOP: number = 0.736;

/** A desk's top above the floor, metres: the middle of its band. */
const DESK_TOP: number = 0.74;

/** The everyday scenes composed from the lexicon and placed objects. */
export const SCENES_DAILY: readonly IScene[] = [
  scene(
    {
      id: "cafe",
      title: "Café",
      summary:
        "Two friends sit down at the ends of a table and each lifts a mug, sips and sets it down; one nods and lays a hand on her heart, the other checks a phone; a third walks round the table, clasps his hands and waves them over.",
      setting: "everyday",
      roles: { ana: "friend", ben: "friend", cal: "latecomer" },
      needs: [],
      refusedUntil: 3528,
      featured: 5,
    },
    "cafe",
    [
      person("ana", "f1", -0.66, 1.5, 90, [
        act("sit", { seat: seat("chairA"), seconds: 1 }),
        act("pickUp", { prop: "mugA", handle: "handle" }),
        act("toastSip", { prop: "mugA" }),
        act("putDown", {
          prop: "mugA",
          at: { x: -0.45, y: DINING_TOP, z: 1.62 },
        }),
        act("gesture", { kind: "nod" }),
        act("handOnHeart"),
      ]),
      person("ben", "m1", 0.66, 1.5, 270, [
        act("sit", { seat: seat("chairB"), seconds: 1 }),
        act("checkPhone", { seconds: 2 }),
        act("pickUp", { prop: "mugB", handle: "handle" }),
        act("toastSip", { prop: "mugB" }),
        act("putDown", {
          prop: "mugB",
          at: { x: 0.45, y: DINING_TOP, z: 1.38 },
        }),
      ]),
      person("cal", "m2", 3, -1, 0, [
        act("stroll", { to: to(0.6, 2.6), via: [to(2.2, 2.6)] }),
        act("handsClasped"),
        act("comeHere"),
      ]),
    ],
    [
      object("table", "createTable", "dining", 0, 1.5),
      object("chairA", "createSeat", "dining", -0.9, 1.5, 90),
      object("chairB", "createSeat", "dining", 0.9, 1.5, 270),
      object("mugA", "createDrinkware", "mug", -0.45, 1.5, 180, DINING_TOP),
      object("mugB", "createDrinkware", "mug", 0.45, 1.5, 0, DINING_TOP),
    ],
  ),
  scene(
    {
      id: "office",
      title: "Office",
      summary:
        "Two people at work: one types seated at a desk, rubs their eyes and thinks; the other checks a watch at a desk, shifts, takes a call, gets up, walks to the wall and switches the light.",
      setting: "everyday",
      roles: { dee: "writer", eli: "colleague" },
      needs: [],
    },
    "office",
    [
      person("dee", "f2", -1.2, 0.3, 0, [
        act("sit", { seat: seat("chairD"), seconds: 0.5 }),
        act("typeText", {
          keyboard: { at: { x: -1.2, y: DESK_TOP + 0.02, z: 0.47 }, yaw: 0 },
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
      object("deskD", "createTable", "desk", -1.2, 0.8),
      object("chairD", "createSeat", "office", -1.2, 0.08),
      object("deskE", "createTable", "desk", 1, 0.75),
      object("chairE", "createSeat", "office", 1, -0.15),
      object("switch", "createSwitch", "rocker", 2.2, 0, 270),
    ],
  ),
  scene(
    {
      id: "morning-routine",
      title: "Morning routine",
      summary:
        "Someone wakes up: a big stretch, a neck roll, rubbing the eyes, a shave, cream, a flick of the hair and a look at the watch.",
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
        "Two colleagues outside at a standing counter: one takes up a cigarette, smokes, taps the ash, smokes again, stubs it out and scratches the nape with the free hand; the other lights up, stands with hands in pockets, arms crossed, thinking, then hands on hips.",
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
            at: { x: -0.1, y: SceneBuild.COUNTER_TOP, z: 0.5 },
            frame: "world",
          },
        }),
        act("smoke", { prop: "cig" }),
        act("stubOut", {
          prop: "cig",
          target: {
            kind: "point",
            at: { x: -0.1, y: SceneBuild.COUNTER_TOP, z: 0.5 },
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
      object(
        "cig",
        "createSmoking",
        "cigarette",
        -0.18,
        0.42,
        90,
        SceneBuild.COUNTER_TOP,
      ),
    ],
  ),
  scene(
    {
      id: "tourists",
      title: "Tourists",
      summary:
        "Three tourists stroll and stop: one fans herself, raises the camera hanging at her chest and takes a photograph, then waves the others over; one takes a selfie and fans himself; one checks her phone and gives a thumbs up.",
      setting: "everyday",
      roles: { ivy: "photographer", jay: "tourist", kit: "tourist" },
      needs: [],
    },
    "tourists",
    [
      person("ivy", "f2", -1, 0, 0, [
        act("stroll", { to: to(-1, 2) }),
        act("fanSelf"),
        act("pickUp", {
          prop: "camera",
          handle: "grip",
          use: { tip: "screen", line: "across", at: { region: "noseBridge" } },
        }),
        act("photograph", { prop: "camera" }),
        act("comeHere", { side: "left" }),
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
    [
      worn("camera", "createDevice", "camera", "ivy", "chest", {
        x: 0,
        y: 0,
        z: 0.14,
      }),
    ],
  ),
  scene(
    {
      id: "picnic",
      title: "Picnic",
      summary:
        "Four friends on the grass: two sit, cross-legged and on the floor, and raise a mimed cup to drink; one kneels, sits back and nods; one lies still.",
      setting: "everyday",
      roles: { lea: "friend", max: "friend", nia: "friend", oto: "friend" },
      needs: [],
      refusedUntil: 3528,
    },
    "picnic",
    [
      person("lea", "f1", -1, 0, 45, [act("sitCrossLegged"), act("toastSip")]),
      person("max", "m1", 1, 0, 315, [act("sitOnFloor"), act("toastSip")]),
      person("nia", "f2", 0, 1.4, 180, [
        act("kneelSit"),
        act("gesture", { kind: "nod" }),
      ]),
      person("oto", "m2", 0, -1.2, 0, [act("lieStill")]),
    ],
  ),
  scene(
    {
      id: "fright",
      title: "A fright",
      summary:
        "Something goes off, and four passers-by react at once: one startles and takes cover, one winces and braces for impact, one dives for cover, and one stumbles and drops to a knee.",
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
      person("pat", "m1", -1.5, 0, 0, [act("startle"), act("takeCover")]),
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
        "Three people part: kisses on the cheek and the forehead, a fist bump and a pinky promise, a pat on one shoulder and a comforting hand on the other, a hand on the heart, a blown kiss, and one trudges away.",
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
        act("comfort", { target: at("val", "shoulderRight") }),
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
];
