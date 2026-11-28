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
      id: "balance-rehearsal",
      title: "Balance rehearsal",
      summary:
        "A performer braces for a jolt and stumbles back twice, then nods and steps clear.",
      setting: "everyday",
      roles: { passenger: "passenger" },
      needs: [],
    },
    "balance-rehearsal",
    [
      person("passenger", "m1", 0, 0, 0, [
        act("braceImpact"),
        act("stumble"),
        act("gesture", { kind: "shakeHead" }),
        act("step", { direction: "forward", steps: 1 }),
        act("braceImpact"),
        act("stumble"),
        act("gesture", { kind: "nod" }),
        act("standClear", { to: to(1, 0) }),
      ]),
    ],
  ),
  scene(
    {
      id: "rehearsing-reactions",
      title: "Rehearsing reactions",
      summary:
        "One actor crosses and nods while the other rehearses tears; he applauds and she bows.",
      setting: "everyday",
      roles: { walker: "actor", partner: "actor" },
      needs: [],
    },
    "rehearsing-reactions",
    [
      person("walker", "m1", -0.75, 0, 0, [
        act("stand", { hold: 0.3 }),
        act(
          "walk",
          { to: to(-0.75, 2) },
          { over: [act("headTilt", { degrees: 20 })] },
        ),
        act("look", { target: at("partner", "face"), cue: "signal" }),
        act("gesture", { kind: "nod" }),
        act(
          "walk",
          { to: to(-0.75, 0) },
          { over: [act("headTilt", { degrees: 20 })] },
        ),
        act("look", {
          target: at("partner", "face"),
          cue: "signal",
          duration: 1.4,
        }),
        act("gesture", { kind: "clap" }),
        act("thumbsUp"),
      ]),
      person("partner", "f1", 0.75, 1, 0, [
        act("coverFace", { hold: 0.8 }),
        act("wipeTears", { hand: "right" }),
        act("look", { target: at("walker", "face") }),
        act("facepalm"),
        act("coverFace", { hold: 0.8 }),
        act("wipeTears", { hand: "left" }),
        act("gesture", { kind: "bow" }),
      ]),
    ],
  ),
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
        act("sit", { seat: seat("chairA"), hold: 1 }),
        act("pickUp", { prop: "mugA", handle: "handle" }),
        act("toastSip", { prop: "mugA" }),
        act("putDown", {
          prop: "mugA",
          to: { x: -0.45, y: DINING_TOP, z: 1.62 },
        }),
        act("gesture", { kind: "nod" }),
        act("handOnHeart"),
      ]),
      person("ben", "m1", 0.66, 1.5, 270, [
        act("sit", { seat: seat("chairB"), hold: 1 }),
        act("checkPhone", { hold: 2 }),
        act("pickUp", { prop: "mugB", handle: "handle" }),
        act("toastSip", { prop: "mugB" }),
        act("putDown", {
          prop: "mugB",
          to: { x: 0.45, y: DINING_TOP, z: 1.38 },
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
      practicalLights: [
        {
          prop: "lamp",
          emitter: "light",
          on: { subject: "eli", action: "operate", event: "stroke" },
          color: 0xffdf9d,
          intensity: 8,
        },
      ],
    },
    "office",
    [
      person("dee", "f2", -1.2, 0.3, 0, [
        act("sit", { seat: seat("chairD"), hold: 0.5 }),
        act("typeText", { keyboard: "keyboard", text: "the scene opens" }),
        act("rubEyes"),
        act("thinking", { hold: 1.5 }),
      ]),
      person("eli", "m2", 1, 0.15, 0, [
        act("sit", { seat: seat("chairE"), hold: 0.5 }),
        act("checkWatch"),
        act("shift", { by: 0.1 }),
        act("handToFace", { kind: "phone" }),
        act("rise"),
        act("approach", {
          target: { kind: "prop", subject: "switch", point: "press" },
          at: 0.15,
        }),
        act("operate", {
          kind: {
            kind: "button",
            at: { kind: "prop", subject: "switch", point: "press" },
            travel: 0.003,
          },
        }),
      ]),
    ],
    [
      // Deep enough that its front edge, at z 0.4, lies under the keyboard
      // where the seated typist reaches it.
      object("deskD", "createTable", "desk", -1.2, 0.75, 0, 0, { depth: 0.7 }),
      object("chairD", "createSeat", "office", -1.2, 0.08),
      // Turned half round, so its typist's +Z side faces the chair.
      object(
        "keyboard",
        "createDesktopKeyboard",
        undefined,
        -1.2,
        0.48,
        180,
        DESK_TOP,
      ),
      object("deskE", "createTable", "desk", 1, 0.75),
      object("chairE", "createSeat", "office", 1, -0.15),
      object("switch", "createSwitch", "rocker", 2.2, 0, 270),
      object("lamp", "createLight", "tableLamp", -1.45, 0.92, 0, DESK_TOP),
    ],
  ),
  scene(
    {
      id: "morning-routine",
      title: "Morning routine",
      summary:
        "Someone wakes up: a big stretch, rubbing the eyes, a shave and a look at the watch.",
      setting: "everyday",
      roles: { fay: "early riser" },
      needs: [],
    },
    "morning",
    [
      person("fay", "f1", 0, 0, 0, [
        act("bigStretch"),
        act("rubEyes"),
        act("shave"),
        act("checkWatch"),
      ]),
    ],
  ),
  scene(
    {
      id: "smoking-break",
      title: "Smoking break",
      summary:
        "Two colleagues smoke at a counter; one stubs out, the other talks and checks his watch.",
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
        act("scratchNape", { hand: "left" }),
      ]),
      person("hal", "m1", 1.1, 0.6, 270, [
        act("lightCigarette"),
        act("handsInPockets", { hold: 0.9 }),
        act("look", { target: at("gus", "face") }),
        act("gesture", { kind: "palmsUp" }),
        act("armsCrossed", { hold: 1.1 }),
        act("gesture", { kind: "nod" }),
        act("thinking", { hold: 1.1 }),
        act("gesture", { kind: "shrug" }),
        act("checkWatch"),
      ]),
    ],
    [
      object("counter", "createTable", "counter", 0, 0.65, 180),
      object(
        "cig",
        "createCigarette",
        undefined,
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
        act("comeHere", { hand: "left" }),
      ]),
      person("jay", "m1", 0, -0.5, 0, [
        act("stroll", { to: to(0, 1.6) }),
        act("selfie"),
        act("fanSelf"),
      ]),
      person("kit", "f1", 1, 0, 0, [
        act("stroll", { to: to(1, 2.2) }),
        act("checkPhone", { hold: 2 }),
        act("thumbsUp"),
      ]),
    ],
    [
      worn("camera", "createCamera", undefined, "ivy", "chest", {
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
        "A bang startles four passers-by: one takes cover, one braces, one dives flat, one kneels.",
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
      person("pat", "m2", -1.5, 0, 0, [
        act("walk", { to: to(-1.5, 1.5) }),
        act("stand", { hold: 1.5 }),
        act("startle", {}, { anchor: "fr-bang" }),
        act("takeCover"),
        act("look", { target: at("ray", "face"), cue: "seen" }),
        act("handOnHeart"),
        act("dontKnow"),
        act("walk", { to: to(-1.5, 2.8) }),
      ]),
      person("quy", "f1", -0.5, 0.5, 0, [
        act("checkPhone", { hold: 1 }),
        act("stand", { hold: 0.6 }),
        act(
          "wince",
          {},
          { sync: { of: "fr-bang", event: "start", offset: 0.1 } },
        ),
        act("braceForImpact"),
        act("look", { target: at("ray", "face"), cue: "seen", duration: 1.2 }),
        act("coverMouth"),
        act("gesture", { kind: "shakeHead" }),
        act("walk", { to: to(-0.5, 3) }),
      ]),
      person("ray", "m1", 0.5, 0, 0, [
        act("checkWatch"),
        act("stand", { hold: 3 }),
        act(
          "lieDown",
          { kind: "prone", hold: 1 },
          { sync: { of: "fr-bang", event: "start", offset: 0.15 } },
        ),
        act("getUp"),
        act("gesture", { kind: "shrug" }),
        act("walk", { to: to(0.5, 2) }),
      ]),
      person("sue", "f2", 1.5, 0.5, 0, [
        act("walk", { to: to(1.5, 1.8) }),
        act("stand", { hold: 3 }),
        act(
          "stumble",
          {},
          { sync: { of: "fr-bang", event: "start", offset: 0.1 } },
        ),
        act("kneelBriefly"),
        act("look", { target: at("ray", "face"), cue: "seen", duration: 1.2 }),
        act("walk", { to: to(1.5, 3.5) }),
      ]),
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
      person("tia", "f1", 0, 0, 0, [
        act("cheekKiss", { partner: "val", side: "left" }),

        // Show the cheek, then lower the gaze while Val kisses the forehead.
        // The planted stance holds each offered surface still.
        act(
          "stand",
          { hold: 3.7, sway: 0 },
          {
            over: [
              act(
                "headTilt",
                { degrees: -20, duration: 3.6 },
                { anchor: "farewell-cheek" },
              ),
            ],
          },
        ),
        act(
          "stand",
          { hold: 3.7, sway: 0 },
          {
            over: [
              act(
                "look",
                {
                  target: {
                    kind: "point",
                    frame: "world",
                    at: { x: 0, y: 1.25, z: 0.65 },
                  },
                  recruit: "head",
                  duration: 3.4,
                },
                { anchor: "farewell-forehead" },
              ),
            ],
          },
        ),

        // Make room for both forearms before the two separate hand meetings.
        act("walk", {
          to: to(0, -0.61),
          face: 0,
          facing: { yaw: 0 },
          pace: "slow",
          armSwing: 0,
        }),
        act("stand", { hold: 0.5, sway: 0 }, { anchor: "farewell-apart" }),
        act("fistBump", { partner: "val", window: { from: 14, to: 14.1 } }),
        act("pinkyPromise", {
          partner: "val",
          window: { from: 16.1, to: 16.2 },
        }),
        act("blownKiss"),
        act("blownKissSend"),
        act("trudge", { to: to(0, -3) }),
      ]),
      person("uli", "m1", 0.02, 1.08, 180, [
        act("stand", { hold: 18.9, sway: 0 }),
        // Val's right hand crosses the left shoulder area on its way down.
        // Approach after it clears, on the upper part of the same shoulder.
        act(
          "shoulderPat",
          {
            hand: "left",
            target: at("val", "shoulderLeft"),
            site: { up: 0.015, out: -0.02 },
          },
          { sync: { of: "farewell-heart", event: "end", offset: 0.1 } },
        ),
        act("comfort", { hand: "right", target: at("val", "shoulderRight") }),
      ]),
      person("val", "f2", 0, 0.6, 175, [
        act(
          "cheekKiss",
          { partner: "tia", side: "left", hold: 0.32 },
          { sync: { of: "farewell-cheek", event: "stroke" } },
        ),
        act(
          "foreheadKiss",
          { partner: "tia", hold: 0.32 },
          { sync: { of: "farewell-forehead", event: "settled", offset: 0.55 } },
        ),
        // Read Tia's new position after her step back has settled.
        act(
          "fistBump",
          { partner: "tia", window: { from: 14, to: 14.1 } },
          { sync: { of: "farewell-apart", event: "end" } },
        ),
        act("pinkyPromise", {
          partner: "tia",
          window: { from: 16.1, to: 16.2 },
        }),
        act("handOnHeart", {}, { anchor: "farewell-heart" }),
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
