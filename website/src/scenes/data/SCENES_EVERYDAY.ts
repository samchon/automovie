import type { IPlaygroundComposition } from "../../playground/structures/IPlaygroundComposition";
import type { IScene } from "../structures/IScene";
import { SceneTakes } from "./SceneTakes";

/** A region of another person, as a motion target. */
function at(subject: string, region: string): Record<string, unknown> {
  return { kind: "person", subject, region };
}

/** A floor point, as a destination. */
function to(x: number, z: number): Record<string, number> {
  return { x, y: 0, z };
}

const MEETING: IPlaygroundComposition = {
  version: 1,
  seed: "meeting",
  performers: [
    {
      subject: "ana",
      body: "f1",
      x: 0,
      z: -0.6,
      yaw: 0,
      proficiency: "trained",
      actions: [
        { name: "walk", params: { to: to(0, 1.25) } },
        { name: "stand", params: { seconds: 0.6 } },
        { name: "handshake", params: { partner: "ben" } },
        { name: "gesture", params: { kind: "palmsUp" } },
        { name: "highFive", params: { partner: "ben" } },
        {
          name: "look",
          params: { target: at("cal", "face"), cue: "signal", seconds: 1 },
        },
        { name: "gesture", params: { kind: "wave" } },
        { name: "stand", params: { seconds: 1 } },
      ],
    },
    {
      subject: "ben",
      body: "m1",
      x: 0,
      z: 2.2,
      yaw: 180,
      proficiency: "trained",
      actions: [
        { name: "look", params: { target: at("ana", "face"), seconds: 2.4 } },
        { name: "handshake", params: { partner: "ana" } },
        { name: "gesture", params: { kind: "nod" } },
        { name: "highFive", params: { partner: "ana" } },
        { name: "gesture", params: { kind: "shrug" } },
        {
          name: "look",
          params: { target: at("cal", "face"), cue: "signal", seconds: 1 },
        },
        { name: "stand", params: { seconds: 1 } },
      ],
    },
    {
      subject: "cal",
      body: "m2",
      x: 2.4,
      z: -1.5,
      yaw: 0,
      proficiency: "trained",
      actions: [
        {
          name: "approach",
          params: { target: at("ben", "face"), at: "social" },
        },
        { name: "gesture", params: { kind: "wave" } },
        { name: "rest", params: { left: "pocket", right: "hip", seconds: 2 } },
      ],
    },
  ],
  mutuals: [],
};

const FALL: IPlaygroundComposition = {
  version: 1,
  seed: "fall",
  performers: [
    {
      subject: "dee",
      body: "m1",
      x: 0,
      z: 0,
      yaw: 0,
      proficiency: "trained",
      actions: [
        { name: "walk", params: { to: to(0, 1) } },
        { name: "stagger", params: { speed: 1.2 } },
        { name: "knockdown", params: { seconds: 1 } },
        { name: "crawl", params: { cycles: 2 } },
      ],
    },
    {
      subject: "eve",
      body: "f2",
      x: 1.6,
      z: 1.2,
      yaw: 270,
      proficiency: "trained",
      actions: [
        { name: "stand", params: { seconds: 1.2 } },
        { name: "brace", params: { kind: "impact", seconds: 0.6 } },
        { name: "crouch", params: { hold: 1 } },
        { name: "kneel", params: { kind: "one", hold: 1.2 } },
        {
          name: "touch",
          params: { target: { kind: "self", region: "hipRight" } },
        },
        {
          name: "wipe",
          params: {
            on: {
              kind: "point",
              at: { x: -0.15, y: 0.85, z: 0.3 },
              frame: "performer",
            },
            cycles: 2,
          },
        },
      ],
    },
  ],
  mutuals: [],
};

/** Every site body standing side by side, for the Human page's lineup. */
const LINEUP: IPlaygroundComposition = {
  version: 1,
  seed: "lineup",
  performers: ["f1", "f2", "m1", "m2"].map(
    (body: string, index: number): IPlaygroundComposition.IPerformer => ({
      subject: body,
      body,
      x: (index - 1.5) * 0.9,
      z: 0,
      yaw: 0,
      proficiency: "trained",
      actions: [{ name: "stand", params: { seconds: 2 } }],
    }),
  ),
  mutuals: [],
};

/** The everyday scenes master's vocabulary plays. */
export const SCENES_EVERYDAY: readonly IScene[] = [
  {
    id: "meeting",
    title: "Meeting in a square",
    summary:
      "One person walks up to another; they shake hands, high-five and talk with their hands; a third walks up, waves and rests a hand in a pocket and one on the hip.",
    setting: "everyday",
    cast: [
      { subject: "ana", role: "friend" },
      { subject: "ben", role: "friend" },
      { subject: "cal", role: "passer-by" },
    ],
    composition: MEETING,
    takes: SceneTakes.of(MEETING),
    camera: { view: "three-quarter" },
    needs: [],
    featured: 1,
  },
  {
    id: "fall-and-rise",
    title: "A fall",
    summary:
      "One person staggers, goes down and crawls away; another braces, crouches and kneels, then rises, rests a hand on her hip and wipes down an imagined counter.",
    setting: "everyday",
    cast: [
      { subject: "dee", role: "the one who falls" },
      { subject: "eve", role: "helper" },
    ],
    composition: FALL,
    takes: SceneTakes.of(FALL),
    camera: { view: "three-quarter" },
    needs: [],
  },
  {
    id: "lineup",
    title: "The site's bodies",
    summary: "Every body the site performs with, standing side by side.",
    setting: "everyday",
    cast: LINEUP.performers.map(
      (performer: IPlaygroundComposition.IPerformer): IScene.ICast => ({
        subject: performer.subject,
        role: performer.body,
      }),
    ),
    composition: LINEUP,
    takes: [{ label: "Standing" }],
    camera: { view: "front" },
    needs: [],
    hidden: true,
  },
];
