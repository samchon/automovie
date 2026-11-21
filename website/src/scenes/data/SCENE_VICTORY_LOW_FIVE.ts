import type { IScene } from "../structures/IScene";
import { SceneBuild } from "./SceneBuild";

const { act, at, person, scene }: typeof SceneBuild = SceneBuild;

/** The celebration whose shared low five leads into the runner-up's thumbs-up. */
export const SCENE_VICTORY_LOW_FIVE: IScene = scene(
  {
    id: "victory-lap-low-five",
    title: "Victory lap with a low five",
    summary:
      "Three athletes celebrate: a fist pump, a victory pose and a low five, hands on the hips and a thumbs up, hands behind the head and a firm hand on the winner's shoulder.",
    setting: "sport",
    roles: { w1: "winner", w2: "runner-up", w3: "third" },
    needs: [],
  },
  "victory",
  [
    person("w1", "m1", 0, 0, 0, [
      act("fistPump"),
      act("victory"),
      act("lowFive", { partner: "w2" }),
    ]),
    person("w2", "f1", 0.72, 0.3, 300, [
      act("handsOnHips"),
      act("lowFive", { partner: "w1" }),
      act("thumbsUp"),
    ]),
    person("w3", "m2", -0.55, 0.05, 90, [
      act("handsBehindHead"),
      act("firmPress", { target: at("w1", "shoulderRight") }),
    ]),
  ],
);
