import type { IPlaygroundComposition } from "../../playground/structures/IPlaygroundComposition";
import type { IScene } from "../structures/IScene";
import { SceneTakes } from "./SceneTakes";

/** A floor point, as a destination. */
function to(x: number, z: number): Record<string, number> {
  return { x, y: 0, z };
}

/** A performer with its actions, at a place and heading. */
function person(
  subject: string,
  body: string,
  x: number,
  z: number,
  yaw: number,
  actions: IPlaygroundComposition.IAction[],
  proficiency: IPlaygroundComposition.Proficiency = "trained",
): IPlaygroundComposition.IPerformer {
  return { subject, body, x, z, yaw, proficiency, actions };
}

/** A composition of people only. */
function scene(
  seed: string,
  performers: IPlaygroundComposition.IPerformer[],
): IPlaygroundComposition {
  return { version: 1, seed, performers, mutuals: [] };
}

const WARM_UP: IPlaygroundComposition = scene("warm-up", [
  person("jo", "m1", -2.4, 0, 0, [
    { name: "run", params: { to: to(-2.4, 4), pace: "jog" } },
    { name: "run", params: { to: to(-2.4, 0.5), pace: "jog" } },
    { name: "buttKicks", params: { reps: 4 } },
    {
      name: "exercise",
      params: { kind: "highKnees", reps: 4, tempo: [0.6, 0, 0.6] },
    },
  ]),
  person("kim", "f1", -0.8, 1.5, 180, [
    {
      name: "exercise",
      params: { kind: "squat", reps: 3, depth: "parallel", tempo: [1, 0, 0.8] },
    },
    {
      name: "exercise",
      params: { kind: "lunge", side: "left", reps: 2, tempo: [1, 0, 0.8] },
    },
    {
      name: "exercise",
      params: { kind: "lunge", side: "right", reps: 2, tempo: [1, 0, 0.8] },
    },
  ]),
  person("lou", "m2", 0.8, 1.5, 180, [
    {
      name: "exercise",
      params: { kind: "jumpingJack", reps: 4, tempo: [0.5, 0, 0.5] },
    },
    { name: "stand", params: { seconds: 0.4 } },
    { name: "jump", params: { to: to(0.8, 1.1) } },
    {
      name: "exercise",
      params: { kind: "highKnees", reps: 3, tempo: [0.6, 0, 0.6] },
    },
    {
      name: "exercise",
      params: { kind: "jumpingJack", reps: 3, tempo: [0.5, 0, 0.5] },
    },
  ]),
  person("mo", "f2", 2.4, 1.5, 180, [
    {
      name: "stretch",
      params: { kind: "quadriceps", side: "left", seconds: 1.5 },
    },
    {
      name: "stretch",
      params: { kind: "overheadSide", side: "right", seconds: 1.5 },
    },
    {
      name: "exercise",
      params: { kind: "highKnees", reps: 4, tempo: [0.6, 0, 0.6] },
    },
  ]),
]);

const DANCE_CIRCLE: IPlaygroundComposition = scene("dance-circle", [
  person("ny", "f1", 0, 0, 0, [
    { name: "dance", params: { kind: "bounce", bpm: 112, beats: 6 } },
    { name: "dance", params: { kind: "stepTouch", bpm: 112, beats: 6 } },
    { name: "dance", params: { kind: "sway", bpm: 112, beats: 6 } },
    { name: "dance", params: { kind: "boxStep", bpm: 112, beats: 6 } },
  ]),
  person("ol", "m1", 1.04, 1.8, 240, [
    { name: "dance", params: { kind: "sway", bpm: 112, beats: 6 } },
    { name: "dance", params: { kind: "bounce", bpm: 112, beats: 6 } },
    { name: "dance", params: { kind: "stepTouch", bpm: 112, beats: 6 } },
    { name: "dance", params: { kind: "boxStep", bpm: 112, beats: 6 } },
  ]),
  person("pia", "f2", -1.04, 1.8, 120, [
    { name: "dance", params: { kind: "stepTouch", bpm: 112, beats: 6 } },
    { name: "dance", params: { kind: "sway", bpm: 112, beats: 6 } },
    { name: "dance", params: { kind: "bounce", bpm: 112, beats: 6 } },
    { name: "dance", params: { kind: "boxStep", bpm: 112, beats: 6 } },
  ]),
]);

const COURT: IPlaygroundComposition = scene("court", [
  person("quin", "m2", -2.2, 0, 0, [
    { name: "ballSport", params: { kind: "dribble", count: 8 } },
    { name: "ballSport", params: { kind: "throwIn" } },
    { name: "ballSport", params: { kind: "dribble", count: 8 } },
    { name: "ballSport", params: { kind: "throwIn" } },
  ]),
  person("rae", "f1", -0.7, 0, 0, [
    ...[0, 1, 2, 3].flatMap((): IPlaygroundComposition.IAction[] => [
      { name: "ballSport", params: { kind: "set" } },
      { name: "ballSport", params: { kind: "dig" } },
    ]),
    { name: "ballSport", params: { kind: "set" } },
  ]),
  person("sol", "m1", 0.8, 0, 0, [
    { name: "baseball", params: { kind: "catcherCrouch", seconds: 2 } },
    { name: "baseball", params: { kind: "groundBall", seconds: 1.8 } },
    { name: "baseball", params: { kind: "catcherCrouch", seconds: 2 } },
    { name: "baseball", params: { kind: "groundBall", seconds: 1.8 } },
  ]),
  person("tam", "f2", 2.3, 0, 0, [
    { name: "racket", params: { kind: "readyPosition", seconds: 1.35 } },
    { name: "racket", params: { kind: "splitStep", seconds: 1.35 } },
    { name: "racket", params: { kind: "readyPosition", seconds: 1.35 } },
    { name: "racket", params: { kind: "splitStep", seconds: 1.35 } },
    { name: "athletics", params: { seconds: 2 } },
  ]),
]);

const GYMNASTICS: IPlaygroundComposition = scene("gymnastics-floor", [
  person("uma", "f1", -1, 0, 0, [
    { name: "gymnastics", params: { seconds: 1.5 } },
    { name: "cartwheelRight", params: {} },
    { name: "stand", params: { seconds: 0.3 } },
    { name: "forwardRoll", params: {} },
    { name: "kneel", params: { kind: "both", hold: 0.5 } },
  ]),
  person("vic", "m1", 1, 0, 0, [
    { name: "forwardRoll", params: {} },
    { name: "backwardRoll", params: {} },
    { name: "gymnastics", params: { seconds: 1 } },
    { name: "crawl", params: { cycles: 2 } },
  ]),
]);

const POOL: IPlaygroundComposition = scene("pool", [
  person("wil", "m2", -0.8, 0, 0, [
    { name: "swim", params: { kind: "frontCrawl", cycles: 6 } },
    { name: "swim", params: { kind: "treadWater", cycles: 1 } },
    { name: "swim", params: { kind: "backstroke", cycles: 4 } },
  ]),
  person("xia", "f2", 0.8, 0, 0, [
    { name: "swim", params: { kind: "treadWater", cycles: 2 } },
    { name: "swim", params: { kind: "breaststroke", cycles: 5 } },
    { name: "swim", params: { kind: "frontCrawl", cycles: 4 } },
  ]),
]);

/** The sport scenes master's vocabulary plays. */
export const SCENES_SPORT: readonly IScene[] = [
  {
    id: "warm-up",
    title: "Park warm-up",
    summary:
      "Four people warm up: one jogs out and back and runs butt kicks and high knees; one squats and lunges on each leg; one does jumping jacks, a jump forward, high knees and more jacks; one stretches the quadriceps and the side and runs high knees.",
    setting: "sport",
    cast: [
      { subject: "jo", role: "jogger" },
      { subject: "kim", role: "squats" },
      { subject: "lou", role: "jumping jacks" },
      { subject: "mo", role: "stretches" },
    ],
    composition: WARM_UP,
    takes: SceneTakes.of(WARM_UP),
    camera: { view: "three-quarter" },
    needs: [],
    featured: 3,
  },
  {
    id: "dance-circle",
    title: "Dance circle",
    summary:
      "Three dancers face each other in a circle and bounce, sway and step-touch to one tempo, each in another order, then all box-step together.",
    setting: "sport",
    cast: [
      { subject: "ny", role: "dancer" },
      { subject: "ol", role: "dancer" },
      { subject: "pia", role: "dancer" },
    ],
    composition: DANCE_CIRCLE,
    takes: SceneTakes.of(DANCE_CIRCLE),
    camera: { view: "three-quarter" },
    needs: [],
    featured: 4,
  },
  {
    id: "court-drills",
    title: "Court drills",
    summary:
      "Four players drill side by side in repeated sets: dribbles each ended by a throw-in, volleyball sets alternating with digs, a catcher's crouch alternating with a fielder's crouch for a ground ball, and a racket's ready position and split step twice before an athlete's set.",
    setting: "sport",
    cast: [
      { subject: "quin", role: "basketball and football" },
      { subject: "rae", role: "volleyball" },
      { subject: "sol", role: "baseball" },
      { subject: "tam", role: "tennis and athletics" },
    ],
    composition: COURT,
    takes: SceneTakes.of(COURT),
    camera: { view: "front" },
    needs: [],
  },
  {
    id: "gymnastics-floor",
    title: "Gymnastics floor",
    summary:
      "Two gymnasts work the floor: one holds a handstand, cartwheels, rolls forward and kneels on both knees and rises; the other rolls forward and backward, holds a handstand and crawls on all fours.",
    setting: "sport",
    cast: [
      { subject: "uma", role: "gymnast" },
      { subject: "vic", role: "gymnast" },
    ],
    composition: GYMNASTICS,
    takes: SceneTakes.of(GYMNASTICS),
    camera: { view: "side" },
    needs: [],
  },
  {
    id: "pool",
    title: "Pool lanes",
    summary:
      "Two swimmers in neighbouring lanes: one swims front crawl, treads water for a breath and turns onto the back for backstroke; the other treads water, swims breaststroke and picks up into front crawl.",
    setting: "sport",
    cast: [
      { subject: "wil", role: "swimmer" },
      { subject: "xia", role: "swimmer" },
    ],
    composition: POOL,
    takes: SceneTakes.of(POOL),
    camera: { view: "three-quarter" },
    needs: [],
  },
];
