import type { IScene } from "../structures/IScene";
import { SceneBuild } from "./SceneBuild";
import { SceneTakes } from "./SceneTakes";

const { at }: typeof SceneBuild = SceneBuild;

const SPARRING: SceneBuild.Composition = {
  version: 1,
  seed: "sparring",
  performers: [
    {
      subject: "red",
      body: "m1",
      x: 0,
      z: 0,
      yaw: 0,
      proficiency: "trained",
      actions: [
        { name: "guard", params: { seconds: 0.8, facing: at("blue", "face") } },
        { name: "step", params: { direction: "forward", steps: 1 } },
        {
          name: "punch",
          params: {
            technique: "straight",
            hand: "lead",
            at: at("blue", "face"),
          },
          anchor: "jab",
        },
        {
          name: "punch",
          params: {
            technique: "straight",
            hand: "rear",
            at: at("blue", "chin"),
          },
          anchor: "cross",
        },
        {
          name: "kick",
          params: {
            technique: "round",
            leg: "rear",
            at: at("blue", "ribsLeft"),
          },
          anchor: "body",
        },
        {
          name: "guard",
          params: { seconds: 1.4, facing: at("blue", "face") },
          anchor: "shell",
        },
        { name: "step", params: { direction: "left", steps: 1 } },
        {
          name: "punch",
          params: {
            technique: "straight",
            hand: "lead",
            at: at("blue", "face"),
            feint: 0.5,
          },
        },
        {
          name: "kick",
          params: {
            technique: "round",
            leg: "rear",
            at: at("blue", "thighOuterLeft"),
          },
          anchor: "low",
        },
        {
          name: "punch",
          params: {
            technique: "hook",
            hand: "lead",
            at: at("blue", "jawRight"),
          },
          anchor: "hook",
        },
        {
          name: "punch",
          params: {
            technique: "uppercut",
            hand: "rear",
            at: at("blue", "chin"),
          },
          anchor: "upper",
        },
        { name: "clinch", params: { partner: "blue", hold: 0.3 } },
        {
          name: "knee",
          params: { at: at("blue", "abdomen") },
          anchor: "knee",
        },
        { name: "guard", params: { seconds: 1, facing: at("blue", "face") } },
        {
          name: "pushed",
          params: { from: at("blue", "soleRight") },
          anchor: "teeped",
        },
        { name: "step", params: { direction: "back", steps: 1 } },
        { name: "step", params: { direction: "right", steps: 2 } },
        { name: "guard", params: { seconds: 1, facing: at("blue", "face") } },
      ],
    },
    {
      subject: "blue",
      body: "m2",
      x: 0,
      z: 1.9,
      yaw: 180,
      proficiency: "trained",
      actions: [
        { name: "guard", params: { seconds: 1.2, facing: at("red", "face") } },
        { name: "defend", params: { kind: "parry", against: "jab" } },
        { name: "defend", params: { kind: "slip", against: "cross" } },
        { name: "defend", params: { kind: "elbowBlock", against: "body" } },
        {
          name: "punch",
          params: {
            technique: "straight",
            hand: "rear",
            at: at("red", "face"),
          },
          sync: { of: "shell", event: "set", offset: 0.2, align: "impact" },
        },
        {
          name: "punch",
          params: {
            technique: "hook",
            hand: "lead",
            at: at("red", "jawRight"),
          },
          sync: { of: "shell", event: "set", offset: 0.75, align: "impact" },
        },
        { name: "step", params: { direction: "right", steps: 1 } },
        { name: "defend", params: { kind: "check", against: "low" } },
        { name: "defend", params: { kind: "roll", against: "hook" } },
        { name: "defend", params: { kind: "cover", against: "upper" } },
        { name: "defend", params: { kind: "check", against: "knee" } },
        { name: "step", params: { direction: "back", steps: 1 } },
        {
          name: "kick",
          params: {
            technique: "push",
            leg: "lead",
            at: at("red", "abdomen"),
          },
          sync: { of: "teeped", event: "start", align: "impact" },
        },
        { name: "step", params: { direction: "left", steps: 2 } },
        { name: "guard", params: { seconds: 1, facing: at("red", "face") } },
      ],
    },
  ],
  mutuals: [],
};

const DOJO: SceneBuild.Composition = {
  version: 1,
  seed: "dojo",
  performers: [
    {
      subject: "sensei",
      body: "m2",
      x: 0,
      z: 2.2,
      yaw: 180,
      proficiency: "elite",
      actions: lesson(),
    },
    {
      subject: "student",
      body: "f1",
      x: -0.9,
      z: 0,
      yaw: 0,
      proficiency: "amateur",
      actions: lesson(),
    },
    {
      subject: "beginner",
      body: "m1",
      x: 0.9,
      z: 0,
      yaw: 0,
      proficiency: "novice",
      actions: lesson(),
    },
  ],
  mutuals: [],
};

/**
 * One class as the teacher and each student run it together: the bow in,
 * the horse stance, three straight punches, the tai chi push and the bow
 * out. The push runs at 2.1 times its natural rate, which keeps it slow
 * (about six seconds) and lets the class end with the bow.
 */
function lesson(): SceneBuild.Action[] {
  return [
    { name: "gesture", params: { kind: "bow" } },
    { name: "martialArt", params: { kind: "horseStance", seconds: 1 } },
    { name: "martialArt", params: { kind: "chokuZuki", count: 3 } },
    {
      name: "martialArt",
      params: { kind: "taiChiPush", manner: { pace: 2.1 } },
    },
    { name: "gesture", params: { kind: "bow" } },
  ];
}

/** The combat scenes master's vocabulary plays. */
export const SCENES_COMBAT: readonly IScene[] = [
  {
    id: "sparring",
    title: "Sparring",
    summary:
      "Two kickboxers trade punches and kicks with parries, checks and counters, then circle off.",
    setting: "combat",
    cast: [
      { subject: "red", role: "kickboxer" },
      { subject: "blue", role: "kickboxer" },
    ],
    composition: SPARRING,
    takes: SceneTakes.of(SPARRING),
    camera: { view: "side" },
    needs: [],
    featured: 2,
  },
  {
    id: "dojo",
    title: "Dojo",
    summary:
      "A teacher and two students bow in, hold a horse stance, punch, push and bow out.",
    setting: "combat",
    cast: [
      { subject: "sensei", role: "teacher" },
      { subject: "student", role: "student" },
      { subject: "beginner", role: "beginner" },
    ],
    composition: DOJO,
    takes: SceneTakes.of(DOJO, "elite"),
    camera: { view: "three-quarter" },
    needs: [],
  },
];
