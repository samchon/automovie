import type { IScene } from "../structures/IScene";
import { SceneBuild } from "./SceneBuild";

const { act, at, person, scene }: typeof SceneBuild = SceneBuild;

/** The combat scenes of the lexicon's stage-fight family: slaps that miss on purpose, a poke and a lean away, a choke, a hold and a hair pull. */
export const SCENES_STAGE_FIGHT: readonly IScene[] = [
  scene(
    {
      id: "stage-slap",
      title: "Stage slap",
      summary:
        "Two actors rehearse: a stage slap the partner sells by turning the head at its instant, a backhand, and one poke in the chest that pushes the partner back, who then leans away.",
      setting: "combat",
      roles: { vic: "actor", wyn: "actor" },
      needs: [],
      view: "side",
    },
    "stage-slap",
    [
      person("vic", "m1", 0, 0, 0, [
        act(
          "stageSlap",
          { target: at("wyn", "cheekLeft") },
          { anchor: "slap" },
        ),
        act("backhand", { target: at("wyn", "cheekRight") }),
        act(
          "poke",
          { target: at("wyn", "chestLeft"), count: 1 },
          { anchor: "poke" },
        ),
      ]),
      person("wyn", "f1", 0, 0.6, 180, [
        act(
          "slapped",
          { from: at("vic", "palmRight") },
          { sync: { of: "slap" } },
        ),
        act(
          "pushed",
          { from: at("vic", "indexTipRight") },
          { sync: { of: "poke" } },
        ),
        act("leanBack", { from: at("vic", "palmRight") }),
      ]),
    ],
  ),
  scene(
    {
      id: "chokehold",
      title: "Chokehold",
      summary:
        "A staged strangle: both hands closed on the neck, and the victim's hands on the attacker's forearms.",
      setting: "combat",
      roles: { xia: "attacker", yan: "victim" },
      needs: [],
      refusedUntil: 3528,
      view: "side",
    },
    "chokehold",
    [
      person("xia", "m2", 0, 0, 0, [
        act("choke", {
          target: at("yan", "neckLeft"),
          other: at("yan", "neckRight"),
        }),
      ]),
      person("yan", "m1", 0, 0.5, 180, [
        act("struggle", {
          target: at("xia", "forearmLeft"),
          other: at("xia", "forearmRight"),
        }),
      ]),
    ],
  ),
  scene(
    {
      id: "scuffle",
      title: "Scuffle",
      summary:
        "A staged scuffle: one actor holds the other in a clinch, then takes a fistful of hair at the crown, and the other is pulled by it.",
      setting: "combat",
      roles: { zak: "attacker", abe: "victim" },
      needs: [],
      view: "side",
    },
    "scuffle",
    [
      person("zak", "m2", 0, 0, 0, [
        act("restrain", { partner: "abe" }),
        act("hairPull", { target: at("abe", "crown") }, { anchor: "pull" }),
      ]),
      person("abe", "m1", 0, 0.5, 180, [
        act("stand", { seconds: 6 }),
        act(
          "grabbed",
          { from: at("zak", "palmRight") },
          { sync: { of: "pull", event: "stroke" } },
        ),
      ]),
    ],
  ),
];
