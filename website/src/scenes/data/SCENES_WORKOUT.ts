import type { IScene } from "../structures/IScene";
import { SceneBuild } from "./SceneBuild";

const { act, object, person, scene, to }: typeof SceneBuild = SceneBuild;

/** The gym scenes of the lexicon's gym, workout and carry rows: free weights, barbell lifts, legs, push-ups, the mat, the bar, cardio, a sled and a cool-down. */
export const SCENES_WORKOUT: readonly IScene[] = [
  scene(
    {
      id: "dumbbell-corner",
      title: "Dumbbell corner",
      summary:
        "Three people at the dumbbell rack: curls and triceps extensions, lateral and front raises, shrugs and a bent-over row.",
      setting: "gym",
      roles: { ann: "member", bud: "member", cid: "member" },
      needs: [],
    },
    "dumbbell-corner",
    [
      person("ann", "f1", -1.2, 0, 0, [
        act("curl", { reps: 3 }),
        act("tricepsExtension", { reps: 3 }),
      ]),
      person("bud", "m1", 0, 0, 0, [
        act("lateralRaise", { reps: 3 }),
        act("frontRaise", { reps: 3 }),
      ]),
      person("cid", "m2", 1.2, 0, 0, [
        act("shrug", { reps: 3 }),
        act("bentOverRow", { reps: 3 }),
      ]),
    ],
  ),
  scene(
    {
      id: "barbell-platform",
      title: "Barbell platform",
      summary:
        "Four lifters: a front squat and a goblet squat, a Romanian deadlift and a good morning, a power clean and a snatch, an overhead press and a bench press.",
      setting: "gym",
      roles: { dax: "lifter", eva: "lifter", fox: "lifter", gia: "lifter" },
      needs: [],
      skill: "elite",
    },
    "barbell-platform",
    [
      person("dax", "m2", -2.4, 0, 0, [
        act("frontSquat", { reps: 2 }),
        act("gobletSquat", { reps: 2 }),
      ]),
      person("eva", "f1", -0.8, 0, 0, [
        act("romanianDeadlift", { reps: 2 }),
        act("goodMorning", { reps: 2 }),
      ]),
      person("fox", "m1", 0.8, 0, 0, [
        act("powerClean", { reps: 1 }),
        act("snatch", { reps: 1 }),
      ]),
      person("gia", "f2", 2.4, 0, 0, [
        act("overheadPress", { reps: 2 }),
        act("benchPress", {
          reps: 2,
          on: { prop: "bench", affordance: "surface" },
        }),
      ]),
    ],
    [object("bench", "createBench", "flat", 2.4, 0.9, 90)],
  ),
  scene(
    {
      id: "leg-day",
      title: "Leg day",
      summary:
        "Leg day for four: split squats and a wall sit, calf raises and squats, step-ups and a box jump, a hip thrust and lunges.",
      setting: "gym",
      roles: { hap: "member", ike: "member", jem: "member", kai: "member" },
      needs: [],
    },
    "leg-day",
    [
      person("hap", "m1", -2.4, 0, 0, [
        act("splitSquat", { reps: 2 }),
        act("wallSit", { hold: 2 }),
      ]),
      person("ike", "f2", -0.8, 0, 0, [
        act("calfRaise", { reps: 3 }),
        act("squats", { reps: 2 }),
      ]),
      person("jem", "m2", 0.8, 0, 0, [
        act("stepUp", { reps: 2 }),
        act("stand", { seconds: 0.3 }),
        act("boxJump", { to: { x: 0.8, y: 0.6, z: 0.8 }, on: "box" }),
      ]),
      person("kai", "f1", 2.4, 0, 0, [
        act("hipThrust", { reps: 2 }),
        act("lunges", { reps: 2 }),
      ]),
    ],
    [object("box", "createPlyoBox", "wood", 0.8, 0.8)],
  ),
  scene(
    {
      id: "push-up-ladder",
      title: "Push-up ladder",
      summary:
        "Four people on the floor: push-ups wide and narrow, incline, decline and pike, a plank and burpees.",
      setting: "gym",
      roles: { lia: "member", mo: "member", nat: "member", oz: "member" },
      needs: [],
    },
    "push-up-ladder",
    [
      person("lia", "f1", -2.4, 0, 90, [
        act("pushUp", { reps: 2 }),
        act("widePushUp", { reps: 2 }),
      ]),
      person("mo", "m1", -0.8, 0, 90, [
        act("inclinePushUp", { reps: 2 }),
        act("declinePushUp", { reps: 2 }),
      ]),
      person("nat", "f2", 0.8, 0, 90, [
        act("pikePushUp", { reps: 2 }),
        act("plank", { hold: 2 }),
      ]),
      person("oz", "m2", 2.4, 0, 90, [act("burpee", { reps: 2 })]),
    ],
  ),
  scene(
    {
      id: "mat-work",
      title: "Mat work",
      summary:
        "Three people on the mats: sit-ups and lying leg raises, bicycle crunches, a bear crawl and an inchworm.",
      setting: "gym",
      roles: { pam: "member", quin: "member", rio: "member" },
      needs: [],
    },
    "mat-work",
    [
      person("pam", "f1", -1.5, 0, 90, [
        act("sitUp", { reps: 2 }),
        act("lyingLegRaise", { reps: 2 }),
      ]),
      person("quin", "m1", 0, 0, 90, [act("bicycleCrunch", { reps: 3 })]),
      person("rio", "m2", 1.5, -1, 0, [act("bearCrawl"), act("inchworm")]),
    ],
  ),
  scene(
    {
      id: "bar-work",
      title: "Bar work",
      summary:
        "Two people at the pull-up bars: a dead hang and chin-ups, hanging knee raises and a kip swing.",
      setting: "gym",
      roles: { sol: "member", tai: "member" },
      needs: [],
    },
    "bar-work",
    [
      person("sol", "m1", -0.8, 0, 0, [
        act("deadHang", { hold: 1.5 }),
        act("chinUp", { reps: 2 }),
      ]),
      person("tai", "f1", 0.8, 0, 0, [
        act("kneeRaise", { reps: 2 }),
        act("barSwing", { reps: 2 }),
      ]),
    ],
  ),
  scene(
    {
      id: "cardio-corner",
      title: "Cardio corner",
      summary:
        "Warming up: a rower and a cyclist, a skipping rope, step-touch and box steps, and strides down the hall.",
      setting: "gym",
      roles: { uli: "member", val: "member", wil: "member", xen: "member" },
      needs: [],
    },
    "cardio-corner",
    [
      person("uli", "m1", -2.4, 0, 0, [act("rowing"), act("cycling")]),
      person("val", "f2", -0.8, 0, 0, [act("jumpRope", { reps: 6 })]),
      person("wil", "f1", 0.8, 0, 0, [act("stepTouch"), act("boxStep")]),
      person("xen", "m2", 2.4, -3, 0, [act("strides", { to: to(2.4, 4) })]),
    ],
  ),
  scene(
    {
      id: "sled-and-carry",
      title: "Sled and carry",
      summary:
        "Two athletes finish with loaded carries: one pushes a loaded barrow down the lane leaning into it, the other does a farmer's walk with the arms hanging still.",
      setting: "gym",
      roles: { yul: "athlete", zed: "athlete" },
      needs: [],
      view: "side",
    },
    "sled-and-carry",
    [
      person("yul", "m2", -1, -2.2, 0, [
        act("sledPush", {
          sled: "barrow",
          to: to(-1, 2),
          left: "leftHandle",
          right: "rightHandle",
        }),
      ]),
      person("zed", "f1", 1, -2, 0, [act("farmersWalk", { to: to(1, 2) })]),
    ],
    [object("barrow", "createCart", "wheelbarrow", -1, -1.2)],
  ),
  scene(
    {
      id: "cool-down",
      title: "Cool-down",
      summary:
        "Four people cool down: a chair pose, a child's pose and a corpse pose, a sun salutation and a triangle, a cobra and a hip-flexor stretch, toe touches and a neck stretch, chest and triceps stretches and a lunge twist, a hamstring stretch, a seated fold and a hurdler's stretch.",
      setting: "gym",
      roles: { ama: "member", bex: "member", cas: "member", dov: "member" },
      needs: [],
    },
    "cool-down",
    [
      person("ama", "f1", -2.4, 0, 0, [
        act("chairPose"),
        act("childsPose"),
        act("corpsePose"),
      ]),
      person("bex", "m1", -0.8, 0, 0, [
        act("sunSalutation"),
        act("triangle"),
        act("cobra"),
        act("hipFlexorStretch"),
      ]),
      person("cas", "f2", 0.8, 0, 0, [
        act("toeTouch"),
        act("neckStretch"),
        act("chestStretch"),
        act("tricepsStretch"),
        act("lungeTwist"),
      ]),
      person("dov", "m2", 2.4, 0, 0, [
        act("pnfHamstring"),
        act("seatedFold"),
        act("hurdlerStretch"),
      ]),
    ],
  ),
];
