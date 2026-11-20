import type { IScene } from "../structures/IScene";
import { SceneBuild } from "./SceneBuild";

const { act, at, object, person, scene, to }: typeof SceneBuild = SceneBuild;

/**
 * Leg day's plyo box, its footprint centred on (`x`, `z`): placed with these
 * dimensions, and the box jump lands on the top at the same height, so the
 * feet meet the solid the visitor sees.
 */
const BOX: { x: number; z: number; height: number; side: number } = {
  x: 0.8,
  z: 0.8,
  height: 0.508,
  side: 0.61,
};

/** The gym scenes of the lexicon's gym, workout and carry rows: free weights, barbell lifts, legs, push-ups, the mat, the bar, cardio, a sled and a cool-down. */
export const SCENES_WORKOUT: readonly IScene[] = [
  scene(
    {
      id: "dumbbell-corner",
      title: "Dumbbell corner",
      summary:
        "Three people work through dumbbell exercises with the weights mimed: one curls, fans herself between sets and does triceps extensions; one does lateral raises, rolls the shoulders loose and does front raises; one shrugs, rows bent over and rolls the neck.",
      setting: "gym",
      roles: { ann: "member", bud: "member", cid: "member" },
      needs: [],
    },
    "dumbbell-corner",
    [
      person("ann", "f1", -1.8, 0, 0, [
        act("curl", { reps: 2 }),
        act("fanSelf"),
        act("tricepsExtension", { reps: 2 }),
      ]),
      person("bud", "m1", 0, 0, 0, [
        act("lateralRaise", { reps: 2 }),
        act("selfAction", { kind: "shoulderRoll" }),
        act("frontRaise", { reps: 2 }),
      ]),
      person("cid", "m2", 1.8, 0, 0, [
        act("shrug", { reps: 3 }),
        act("bentOverRow", { reps: 2 }),
        act("selfAction", { kind: "neckRoll" }),
      ]),
    ],
  ),
  scene(
    {
      id: "barbell-platform",
      title: "Barbell platform",
      summary:
        "Four lifters: a front squat and a goblet squat, a Romanian deadlift and a good morning, a power clean, a shoulder roll and a snatch finished with a fist pump, an overhead press and a bench press.",
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
        act("selfAction", { kind: "shoulderRoll", count: 1 }),
        act("snatch", { reps: 1 }),
        act("selfAction", { kind: "fistPump", count: 1 }),
      ]),
      person("gia", "f2", 2.4, 0, 0, [
        act("overheadPress", { reps: 2 }),
        act("benchPress", {
          reps: 2,
          on: { prop: "bench", affordance: "surface" },
        }),
      ]),
    ],
    [object("bench", "createBench", "flat", 2.4, 0.9, 0)],
  ),
  scene(
    {
      id: "leg-day",
      title: "Leg day",
      summary:
        "Leg day for four: split squats, a sit against the wall and a quadriceps stretch to shake it off; calf raises and squats; step-ups onto a plyo box, quick high knees to prime and a jump onto its top; hip thrusts off a bench and lunges.",
      setting: "gym",
      roles: { hap: "member", ike: "member", jem: "member", kai: "member" },
      needs: [],
    },
    "leg-day",
    [
      person("hap", "m1", -2.4, 0, 0, [
        act("splitSquat", { reps: 2 }),
        act("wallSit", { hold: 1.5, on: { prop: "wall", affordance: "face" } }),
        act("quadStretch", { seconds: 0.5 }),
      ]),
      person("ike", "f2", -0.8, 0, 0, [
        act("calfRaise", { reps: 3 }),
        act("squats", { reps: 3 }),
      ]),
      person("jem", "m2", 0.8, 0, 0, [
        act("stepUp", {
          reps: 3,
          on: { prop: "box", affordance: "surface" },
        }),
        act("highKnees", { reps: 4, tempo: [0.35, 0, 0.35] }),
        act("stand", { seconds: 0.3 }),
        act("boxJump", {
          to: { x: BOX.x, y: BOX.height, z: BOX.z },
          on: "box",
        }),
      ]),
      person("kai", "f1", 2.4, 0, 0, [
        act("hipThrust", {
          reps: 2,
          on: { prop: "bench", affordance: "edge" },
        }),
        act("lunges", { reps: 2, tempo: [1.5, 0, 1] }),
      ]),
    ],
    [
      object("box", "createPlyoBox", "wood", BOX.x, BOX.z, 0, 0, {
        height: BOX.height,
        width: BOX.side,
        depth: BOX.side,
      }),
      object("bench", "createBench", "flat", 2.4, -0.6, 270),
      object("wall", "createWall", "full", -2.4, -0.6),
    ],
  ),
  scene(
    {
      id: "push-up-ladder",
      title: "Push-up ladder",
      summary:
        "Four people train with their body weight: push-ups, a wide push-up and a shoulder roll; incline push-ups and a decline push-up on a bench and a shoulder stretch; a pike push-up, a plank and a neck roll; and high knees, burpees, a breather with the hands on the hips and high knees again.",
      setting: "gym",
      roles: { lia: "member", mo: "member", nat: "member", oz: "member" },
      needs: [],
    },
    "push-up-ladder",
    [
      person("lia", "f1", -2.4, 0, 0, [
        act("pushUp", { reps: 2 }),
        act("widePushUp", { reps: 1 }),
        act("selfAction", { kind: "shoulderRoll" }),
      ]),
      person("mo", "m1", -0.8, 0, 0, [
        act("inclinePushUp", {
          reps: 2,
          on: { prop: "bench", affordance: "surface" },
        }),
        act("declinePushUp", {
          reps: 1,
          on: { prop: "bench", affordance: "surface" },
        }),
        act("shoulderStretch", { seconds: 0.3 }),
      ]),
      person("nat", "f2", 0.8, 0, 0, [
        act("pikePushUp", { reps: 1 }),
        act("plank", { hold: 2 }),
        act("selfAction", { kind: "neckRoll", count: 3 }),
      ]),
      person("oz", "m2", 2.4, 0, 0, [
        act("highKnees", { reps: 4, tempo: [0.35, 0, 0.35] }),
        act("burpee", { reps: 4 }),
        act("handsOnHips", { seconds: 1.2 }),
        act("highKnees", { reps: 4, tempo: [0.35, 0, 0.35] }),
      ]),
    ],
    [object("bench", "createBench", "flat", -0.8, 1.1, 90)],
  ),
  scene(
    {
      id: "mat-work",
      title: "Mat work",
      summary:
        "Three people on the mats: sit-ups and a lying leg raise, bicycle crunches and Russian twists, a bear crawl and an inchworm back up to standing.",
      setting: "gym",
      roles: { pam: "member", quin: "member", rio: "member" },
      needs: [],
    },
    "mat-work",
    [
      person("pam", "f1", -1.5, 0, 0, [
        act("sitUp", { reps: 2, manner: { pace: 1.1 } }),
        act("lyingLegRaise", { reps: 1, manner: { pace: 1.1 } }),
      ]),
      person("quin", "m1", 0, 0, 0, [
        act("bicycleCrunch", { reps: 4 }),
        act("russianTwist", { reps: 2, hold: 0.2 }),
      ]),
      person("rio", "m2", 1.5, -1, 0, [
        act("bearCrawl", { cycles: 2 }),
        act("inchworm", { cycles: 1 }),
      ]),
    ],
  ),
  scene(
    {
      id: "bar-work",
      title: "Bar work",
      summary:
        "Two people at the pull-up bars: a dead hang and three chin-ups, then a shoulder roll to shake the arms out; four hanging knee raises and a kip swing.",
      setting: "gym",
      roles: { sol: "member", tai: "member" },
      needs: [],
    },
    "bar-work",
    [
      person("sol", "m1", -0.8, 0, 0, [
        act("deadHang", { hold: 1, on: { prop: "barS", affordance: "bar" } }),
        act("chinUp", { reps: 3, on: { prop: "barS", affordance: "bar" } }),
        act("selfAction", { kind: "shoulderRoll" }),
      ]),
      person("tai", "f1", 0.8, 0, 0, [
        act("kneeRaise", {
          reps: 4,
          on: { prop: "barT", affordance: "bar" },
          manner: { pace: 1.05 },
        }),
        act("barSwing", {
          reps: 2,
          on: { prop: "barT", affordance: "bar" },
          manner: { pace: 1.05 },
        }),
      ]),
    ],
    [
      object("barS", "createPullUpBar", "gym", -0.8, 0),
      object("barT", "createPullUpBar", "gym", 0.8, 0),
    ],
  ),
  scene(
    {
      id: "cardio-corner",
      title: "Cardio corner",
      summary:
        "Warming up: one rows on a mimed machine and then pedals a bicycle; one skips a mimed rope, runs high knees and skips again; one steps touch, box steps twice round and steps touch again; one runs a stride down the hall, does butt kicks, strides back and finishes with A-skips.",
      setting: "gym",
      roles: { uli: "member", val: "member", wil: "member", xen: "member" },
      needs: [],
    },
    "cardio-corner",
    [
      person("uli", "m1", -2.4, 0, 0, [
        act("rowing", { reps: 2 }),
        act("cycling", {
          reps: 3,
          on: { prop: "bike", affordance: "saddle" },
        }),
      ]),
      person("val", "f2", -0.8, 0, 0, [
        act("jumpRope", { reps: 16 }),
        act("highKnees", { reps: 4, tempo: [0.35, 0, 0.35] }),
        act("jumpRope", { reps: 16 }),
      ]),
      person("wil", "f1", 0.8, 0, 0, [
        act("stepTouch"),
        act("boxStep", { beats: 12 }),
        act("stepTouch", { beats: 7, side: "left" }),
      ]),
      person("xen", "m2", 2.4, -3, 0, [
        act("strides", { to: to(2.4, 4) }),
        act("buttKicks", { reps: 4 }),
        act("strides", { to: to(2.4, -3) }),
        act("aSkip", { reps: 6, tempo: [0.35, 0, 0.35] }),
      ]),
    ],
    [object("bike", "createBicycle", undefined, -2.4, 0.9)],
  ),
  scene(
    {
      id: "sled-and-carry",
      title: "Sled and carry",
      summary:
        "Two athletes finish with carries: one pushes a barrow down the lane by its two handles, leaning into it, rolls the shoulders, walks back and stands hands on hips catching breath; the other does a farmer's walk with the weights mimed, the arms hanging still, down the lane and back, and rolls the shoulders.",
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
        act("selfAction", { kind: "shoulderRoll" }),
        act("walk", { to: to(-1, -2) }),
        act("handsOnHips", { seconds: 1 }),
      ]),
      person("zed", "f1", 1, -2, 0, [
        act("farmersWalk", { to: to(1, 2) }),
        act("farmersWalk", { to: to(1, -2) }),
        act("selfAction", { kind: "shoulderRoll" }),
      ]),
    ],
    [object("barrow", "createCart", "wheelbarrow", -1, -1.2)],
  ),
  scene(
    {
      id: "farmers-carry",
      title: "Farmer's carry",
      summary:
        "An athlete takes a kettlebell off the floor in each hand and carries them down the lane, the arms hanging still.",
      setting: "gym",
      roles: { ari: "athlete" },
      needs: [],
      refusedUntil: 3528,
      view: "side",
    },
    "farmers-carry",
    [
      person("ari", "f1", 0, -2, 0, [
        act("pickUp", { prop: "bellL", handle: "grip", hand: "left" }),
        act("pickUp", { prop: "bellR", handle: "grip", hand: "right" }),
        act(
          "farmersWalk",
          { to: to(0, 2) },
          {
            over: [
              act("farmersHold", { left: "bellL", right: "bellR", seconds: 3 }),
            ],
          },
        ),
      ]),
    ],
    [
      object("bellL", "createKettlebell", "competition", 0.25, -1.7),
      object("bellR", "createKettlebell", "competition", -0.25, -1.7),
    ],
  ),
  scene(
    {
      id: "cool-down",
      title: "Cool-down",
      summary:
        "Four people cool down: a short chair pose, a child's pose and down into a corpse pose; a sun salutation flowing into a triangle; a quadriceps stretch, a neck stretch, a chest stretch and lunge twists; a seated fold and a hurdler's stretch.",
      setting: "gym",
      roles: { ama: "member", bex: "member", cas: "member", dov: "member" },
      needs: [],
    },
    "cool-down",
    [
      // The yoga rows fix holds of ten and twenty seconds, so the poses are
      // their own laws with a cool-down's short holds.
      person("ama", "f1", -3.6, 0, 0, [
        act("crouch", { depth: "partial", hold: 1 }),
        act("kneel", { kind: "sitBack", hold: 2.5 }),
        act("lieDown", { position: "supine", hold: 1 }),
      ]),
      person("bex", "m1", -1.2, 0, 0, [
        act("sunSalutation"),
        act("triangle", { hold: 1.5 }),
      ]),
      person("cas", "f2", 1.2, 0, 0, [
        act("quadStretch", { seconds: 0.5 }),
        act("neckStretch", { seconds: 0.5 }),
        act("chestStretch", { hold: 0.3 }),
        act("lungeTwist", { reps: 2 }),
      ]),
      person("dov", "m2", 3.6, 0, 0, [
        act("seatedFold", { hold: 1.5, manner: { pace: 1.15 } }),
        act("hurdlerStretch", { hold: 1.5, manner: { pace: 1.15 } }),
      ]),
    ],
  ),
  scene(
    {
      id: "partner-stretch",
      title: "Partner stretch",
      summary:
        "A hamstring stretch with a partner: one lies on the back with the right leg raised straight, and the partner walks up and holds the raised calf.",
      setting: "gym",
      roles: { fly: "stretched", gia: "partner" },
      needs: [],
      refusedUntil: 3528,
    },
    "partner-stretch",
    [
      person("fly", "m2", 0, 0, 0, [
        act("pnfHamstring", {}, { anchor: "pnf" }),
      ]),
      person("gia", "f1", 0, 1.3, 180, [
        act(
          "approach",
          { target: at("fly", "calfRight"), at: 0.05 },
          // The helper comes once the leg is raised: the stretch's hold
          // begins at its first reachEnd, the leg at the hip's 80 degrees.
          { sync: { of: "pnf", event: "reachEnd1" } },
        ),
        act("touch", {
          target: at("fly", "calfRight"),
          kind: "hold",
          hold: 12,
        }),
      ]),
    ],
  ),
];
