import type { IScene } from "../structures/IScene";
import { SceneBuild } from "./SceneBuild";

const { act, mutual, object, person, scene, seat }: typeof SceneBuild =
  SceneBuild;

/** The everyday scenes of the lexicon's emblems, habits and resting poses, and of its social mutual actions: hands that talk, care for the face, a photograph, sitting low without a seat, games of the hands and toasts. */
export const SCENES_GESTURES: readonly IScene[] = [
  scene(
    {
      id: "talking-hands",
      title: "Talking hands",
      summary:
        "Three friends across a noisy room: palms together, fingers crossed, a thumbs down, four and five counted, a fist shaken, ears covered and a blown kiss.",
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
      ]),
      person("bob", "m1", 1.2, 0.4, 270, [
        act("thumbsDown"),
        act("countFour"),
        act("countFive"),
      ]),
      person("cat", "m2", 0.4, 1.2, 200, [
        act("shakeFist"),
        act("coverEars"),
        act("coverMouth"),
      ]),
    ],
  ),
  scene(
    {
      id: "powder-room",
      title: "Powder room",
      summary:
        "Two people at a mirror: one draws lipstick across the lips, the other blows their nose.",
      setting: "everyday",
      roles: { dot: "guest", eli: "guest" },
      needs: [],
    },
    "powder-room",
    [
      person("dot", "f2", -0.5, 0, 0, [act("applyLipstick")]),
      person("eli", "m1", 0.5, 0, 0, [act("blowNose")]),
    ],
  ),
  scene(
    {
      id: "snapshot",
      title: "Snapshot",
      summary:
        "A tourist takes a camera off a kiosk counter and photographs a friend, who poses with crossed fingers.",
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
          use: { tip: "screen", line: "across" },
        }),
        act("photograph", { prop: "camera" }),
      ]),
      person("gil", "f1", 1.5, 2.5, 210, [
        act("stand", { seconds: 1.5 }),
        act("crossedFingers"),
      ]),
    ],
    [
      object("counter", "createTable", "counter", 0, 0.65, 180),
      object("camera", "createDevice", "camera", -0.18, 0.42, 0, 0.91),
    ],
  ),
  scene(
    {
      id: "park-rest",
      title: "Resting in the park",
      summary:
        "Three walkers stop on the grass: one takes a knee, one sits with the legs folded to the side, one squats low on the heels.",
      setting: "everyday",
      roles: { hal: "walker", ida: "walker", jon: "walker" },
      needs: [],
    },
    "park-rest",
    [
      person("hal", "m1", -1.2, 0, 20, [act("takeAKnee")]),
      person("ida", "f1", 0, 0.6, 180, [act("sitSideways")]),
      person("jon", "m2", 1.2, 0, 330, [act("squatSit")]),
    ],
  ),
  scene(
    {
      id: "schoolyard-games",
      title: "Schoolyard games",
      summary:
        "Two pairs at break: one plays rock, paper, scissors on a shared count, the other clasps hands for a thumb war.",
      setting: "everyday",
      roles: { kas: "player", lin: "player", mia: "player", ned: "player" },
      needs: [],
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
      object("g1", "createDrinkware", "wineGlass", -0.45, -0.3, 0, 0.75),
      object("g2", "createDrinkware", "wineGlass", 0.25, -0.3, 0, 0.75),
      object("g3", "createDrinkware", "wineGlass", -0.25, 0.3, 180, 0.75),
      object("g4", "createDrinkware", "wineGlass", 0.45, 0.3, 180, 0.75),
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
        "Two friends sit across a table, lock hands with their elbows on it, strain and one pins the other.",
      setting: "everyday",
      roles: { tad: "challenger", uri: "champion" },
      needs: [],
    },
    "arm-wrestle",
    [
      person("tad", "m1", 0, -0.6, 0, [
        act("sit", { seat: seat("chairT"), seconds: 1 }),
      ]),
      person("uri", "m2", 0, 0.6, 180, [
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
        { table: { x: 0, y: 0.75, z: 0 }, winner: "other", pin: 30 },
      ),
    ],
  ),
];
