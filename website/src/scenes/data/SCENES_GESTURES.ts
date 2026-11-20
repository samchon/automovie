import type { IScene } from "../structures/IScene";
import { SceneBuild } from "./SceneBuild";

const { act, at, mutual, object, person, scene, seat, to }: typeof SceneBuild =
  SceneBuild;

/** The everyday scenes of the lexicon's emblems, habits and resting poses, and of its social mutual actions: hands that talk, care for the face, a photograph, sitting low without a seat, games of the hands and toasts. */
export const SCENES_GESTURES: readonly IScene[] = [
  scene(
    {
      id: "talking-hands",
      title: "Talking hands",
      summary:
        "Three friends across a noisy room talk with their hands: one pleads with palms together and crossed fingers, the next answers thumbs down and counts four and five, the third shakes a fist and covers ears and mouth; a blown kiss is sent, a facepalm and a shrug come back, a raised hand and a thumbs up, a hush and a halt, an okay, a victory sign and a wave to come over.",
      setting: "everyday",
      roles: { amy: "friend", bob: "friend", cat: "friend" },
      needs: [],
    },
    "talking-hands",
    [
      person("amy", "f1", 0, 0, 30, [
        act("palmsTogether"),
        act("crossedFingers"),
        act("blownKiss"),
        act("blownKissSend"),
        act("gesture", { kind: "raiseHand" }),
        act("thumbsUp"),
        act("okSign"),
        act("comeHere"),
      ]),
      person("bob", "m1", 1.2, 0.4, 270, [
        act("thumbsDown"),
        act("countFour"),
        act("countFive"),
        act("facepalm"),
        act("dontKnow"),
        act("okSign"),
        act("victorySign"),
      ]),
      person("cat", "m2", 0.4, 1.2, 200, [
        act("shakeFist"),
        act("coverEars"),
        act("coverMouth"),
        act("hush"),
        act("halt"),
      ]),
    ],
  ),
  scene(
    {
      id: "powder-room",
      title: "Powder room",
      summary:
        "Two guests freshen up side by side: one draws lipstick across the lips and presses them, glances over at the other and shakes her head, smooths cream into her face and checks the time; the other blows his nose, rubs his eyes and scratches his nape, glances back and shrugs, and fans himself.",
      setting: "everyday",
      roles: { dot: "guest", eli: "guest" },
      needs: [],
    },
    "powder-room",
    [
      person("dot", "f2", -0.5, 0, 0, [
        act("applyLipstick"),
        act("gesture", { kind: "touchFace" }),
        act("look", { target: at("eli", "face"), cue: "seen" }),
        act("gesture", { kind: "shakeHead" }),
        act("applyCream"),
        act("checkWatch"),
      ]),
      person("eli", "m1", 0.5, 0, 0, [
        act("blowNose"),
        act("rubEyes"),
        act("scratchNape", { side: "left" }),
        act("look", { target: at("dot", "face"), cue: "seen" }),
        act("gesture", { kind: "shrug" }),
        act("fanSelf"),
      ]),
    ],
  ),
  scene(
    {
      id: "snapshot",
      title: "Snapshot",
      summary:
        "A tourist takes a camera off a kiosk counter and photographs a friend, who poses with crossed fingers as the shutter goes; he shakes his head at the shot and she shrugs, he shoots again as she holds up a victory sign and then a thumbs up, and he waves her over and she walks up to see the picture.",
      setting: "everyday",
      roles: { fay: "photographer", gil: "subject" },
      needs: [],
    },
    "snapshot",
    [
      person("fay", "m2", 0, 0.12, 0, [
        act("pickUp", {
          prop: "camera",
          handle: "grip",
          use: { tip: "screen", line: "across", at: { region: "noseBridge" } },
        }),
        act("photograph", { prop: "camera" }, { anchor: "sn-shot1" }),
        act("gesture", { kind: "shakeHead" }, { anchor: "sn-no" }),
        act("photograph", { prop: "camera" }, { anchor: "sn-shot2" }),
        act("comeHere", { side: "left" }, { anchor: "sn-come" }),
        act("look", { target: at("gil", "face"), seconds: 1 }),
      ]),
      person("gil", "f1", 0, 2.5, 180, [
        act("stand", { seconds: 3 }),
        act(
          "crossedFingers",
          {},
          { sync: { of: "sn-shot1", event: "stroke", align: "strokeEnd" } },
        ),
        act("stand", { seconds: 3 }),
        act(
          "gesture",
          { kind: "shrug" },
          { sync: { of: "sn-no", event: "start", offset: 0.3 } },
        ),
        act("stand", { seconds: 3 }),
        act(
          "victorySign",
          {},
          { sync: { of: "sn-shot2", event: "stroke", align: "strokeEnd" } },
        ),
        act("thumbsUp"),
        act("stand", { seconds: 3 }),
        act(
          "walk",
          { to: to(0.2, 1.8) },
          { sync: { of: "sn-come", event: "strokeStart" } },
        ),
        act("look", { target: at("fay", "face"), seconds: 0.6 }),
      ]),
    ],
    [
      object("counter", "createTable", "counter", 0, 0.65, 180),
      object("camera", "createDevice", "camera", -0.18, 0.42, 0, 0.914),
    ],
  ),
  scene(
    {
      id: "park-rest",
      title: "Resting in the park",
      summary:
        "Three walkers come onto the grass: one takes a knee for a moment, gets up, rolls his neck and nods to the second, who fans herself, nods back and sits down with her legs folded to the side to stay a while; the third squats low on his heels, rises, wipes his brow and checks his watch, and the two men walk on.",
      setting: "everyday",
      roles: { hal: "walker", ida: "walker", jon: "walker" },
      needs: [],
    },
    "park-rest",
    [
      person("hal", "m1", -1.2, -2, 0, [
        act("walk", { to: to(-1.2, 0) }),
        act("kneel", { kind: "one", hold: 2, rise: true }),
        act("neckRoll", { count: 1 }),
        act("look", { target: at("ida", "face"), cue: "seen" }),
        act("gesture", { kind: "nod" }),
        act("walk", { to: to(-1.2, 2) }),
      ]),
      person("ida", "f1", 0, 2.6, 180, [
        act("walk", { to: to(0, 0.6) }),
        act("fanSelf"),
        act("look", { target: at("hal", "face"), cue: "seen" }),
        act("gesture", { kind: "nod" }),
        act("sitSideways"),
      ]),
      person("jon", "m2", 2.8, -1.7, 330, [
        act("walk", { to: to(1.8, 0) }),
        act("crouch", { depth: "full", heels: "up", hold: 2 }),
        act("gesture", { kind: "touchFace" }),
        act("checkWatch"),
        act("walk", { to: to(1.8, 2) }),
      ]),
    ],
  ),
  scene(
    {
      id: "schoolyard-games",
      title: "Schoolyard games",
      summary:
        "Two pairs at break, one game after the other: first one pair plays rock, paper, scissors on a shared count, then the other clasps hands for a thumb war.",
      setting: "everyday",
      roles: { kas: "player", lin: "player", mia: "player", ned: "player" },
      needs: [],
      refusedUntil: 3552,
    },
    "schoolyard-games",
    [
      person("kas", "f1", -1, 0, 0, [act("stand", { seconds: 0.5 })]),
      person("lin", "m1", -1, 0.8, 180, [act("stand", { seconds: 0.5 })]),
      person("mia", "f2", 1, 0, 0, [act("stand", { seconds: 0.5 })]),
      person("ned", "m2", 1, 0.95, 180, [act("stand", { seconds: 0.5 })]),
    ],
    [],
    [
      mutual("rockPaperScissors", { one: "kas", other: "lin" }),
      mutual("thumbWrestle", { one: "mia", other: "ned" }),
    ],
  ),
  scene(
    {
      id: "toasts",
      title: "Toasts",
      summary:
        "Four friends standing in a circle raise their fists as glasses: two clink first, then all four meet at one point.",
      setting: "everyday",
      roles: { ora: "host", pia: "guest", raf: "friend", sia: "friend" },
      needs: [],
      refusedUntil: 3552,
    },
    "toasts",
    [
      person("ora", "f1", 0, -0.45, 0, [act("stand", { seconds: 0.5 })]),
      person("pia", "m1", 0, 0.45, 180, [act("stand", { seconds: 0.5 })]),
      person("raf", "m2", -0.45, 0, 90, [act("stand", { seconds: 0.5 })]),
      person("sia", "f2", 0.45, 0, 270, [act("stand", { seconds: 0.5 })]),
    ],
    [],
    [
      mutual("toast", { host: "ora", guest: "pia" }),
      mutual(
        "toastOfFour",
        { host: "ora", guest: "pia", third: "raf", fourth: "sia" },
        { at: { x: 0, y: 1.25, z: 0 } },
      ),
    ],
  ),
  scene(
    {
      id: "wine-toast",
      title: "Wine toast",
      summary:
        "Four friends take up wine glasses from a table; two clink first, then all four bring their glasses together over it.",
      setting: "everyday",
      roles: { val: "host", wes: "guest", xio: "friend", yeo: "friend" },
      needs: [],
      refusedUntil: 3528,
    },
    "wine-toast",
    [
      person("val", "f1", -0.35, -0.75, 0, [
        act("pickUp", { prop: "g1", handle: "stem" }),
      ]),
      person("wes", "m1", 0.35, -0.75, 0, [
        act("pickUp", { prop: "g2", handle: "stem" }),
      ]),
      person("xio", "m2", -0.35, 0.75, 180, [
        act("pickUp", { prop: "g3", handle: "stem" }),
      ]),
      person("yeo", "f2", 0.35, 0.75, 180, [
        act("pickUp", { prop: "g4", handle: "stem" }),
      ]),
    ],
    [
      object("table", "createTable", "dining", 0, 0),
      object("g1", "createDrinkware", "wineGlass", -0.45, -0.3, 0, 0.736),
      object("g2", "createDrinkware", "wineGlass", 0.25, -0.3, 0, 0.736),
      object("g3", "createDrinkware", "wineGlass", -0.25, 0.3, 180, 0.736),
      object("g4", "createDrinkware", "wineGlass", 0.45, 0.3, 180, 0.736),
    ],
    [
      mutual(
        "toast",
        { host: "val", guest: "wes" },
        { glasses: { host: "g1", guest: "g2" } },
      ),
      mutual(
        "toastOfFour",
        { host: "val", guest: "wes", third: "xio", fourth: "yeo" },
        {
          glasses: { host: "g1", guest: "g2", third: "g3", fourth: "g4" },
          at: { x: 0, y: 1.15, z: 0 },
        },
      ),
    ],
  ),
  scene(
    {
      id: "arm-wrestle",
      title: "Arm wrestle",
      summary:
        "Two friends square up across a table: the challenger rubs his hands, shakes a fist and squares his shoulders, the champion folds his arms, lifts his chin and beckons him on; they sit, lock hands with their elbows on the table, strain and the champion pins the challenger.",
      setting: "everyday",
      roles: { tad: "challenger", uri: "champion" },
      needs: [],
    },
    "arm-wrestle",
    [
      person("tad", "m1", 0, -0.45, 0, [
        act("gesture", { kind: "rubHands" }),
        act("shakeFist"),
        act("gesture", { kind: "squareShoulders" }),
        act("sit", { seat: seat("chairT"), seconds: 1 }),
      ]),
      person("uri", "m2", 0, 0.45, 180, [
        act("armsCrossed", { seconds: 1.5 }),
        act("gesture", { kind: "chinLift" }),
        act("gesture", { kind: "beckon" }),
        act("sit", { seat: seat("chairU"), seconds: 1 }),
      ]),
    ],
    [
      object("table", "createTable", "dining", 0, 0),
      object("chairT", "createSeat", "dining", 0, -0.6, 0),
      object("chairU", "createSeat", "dining", 0, 0.6, 180),
    ],
    [
      mutual(
        "armWrestle",
        { one: "tad", other: "uri" },
        { table: { x: 0, y: 0.736, z: 0 }, winner: "other", pin: 30 },
      ),
    ],
  ),
];
