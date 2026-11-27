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
        "Six people lift mimed weights: squats, deadlifts, swings, pull-ups, dips and a carry.",
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
        act("backSquat", { count: 3 }),
        act("overheadPress", { count: 1 }),
      ]),
      person("bo", "f1", -1.8, 0, 0, [
        act("deadlift", { count: 4 }),
        act("romanianDeadlift", { count: 1 }),
      ]),
      person("cy", "m1", -0.6, 0, 0, [
        act("kettlebellSwing", { count: 5 }),
        act("gobletSquat", { count: 1 }),
        act("kettlebellSwing", { count: 3 }),
      ]),
      person("di", "f2", 0.6, 0, 0, [
        act("pullUp", {
          count: 3,
          stay: true,
          on: { prop: "pullBar", affordance: "bar" },
        }),
        act("kneeRaise", {
          count: 2,
          on: { prop: "pullBar", affordance: "bar" },
        }),
      ]),
      person("ed", "m1", 1.8, 0, 0, [
        act("dip", {
          count: 4,
          stay: true,
          on: { prop: "dips", affordance: "barLeft", other: "barRight" },
        }),
        act("kneeRaise", {
          count: 1,
          on: { prop: "dips", affordance: "barLeft", other: "barRight" },
        }),
      ]),
      person("fe", "m2", 3, -1, 0, [
        act("farmersWalk", { to: SceneBuild.to(3, 2) }),
        act("farmersWalk", { to: SceneBuild.to(3, -1) }),
        act("calfRaise", { count: 2 }),
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
        "Four students follow a teacher through warrior one, warrior two, triangle and tree.",
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
        act("stand", { hold: 0.8 }),
        act("warriorOne", { count: 1, hold: 0.8, stay: true }),
        act("warriorTwo", { count: 1, hold: 0.8, stay: true }),
        act("triangle", { count: 1, hold: 0.8 }),
        act("treePose", { hold: 1 }),
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
              act("stand", { hold: 1 }),
              act("warriorOne", { count: 1, hold: 0.8, stay: true }),
              act("warriorTwo", { count: 1, hold: 0.8, stay: true }),
              act("triangle", { count: 1, hold: 0.8 }),
              act("treePose", { hold: 1 }),
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
        "Four people chain two core moves each on the floor, from crunches to mountain climbers.",
      setting: "gym",
      roles: { gi: "member", ha: "member", io: "member", ju: "member" },
      needs: [],
    },
    "core",
    [
      person("gi", "f1", -1.5, 0, 0, [
        act("crunch", { count: 2, hold: 0.3, stay: true }),
        act("bicycleCrunch", { count: 4, hold: 0.2 }),
      ]),
      person("ha", "m1", -0.5, 0, 0, [
        act("birdDog", { count: 2, hold: 0.3, stay: true }),
        act("plank", { count: 1, hold: 3 }),
      ]),
      person("io", "f2", 0.5, 0, 0, [
        act("russianTwist", { count: 6, hold: 0.2, stay: true }),
        act("sidePlank", { count: 1, hold: 1.5 }),
      ]),
      person("ju", "m2", 1.5, 0, 0, [
        act("gluteBridge", { count: 2, hold: 0.3, stay: true }),
        act("mountainClimber", { count: 6, hold: 0 }),
      ]),
    ],
  ),
  scene(
    {
      id: "stretching-circle",
      title: "Stretching circle",
      summary:
        "Four runners in a circle cool down, each through their own set of stretches.",
      setting: "gym",
      roles: { ka: "runner", lo: "runner", mi: "runner", no: "runner" },
      needs: [],
    },
    "stretch",
    [
      person("ka", "f1", 0, 0, 0, [
        act("quadStretch", { side: "left", hold: 1.2 }),
        act("quadStretch", { side: "right", hold: 1.2 }),
        act("calfStretch", { count: 1, hold: 1 }),
        act("legSwings", { count: 2, hold: 0 }),
      ]),
      person("lo", "m1", 1.4, 1.4, 270, [
        act("legSwings", { count: 2, hold: 0 }),
        act("chestStretch", { count: 1, hold: 1 }),
        act("sideStretch", { side: "right", hold: 1.2 }),
        act("tricepsStretch", { count: 1, hold: 1 }),
      ]),
      person("mi", "f2", 0, 2.8, 180, [
        act("shoulderStretch", { side: "right", hold: 1.2 }),
        act("shoulderStretch", { side: "left", hold: 1.2 }),
        act("armCircles", { count: 2, hold: 0 }),
        act("neckStretch", { hold: 0.6 }),
      ]),
      person("no", "m2", -1.4, 1.4, 90, [
        act("sideStretch", { side: "right", hold: 1.2 }),
        act("sideStretch", { side: "left", hold: 1.2 }),
        act("calfStretch", { count: 1, hold: 0.6 }),
        act("armCircles", { count: 2, hold: 0 }),
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
        act("guard", { duration: 0.3 }),
        act("exercise", {
          kind: "jumpingJack",
          count: 4,
          tempo: {
            eccentricSeconds: 0.5,
            bottomPauseSeconds: 0,
            concentricSeconds: 0.5,
          },
        }),
        act("exercise", {
          kind: "highKnees",
          count: 4,
          tempo: {
            eccentricSeconds: 0.6,
            bottomPauseSeconds: 0,
            concentricSeconds: 0.6,
          },
        }),
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
                count: 4,
                tempo: {
                  eccentricSeconds: 0.5,
                  bottomPauseSeconds: 0,
                  concentricSeconds: 0.5,
                },
              }),
              act("exercise", {
                kind: "highKnees",
                count: 4,
                tempo: {
                  eccentricSeconds: 0.6,
                  bottomPauseSeconds: 0,
                  concentricSeconds: 0.6,
                },
              }),
            ],
          ),
      ),
    ],
  ),
];
