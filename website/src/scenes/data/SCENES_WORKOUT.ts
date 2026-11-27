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
        "Three people work mimed dumbbells: curls and extensions, raises, shrugs and rows.",
      setting: "gym",
      roles: { ann: "member", bud: "member", cid: "member" },
      needs: [],
    },
    "dumbbell-corner",
    [
      person("ann", "f1", -1.8, 0, 0, [
        act("curl", { count: 2 }),
        act("fanSelf"),
        act("tricepsExtension", { count: 2 }),
      ]),
      person("bud", "m1", 0, 0, 0, [
        act("lateralRaise", { count: 2 }),
        act("selfAction", { kind: "shoulderRoll" }),
        act("frontRaise", { count: 2 }),
      ]),
      person("cid", "m2", 1.8, 0, 0, [
        act("shrug", { count: 3 }),
        act("bentOverRow", { count: 2 }),
        act("selfAction", { kind: "neckRoll" }),
      ]),
    ],
  ),
  scene(
    {
      id: "barbell-platform",
      title: "Barbell platform",
      summary:
        "Four lifters run squats, hinges, a clean and a snatch, and presses.",
      setting: "gym",
      roles: { dax: "lifter", eva: "lifter", fox: "lifter", gia: "lifter" },
      needs: [],
      skill: "elite",
    },
    "barbell-platform",
    [
      person("dax", "m2", -2.4, 0, 0, [
        act("frontSquat", { count: 2 }),
        act("gobletSquat", { count: 2 }),
      ]),
      person("eva", "f1", -0.8, 0, 0, [
        act("romanianDeadlift", { count: 2 }),
        act("goodMorning", { count: 2 }),
      ]),
      person("fox", "m1", 0.8, 0, 0, [
        act("powerClean", { count: 1 }),
        act("selfAction", { kind: "shoulderRoll", count: 1 }),
        act("snatch", { count: 1 }),
        act("selfAction", { kind: "fistPump", count: 1 }),
      ]),
      person("gia", "f2", 2.4, 0, 0, [
        act("overheadPress", { count: 2 }),
        act("benchPress", {
          count: 2,
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
        "Four people train legs: squats, a wall sit, step-ups, a box jump, hip thrusts and lunges.",
      setting: "gym",
      roles: { hap: "member", ike: "member", jem: "member", kai: "member" },
      needs: [],
    },
    "leg-day",
    [
      person("hap", "m1", -2.4, 0, 0, [
        act("splitSquat", { count: 2 }),
        act("wallSit", { hold: 1.5, on: { prop: "wall", affordance: "face" } }),
        act("quadStretch", { hold: 0.5 }),
      ]),
      person("ike", "f2", -0.8, 0, 0, [
        act("calfRaise", { count: 3 }),
        act("squats", { count: 3 }),
      ]),
      person("jem", "m2", 0.8, 0, 0, [
        act("stepUp", {
          count: 3,
          on: { prop: "box", affordance: "surface" },
        }),
        act("highKnees", {
          count: 4,
          tempo: {
            eccentricSeconds: 0.35,
            bottomPauseSeconds: 0,
            concentricSeconds: 0.35,
          },
        }),
        act("stand", { hold: 0.3 }),
        act("boxJump", {
          to: { x: BOX.x, y: BOX.height, z: BOX.z },
          on: "box",
        }),
      ]),
      person("kai", "f1", 2.4, 0, 0, [
        act("hipThrust", {
          count: 2,
          on: { prop: "bench", affordance: "edge" },
        }),
        act("lunges", {
          count: 2,
          tempo: {
            eccentricSeconds: 1.5,
            bottomPauseSeconds: 0,
            concentricSeconds: 1,
          },
        }),
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
      title: "Body-weight circuit",
      summary:
        "Four people train with body weight: push-up variations, a plank, burpees and high knees.",
      setting: "gym",
      roles: { lia: "member", mo: "member", nat: "member", oz: "member" },
      needs: [],
    },
    "push-up-ladder",
    [
      person("lia", "f1", -2.4, 0, 0, [
        act("pushUp", { count: 2 }),
        act("widePushUp", { count: 1 }),
        act("selfAction", { kind: "shoulderRoll" }),
      ]),
      person("mo", "m1", -0.8, 0, 0, [
        act("inclinePushUp", {
          count: 2,
          on: { prop: "bench", affordance: "surface" },
        }),
        act("declinePushUp", {
          count: 1,
          on: { prop: "bench", affordance: "surface" },
        }),
        act("shoulderStretch", { hold: 0.3 }),
      ]),
      person("nat", "f2", 0.8, 0, 0, [
        act("pikePushUp", { count: 1 }),
        act("plank", { hold: 2 }),
        act("selfAction", { kind: "neckRoll", count: 3 }),
      ]),
      person("oz", "m2", 2.4, 0, 0, [
        act("highKnees", {
          count: 4,
          tempo: {
            eccentricSeconds: 0.35,
            bottomPauseSeconds: 0,
            concentricSeconds: 0.35,
          },
        }),
        act("burpee", { count: 4 }),
        act("handsOnHips", { hold: 1.2 }),
        act("highKnees", {
          count: 4,
          tempo: {
            eccentricSeconds: 0.35,
            bottomPauseSeconds: 0,
            concentricSeconds: 0.35,
          },
        }),
      ]),
    ],
    [object("bench", "createBench", "flat", -0.8, 1.1, 90)],
  ),
  scene(
    {
      id: "mat-work",
      title: "Mat work",
      summary:
        "Three people work the floor: sit-ups, crunches and twists, a bear crawl and an inchworm.",
      setting: "gym",
      roles: { pam: "member", quin: "member", rio: "member" },
      needs: [],
    },
    "mat-work",
    [
      person("pam", "f1", -1.5, 0, 0, [
        act("sitUp", { count: 2, manner: { pace: 1.1 } }),
        act("lyingLegRaise", { count: 1, manner: { pace: 1.1 } }),
      ]),
      person("quin", "m1", 0, 0, 0, [
        act("bicycleCrunch", { count: 4 }),
        act("russianTwist", { count: 2, hold: 0.2 }),
      ]),
      person("rio", "m2", 1.5, -1, 0, [
        act("bearCrawl", { count: 2 }),
        act("inchworm", { count: 1 }),
      ]),
    ],
  ),
  scene(
    {
      id: "bar-work",
      title: "Bar work",
      summary:
        "Two people at the pull-up bars: a dead hang and chin-ups, hanging knee raises and swings.",
      setting: "gym",
      roles: { sol: "member", tai: "member" },
      needs: [],
    },
    "bar-work",
    [
      person("sol", "m1", -0.8, 0, 0, [
        act("deadHang", { hold: 1, on: { prop: "barS", affordance: "bar" } }),
        act("chinUp", { count: 3, on: { prop: "barS", affordance: "bar" } }),
        act("selfAction", { kind: "shoulderRoll" }),
      ]),
      person("tai", "f1", 0.8, 0, 0, [
        act("kneeRaise", {
          count: 4,
          on: { prop: "barT", affordance: "bar" },
          manner: { pace: 1.05 },
        }),
        act("barSwing", {
          count: 2,
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
        "Four people warm up: rowing and cycling, skipping rope, dance steps and strides.",
      setting: "gym",
      roles: { uli: "member", val: "member", wil: "member", xen: "member" },
      needs: [],
    },
    "cardio-corner",
    [
      person("uli", "m1", -2.4, 0, 0, [
        act("rowing", { count: 2 }),
        act("cycling", {
          count: 3,
          on: { prop: "bike", affordance: "saddle" },
        }),
      ]),
      person("val", "f2", -0.8, 0, 0, [
        act("jumpRope", { count: 16 }),
        act("highKnees", {
          count: 4,
          tempo: {
            eccentricSeconds: 0.35,
            bottomPauseSeconds: 0,
            concentricSeconds: 0.35,
          },
        }),
        act("jumpRope", { count: 16 }),
      ]),
      person("wil", "f1", 0.8, 0, 0, [
        act("stepTouch"),
        act("boxStep", { count: 12 }),
        act("stepTouch", { count: 7, side: "left" }),
      ]),
      person("xen", "m2", 2.4, -3, 0, [
        act("strides", { to: to(2.4, 4) }),
        act("buttKicks", { count: 4 }),
        act("strides", { to: to(2.4, -3) }),
        act("aSkip", {
          count: 6,
          tempo: {
            eccentricSeconds: 0.35,
            bottomPauseSeconds: 0,
            concentricSeconds: 0.35,
          },
        }),
      ]),
    ],
    [object("bike", "createBicycle", undefined, -2.4, 0.9)],
  ),
  scene(
    {
      id: "sled-and-carry",
      title: "Barrow and carry",
      summary:
        "One athlete pushes a wheelbarrow up the lane; another carries mimed weights up and back.",
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
        act("handsOnHips", { hold: 1 }),
      ]),
      person("zed", "f1", 1, -2, 0, [
        act("farmersWalk", { to: to(1, 2) }),
        act("farmersWalk", { to: to(1, -2) }),
        act("selfAction", { kind: "shoulderRoll" }),
      ]),
    ],
    [object("barrow", "createWheelbarrow", undefined, -1, -1.2)],
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
              act("farmersHold", {
                left: "bellL",
                right: "bellR",
                duration: 3,
              }),
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
        "Four people cool down with yoga poses, a sun salutation and seated and standing stretches.",
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
        act("lieDown", { kind: "supine", hold: 1 }),
      ]),
      person("bex", "m1", -1.2, 0, 0, [
        act("sunSalutation"),
        act("triangle", { hold: 1.5 }),
      ]),
      person("cas", "f2", 1.2, 0, 0, [
        act("quadStretch", { hold: 0.5 }),
        act("neckStretch", { hold: 0.5 }),
        act("chestStretch", { hold: 0.3 }),
        act("lungeTwist", { count: 2 }),
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
