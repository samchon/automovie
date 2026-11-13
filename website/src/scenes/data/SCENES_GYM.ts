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
        "Six people train side by side: a back squat in the rack, a deadlift, a kettlebell swing, pull-ups, dips and a farmer's walk.",
      setting: "gym",
      roles: {
        ada: "squat",
        bo: "deadlift",
        cy: "kettlebell",
        di: "pull-ups",
        ed: "dips",
        fe: "farmer's walk",
      },
      needs: [3392],
      skill: "elite",
      featured: 3,
    },
    "gym",
    [
      person("ada", "m2", -3, 0, 0, [act("backSquat", { reps: 3 })]),
      person("bo", "f1", -1.8, 0, 0, [act("deadlift", { reps: 3 })]),
      person("cy", "m1", -0.6, 0, 0, [act("kettlebellSwing", { reps: 5 })]),
      person("di", "f2", 0.6, 0, 0, [act("pullUp", { reps: 3 })]),
      person("ed", "m1", 1.8, 0, 0, [act("dip", { reps: 4 })]),
      person("fe", "m2", 3, -1, 0, [
        act("farmersWalk", { to: SceneBuild.to(3, 2) }),
      ]),
    ],
    [
      object("rack", "createRack", "squat", -3, 0.2),
      object("bar", "createBarbell", "mens", -1.8, 0.35),
      object("bell", "createKettlebell", "competition", -0.6, 0.4),
      object("pullBar", "createPullUpBar", "gym", 0.6, 0),
      object("dips", "createParallelBars", "dipStation", 1.8, 0),
    ],
  ),
  scene(
    {
      id: "yoga-class",
      title: "Yoga class",
      summary:
        "A teacher and four students flow from mountain pose through the warriors and a tree to a downward dog.",
      setting: "gym",
      roles: {
        tea: "teacher",
        s1: "student",
        s2: "student",
        s3: "student",
        s4: "student",
      },
      needs: [3392],
    },
    "yoga",
    [
      person("tea", "f1", 0, 2.4, 180, [
        act("mountainPose"),
        act("warriorOne", { reps: 1, hold: 1 }),
        act("warriorTwo", { reps: 1, hold: 1 }),
        act("treePose", { seconds: 1.5 }),
        act("downwardDog", { reps: 1, hold: 1 }),
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
              act("mountainPose"),
              act("warriorOne", { reps: 1, hold: 1 }),
              act("warriorTwo", { reps: 1, hold: 1 }),
              act("treePose", { seconds: 1.5 }),
              act("downwardDog", { reps: 1, hold: 1 }),
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
        "Four people on the mat: crunches, a dead bug, a bird dog, Russian twists, a side plank and a glute bridge.",
      setting: "gym",
      roles: { gi: "member", ha: "member", io: "member", ju: "member" },
      needs: [3392],
    },
    "core",
    [
      person("gi", "f1", -1.5, 0, 90, [
        act("crunch", { reps: 2, hold: 0.3 }),
        act("deadBug", { reps: 2, hold: 0.3 }),
      ]),
      person("ha", "m1", -0.5, 0, 90, [
        act("birdDog", { reps: 2, hold: 0.3 }),
        act("superman", { reps: 1, hold: 1 }),
      ]),
      person("io", "f2", 0.5, 0, 90, [
        act("russianTwist", { reps: 3, hold: 0.2 }),
        act("sidePlank", { reps: 1, hold: 1.5 }),
      ]),
      person("ju", "m2", 1.5, 0, 90, [
        act("gluteBridge", { reps: 2, hold: 0.3 }),
        act("mountainClimber", { reps: 3, hold: 0 }),
      ]),
    ],
  ),
  scene(
    {
      id: "stretching-circle",
      title: "Stretching circle",
      summary:
        "Four runners stretch after a run: quadriceps, shoulders, a side bend, calves, leg swings and arm circles.",
      setting: "gym",
      roles: { ka: "runner", lo: "runner", mi: "runner", no: "runner" },
      needs: [3392],
    },
    "stretch",
    [
      person("ka", "f1", 0, 0, 0, [act("quadStretch", { seconds: 1.5 })]),
      person("lo", "m1", 1.4, 1.4, 270, [
        act("legSwings", { reps: 3, hold: 0 }),
      ]),
      person("mi", "f2", 0, 2.8, 180, [
        act("shoulderStretch", { seconds: 1.5 }),
        act("armCircles", { reps: 2, hold: 0 }),
      ]),
      person("no", "m2", -1.4, 1.4, 90, [
        act("sideStretch", { seconds: 1.5 }),
        act("calfStretch", { reps: 1, hold: 1 }),
      ]),
    ],
  ),
  scene(
    {
      id: "boxing-class",
      title: "Boxing class",
      summary:
        "A coach and three members drill jabs, crosses, hooks, uppercuts and kicks, sway and finish with jumping jacks.",
      setting: "gym",
      roles: { coa: "coach", m1: "member", m2: "member", m3: "member" },
      needs: [3392],
      skill: "novice",
    },
    "boxing",
    [
      person("coa", "m2", 0, 2.4, 180, [
        act("jab", { at: at("m2", "face") }),
        act("cross", { at: at("m2", "face") }),
        act("sway"),
        act("frontKick", { at: at("m2", "abdomen") }),
      ]),
      ...[-1.2, 0, 1.2].map(
        (x: number, i: number): SceneBuild.Performer =>
          person(`m${i + 1}`, ["f1", "m1", "f2"][i]!, x, 0, 0, [
            act("jab", { at: at("coa", "face") }),
            act("cross", { at: at("coa", "face") }),
            act("hook", { at: at("coa", "jawLeft") }),
            act("uppercut", { at: at("coa", "chin") }),
            act("roundKick", { at: at("coa", "ribsLeft") }),
            act("jumpingJacks", { reps: 3 }),
          ]),
      ),
    ],
  ),
];
