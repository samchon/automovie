import type { IScene } from "../structures/IScene";
import { SceneBuild } from "./SceneBuild";
import { SceneTakes } from "./SceneTakes";

const { person, to }: typeof SceneBuild = SceneBuild;

/** A composition of people only. */
function scene(
  seed: string,
  performers: SceneBuild.Performer[],
): SceneBuild.Composition {
  return { version: 1, seed, performers, mutuals: [] };
}

const WARM_UP: SceneBuild.Composition = scene("warm-up", [
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

const DANCE_CIRCLE: SceneBuild.Composition = scene("dance-circle", [
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

const COURT: SceneBuild.Composition = scene("court", [
  person("quin", "m2", -2.2, 0, 0, [
    { name: "ballSport", params: { kind: "dribble", count: 8 } },
    { name: "ballSport", params: { kind: "throwIn" } },
    { name: "ballSport", params: { kind: "dribble", count: 8 } },
    { name: "ballSport", params: { kind: "throwIn" } },
  ]),
  person("rae", "f1", -0.7, 0, 0, [
    ...[0, 1, 2, 3].flatMap((): SceneBuild.Action[] => [
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

const GYMNASTICS: SceneBuild.Composition = scene("gymnastics-floor", [
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

const POOL: SceneBuild.Composition = scene("pool", [
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
      "Four people warm up: jogging, squats and lunges, jumping jacks, stretches and high knees.",
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
      "Three dancers in a circle bounce, sway and step-touch in turn, then box-step together.",
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
      "Four players drill side by side: dribbles, sets and digs, fielding and tennis footwork.",
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
      "Two gymnasts work the floor with holds, rolls, a cartwheel, a kneel and a crawl.",
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
      "Two swimmers switch strokes: crawl to backstroke, and breaststroke to crawl.",
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
