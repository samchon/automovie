import type { IScene } from "../structures/IScene";
import { SceneBuild } from "./SceneBuild";

const { act, at, object, person, scene, to }: typeof SceneBuild = SceneBuild;

/** The sport scenes of the lexicon's football, throwing, gymnastics and swimming rows. */
export const SCENES_FIELD: readonly IScene[] = [
  scene(
    {
      id: "five-a-side",
      title: "Five-a-side",
      summary:
        "A small-sided game: a throw-in, a header, a chest and a thigh trap, a dribble and a left-footed shot the keeper dives right for, and a chest pass caught in both hands.",
      setting: "sport",
      roles: {
        ali: "winger",
        bea: "midfielder",
        cyr: "striker",
        dag: "goalkeeper",
      },
      needs: [],
    },
    "five-a-side",
    [
      person("ali", "m1", -3, 0, 90, [
        act("throwIn"),
        act("pushPass", { at: at("bea", "sternum") }, { anchor: "pass" }),
      ]),
      person("bea", "f1", 0, 0, 270, [
        act("header"),
        act("twoHandCatch", { from: "pass" }),
      ]),
      person("cyr", "m2", 0, 3, 0, [
        act("chestTrap"),
        act("thighTrap"),
        act("dribble"),
        act("kickLeft", { ball: at("cyr", "footTopLeft") }),
      ]),
      person("dag", "m1", 0, 11, 180, [
        act("readyPosition"),
        act("stand", { seconds: 0.3 }),
        act("goalkeeperDiveRight"),
      ]),
    ],
  ),
  scene(
    {
      id: "vault-hall",
      title: "Vault hall",
      summary:
        "Two gymnasts: a cartwheel and a round-off to the right, and a handspring vault over a box out of a run.",
      setting: "sport",
      roles: { eun: "gymnast", flo: "gymnast" },
      needs: [],
      view: "side",
    },
    "vault-hall",
    [
      person("eun", "f1", -3, -1.5, 90, [
        act("cartwheelRight"),
        act("roundOffRight"),
      ]),
      person("flo", "f2", -4, 1, 90, [
        act("run", { to: to(-1.2, 1), pace: "run" }),
        act("handspringVault", { on: "box" }),
      ]),
    ],
    [object("box", "createPlyoBox", "wood", 0, 1, 90)],
  ),
  scene(
    {
      id: "swim-strokes",
      title: "Swim strokes",
      summary:
        "Three swimmers in the lexicon's strokes: breaststroke, backstroke and floating on the back, still without water forces.",
      setting: "sport",
      roles: { hed: "swimmer", ivo: "swimmer", jul: "swimmer" },
      needs: [],
    },
    "swim-strokes",
    [
      person("hed", "f1", -1.2, 0, 0, [act("breaststroke")]),
      person("ivo", "m1", 0, 0, 0, [act("backstroke")]),
      person("jul", "f2", 1.2, 0, 0, [act("floating")]),
    ],
  ),
];
