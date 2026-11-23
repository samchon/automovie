import type { IScene } from "../structures/IScene";
import { SceneBuild } from "./SceneBuild";
import { SceneTakes } from "./SceneTakes";

const { at, to }: typeof SceneBuild = SceneBuild;

const MEETING: SceneBuild.Composition = {
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
        { name: "stand", params: { hold: 0.6 } },
        {
          name: "handshake",
          params: { partner: "ben" },
          anchor: "mt-shake",
        },
        { name: "gesture", params: { kind: "palmsUp" } },
        { name: "highFive", params: { partner: "ben" } },
        {
          name: "look",
          params: { target: at("cal", "face"), cue: "signal", duration: 1 },
          anchor: "mt-look",
        },
        { name: "gesture", params: { kind: "wave" } },
        { name: "gesture", params: { kind: "nod" } },
        { name: "gesture", params: { kind: "palmsUp" } },
        { name: "stand", params: { hold: 0.6 } },
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
        { name: "look", params: { target: at("ana", "face"), duration: 0.8 } },
        { name: "gesture", params: { kind: "nod" } },
        { name: "stand", params: { hold: 2 } },
        {
          name: "handshake",
          params: { partner: "ana" },
          sync: { of: "mt-shake", event: "clasp", align: "clasp" },
        },
        { name: "gesture", params: { kind: "nod" } },
        { name: "highFive", params: { partner: "ana" } },
        { name: "gesture", params: { kind: "shrug" } },
        {
          name: "look",
          params: { target: at("cal", "face"), cue: "signal", duration: 1 },
        },
        { name: "gesture", params: { kind: "raiseHand" } },
        { name: "gesture", params: { kind: "nod" } },
        { name: "gesture", params: { kind: "shrug" } },
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
        { name: "checkPhone", params: { hold: 1.5 } },
        {
          name: "approach",
          params: { target: at("ben", "face"), at: "social" },
        },
        { name: "stand", params: { hold: 3 } },
        {
          name: "gesture",
          params: { kind: "wave" },
          sync: {
            of: "mt-look",
            event: "start",
            align: "strokeStart",
            offset: -0.2,
          },
        },
        {
          name: "rest",
          params: { left: "pocket", right: "hip", hold: 1.4 },
        },
        { name: "gesture", params: { kind: "palmsUp" } },
        { name: "gesture", params: { kind: "nod" } },
      ],
    },
  ],
  mutuals: [],
};

const FALL: SceneBuild.Composition = {
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
        // The swapped body's recovery limit on this approach is 0.85 m/s.
        { name: "stagger", params: { speed: 0.8 } },
        { name: "knockdown", params: { hold: 1 } },
        { name: "getUp", params: {} },
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
        { name: "stand", params: { hold: 1.2 } },
        { name: "brace", params: { kind: "impact", hold: 0.6 } },
        { name: "crouch", params: { hold: 1 } },
        { name: "kneel", params: { kind: "one", hold: 1.2 } },
        {
          name: "touch",
          params: {
            target: { kind: "self", region: "hipRight" },
            // A lower aim lets the palm close against the hip on both bodies.
            site: { up: -0.035 },
            hand: "right",
            kind: "hold",
          },
        },
        {
          name: "wipe",
          params: {
            on: {
              kind: "point",
              at: { x: -0.15, y: 0.85, z: 0.3 },
              frame: "performer",
            },
            count: 2,
          },
        },
      ],
    },
  ],
  mutuals: [],
};

/** Every site body standing side by side, for the Human page's lineup. */
const LINEUP: SceneBuild.Composition = {
  version: 1,
  seed: "lineup",
  performers: ["f1", "f2", "m1", "m2"].map(
    (body: string, index: number): SceneBuild.Performer => ({
      subject: body,
      body,
      x: (index - 1.5) * 0.9,
      z: 0,
      yaw: 0,
      proficiency: "trained",
      actions: [{ name: "stand", params: { hold: 2 } }],
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
      "Two friends shake hands and high-five; a third walks over, waves and joins the chat.",
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
      "One person staggers, goes down and gets back up; another braces, crouches and kneels, then rises, rests a hand on her hip and wipes down an imagined counter.",
    setting: "everyday",
    cast: [
      { subject: "dee", role: "the one who falls" },
      { subject: "eve", role: "bystander" },
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
      (performer: SceneBuild.Performer): IScene.ICast => ({
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
