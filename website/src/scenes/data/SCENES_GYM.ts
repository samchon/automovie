import type { IScene } from "../structures/IScene";
import { SceneBuild } from "./SceneBuild";

const { act, at, object, person, scene }: typeof SceneBuild = SceneBuild;

/** The gym scenes composed from the workout rows and the gym archetypes of #3392. */
export const SCENES_GYM: readonly IScene[] = [
  scene(
    {
      id: "gym-floor",
      title: "Gym floor",
      summary:
        "Six people train side by side with the weights mimed: back squats and an overhead press, deadlifts and a Romanian deadlift, kettlebell swings around a goblet squat, pull-ups and hanging knee raises on the bar, dips and a knee raise on the parallel bars, and a farmer's walk down the floor and back finished with calf raises.",
      setting: "gym",
      roles: {
        ada: "squat",
        bo: "deadlift",
        cy: "kettlebell",
        di: "pull-ups",
        ed: "dips",
        fe: "farmer's walk",
      },
      needs: [],
      skill: "elite",
      featured: 8,
    },
    "gym",
    [
      person("ada", "m2", -3, 0, 0, [
        act("backSquat", { reps: 3 }),
        act("overheadPress", { reps: 1 }),
      ]),
      person("bo", "f1", -1.8, 0, 0, [
        act("deadlift", { reps: 4 }),
        act("romanianDeadlift", { reps: 1 }),
      ]),
      person("cy", "m1", -0.6, 0, 0, [
        act("kettlebellSwing", { reps: 5 }),
        act("gobletSquat", { reps: 1 }),
        act("kettlebellSwing", { reps: 3 }),
      ]),
      person("di", "f2", 0.6, 0, 0, [
        act("pullUp", {
          reps: 3,
          stay: true,
          on: { prop: "pullBar", affordance: "bar" },
        }),
        act("kneeRaise", {
          reps: 2,
          on: { prop: "pullBar", affordance: "bar" },
        }),
      ]),
      person("ed", "m1", 1.8, 0, 0, [
        act("dip", {
          reps: 4,
          stay: true,
          on: { prop: "dips", affordance: "barLeft", other: "barRight" },
        }),
        act("kneeRaise", {
          reps: 1,
          on: { prop: "dips", affordance: "barLeft", other: "barRight" },
        }),
      ]),
      person("fe", "m2", 3, -1, 0, [
        act("farmersWalk", { to: SceneBuild.to(3, 2) }),
        act("farmersWalk", { to: SceneBuild.to(3, -1) }),
        act("calfRaise", { reps: 2 }),
      ]),
    ],
    [
      object("pullBar", "createPullUpBar", "gym", 0.6, 0),
      object("dips", "createParallelBars", "dipStation", 1.8, 0),
    ],
  ),
  scene(
    {
      id: "yoga-class",
      title: "Yoga class",
      summary:
        "A teacher and four students, a beat behind her, flow from a brief mountain pose into warrior one, straight on into warrior two, then a triangle and a tree.",
      setting: "gym",
      roles: {
        tea: "teacher",
        s1: "student",
        s2: "student",
        s3: "student",
        s4: "student",
      },
      needs: [],
    },
    "yoga",
    [
      person("tea", "f1", 0, 2.4, 180, [
        act("stand", { seconds: 0.8 }),
        act("warriorOne", { reps: 1, hold: 0.8, stay: true }),
        act("warriorTwo", { reps: 1, hold: 0.8, stay: true }),
        act("triangle", { reps: 1, hold: 0.8 }),
        act("treePose", { seconds: 1 }),
      ]),
      ...[-1.5, -0.5, 0.5, 1.5].map(
        (x: number, i: number): SceneBuild.Performer =>
          person(
            `s${i + 1}`,
            ["m1", "f2", "m2", "f1"][i]!,
            x,
            0,
            0,
            [
              act("stand", { seconds: 1 }),
              act("warriorOne", { reps: 1, hold: 0.8, stay: true }),
              act("warriorTwo", { reps: 1, hold: 0.8, stay: true }),
              act("triangle", { reps: 1, hold: 0.8 }),
              act("treePose", { seconds: 1 }),
            ],
            i % 2 === 0 ? "amateur" : "novice",
          ),
      ),
    ],
  ),
  scene(
    {
      id: "core-class",
      title: "Core class",
      summary:
        "Four people work the mat without getting up between moves: crunches into bicycle crunches, bird dogs into a plank, Russian twists into a side plank, glute bridges into mountain climbers.",
      setting: "gym",
      roles: { gi: "member", ha: "member", io: "member", ju: "member" },
      needs: [],
    },
    "core",
    [
      person("gi", "f1", -1.5, 0, 0, [
        act("crunch", { reps: 2, hold: 0.3, stay: true }),
        act("bicycleCrunch", { reps: 4, hold: 0.2 }),
      ]),
      person("ha", "m1", -0.5, 0, 0, [
        act("birdDog", { reps: 2, hold: 0.3, stay: true }),
        act("plank", { reps: 1, hold: 3 }),
      ]),
      person("io", "f2", 0.5, 0, 0, [
        act("russianTwist", { reps: 6, hold: 0.2, stay: true }),
        act("sidePlank", { reps: 1, hold: 1.5 }),
      ]),
      person("ju", "m2", 1.5, 0, 0, [
        act("gluteBridge", { reps: 2, hold: 0.3, stay: true }),
        act("mountainClimber", { reps: 6, hold: 0 }),
      ]),
    ],
  ),
  scene(
    {
      id: "stretching-circle",
      title: "Stretching circle",
      summary:
        "Four runners cool down after a run, each through their own circuit: both quadriceps, a calf stretch and leg swings; leg swings, a chest, side and triceps stretch; both shoulders, arm circles and a neck stretch; a side bend each way, a calf stretch and arm circles.",
      setting: "gym",
      roles: { ka: "runner", lo: "runner", mi: "runner", no: "runner" },
      needs: [],
    },
    "stretch",
    [
      person("ka", "f1", 0, 0, 0, [
        act("quadStretch", { side: "left", seconds: 1.2 }),
        act("quadStretch", { side: "right", seconds: 1.2 }),
        act("calfStretch", { reps: 1, hold: 1 }),
        act("legSwings", { reps: 2, hold: 0 }),
      ]),
      person("lo", "m1", 1.4, 1.4, 270, [
        act("legSwings", { reps: 2, hold: 0 }),
        act("chestStretch", { reps: 1, hold: 1 }),
        act("sideStretch", { side: "right", seconds: 1.2 }),
        act("tricepsStretch", { reps: 1, hold: 1 }),
      ]),
      person("mi", "f2", 0, 2.8, 180, [
        act("shoulderStretch", { side: "right", seconds: 1.2 }),
        act("shoulderStretch", { side: "left", seconds: 1.2 }),
        act("armCircles", { reps: 2, hold: 0 }),
        act("neckStretch", { seconds: 0.6 }),
      ]),
      person("no", "m2", -1.4, 1.4, 90, [
        act("sideStretch", { side: "right", seconds: 1.2 }),
        act("sideStretch", { side: "left", seconds: 1.2 }),
        act("calfStretch", { reps: 1, hold: 0.6 }),
        act("armCircles", { reps: 2, hold: 0 }),
      ]),
    ],
  ),
  scene(
    {
      id: "boxing-class",
      title: "Boxing class",
      summary:
        "A coach and three members drill against each other: the coach throws a jab and a cross, comes back to guard and front-kicks; the members throw a jab, a cross, a lead hook, an uppercut and a round kick; then the whole class finishes together with jumping jacks and high knees.",
      setting: "gym",
      roles: { coa: "coach", m1: "member", m2: "member", m3: "member" },
      needs: [],
      refusedUntil: 3528,
      skill: "novice",
    },
    "boxing",
    [
      person("coa", "m2", 0, 1.0, 180, [
        act("jab", { at: at("m2", "face") }),
        act("cross", { at: at("m2", "face") }),
        act("guard"),
        act("frontKick", { at: at("m2", "abdomen") }),
        act("guard", { seconds: 0.3 }),
        act("exercise", {
          kind: "jumpingJack",
          reps: 4,
          tempo: [0.5, 0, 0.5],
        }),
        act("exercise", { kind: "highKnees", reps: 4, tempo: [0.6, 0, 0.6] }),
      ]),
      ...[-40, 0, 40].map(
        (angle: number, i: number): SceneBuild.Performer =>
          person(
            `m${i + 1}`,
            ["f1", "m1", "f2"][i]!,
            Math.sin((angle * Math.PI) / 180),
            1 - Math.cos((angle * Math.PI) / 180),
            -angle,
            [
              act("jab", { at: at("coa", "face") }),
              act("cross", { at: at("coa", "face") }),
              act("hook", { at: at("coa", "jawRight") }),
              act("uppercut", { at: at("coa", "chin") }),
              act("roundKick", { at: at("coa", "ribsLeft") }),
              act("exercise", {
                kind: "jumpingJack",
                reps: 4,
                tempo: [0.5, 0, 0.5],
              }),
              act("exercise", {
                kind: "highKnees",
                reps: 4,
                tempo: [0.6, 0, 0.6],
              }),
            ],
          ),
      ),
    ],
  ),
];
