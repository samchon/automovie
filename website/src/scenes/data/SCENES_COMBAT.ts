import type { IPlaygroundComposition } from "../../playground/structures/IPlaygroundComposition";
import type { IScene } from "../structures/IScene";
import { SceneTakes } from "./SceneTakes";

/** A region of another person, as a motion target. */
function at(subject: string, region: string): Record<string, unknown> {
  return { kind: "person", subject, region };
}

const SPARRING: IPlaygroundComposition = {
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
        },
        { name: "guard", params: { seconds: 0.6, facing: at("blue", "face") } },
        {
          name: "punch",
          params: {
            technique: "hook",
            hand: "lead",
            at: at("blue", "jawRight"),
          },
        },
        { name: "clinch", params: { partner: "blue" } },
        { name: "knee", params: { at: at("blue", "abdomen") } },
        { name: "step", params: { direction: "back", steps: 1 } },
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
        {
          name: "flinch",
          params: { from: at("red", "sternum"), intensity: 0.6 },
        },
        { name: "guard", params: { seconds: 0.4, facing: at("red", "face") } },
        {
          name: "punch",
          params: {
            technique: "straight",
            hand: "rear",
            at: at("red", "face"),
          },
        },
        { name: "step", params: { direction: "left", steps: 1 } },
        { name: "guard", params: { seconds: 1, facing: at("red", "face") } },
      ],
    },
  ],
  mutuals: [],
};

const DOJO: IPlaygroundComposition = {
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
      actions: [
        { name: "martialArt", params: { kind: "horseStance", seconds: 1 } },
        { name: "martialArt", params: { kind: "chokuZuki", count: 2 } },
        { name: "gesture", params: { kind: "bow" } },
        { name: "martialArt", params: { kind: "taiChiPush", count: 1 } },
      ],
    },
    {
      subject: "student",
      body: "f1",
      x: -0.9,
      z: 0,
      yaw: 0,
      proficiency: "amateur",
      actions: [
        { name: "gesture", params: { kind: "bow" } },
        { name: "martialArt", params: { kind: "horseStance", seconds: 1 } },
        { name: "martialArt", params: { kind: "chokuZuki", count: 2 } },
        { name: "martialArt", params: { kind: "taiChiPush", count: 1 } },
      ],
    },
    {
      subject: "beginner",
      body: "m1",
      x: 0.9,
      z: 0,
      yaw: 0,
      proficiency: "novice",
      actions: [
        { name: "gesture", params: { kind: "bow" } },
        { name: "martialArt", params: { kind: "horseStance", seconds: 1 } },
        { name: "martialArt", params: { kind: "chokuZuki", count: 2 } },
        { name: "martialArt", params: { kind: "taiChiPush", count: 1 } },
      ],
    },
  ],
  mutuals: [],
};

/** The combat scenes master's vocabulary plays. */
export const SCENES_COMBAT: readonly IScene[] = [
  {
    id: "sparring",
    title: "Sparring",
    summary:
      "Two kickboxers trade straights, a hook and a round kick; one parries and slips, flinches and answers.",
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
      "A teacher leads two students of different skill through a bow, a horse stance, straight punches and a push, each at their own skill.",
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
