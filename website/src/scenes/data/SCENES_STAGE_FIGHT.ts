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
        "Two actors rehearse a slap fight, each blow sold at its instant: a stage slap and a backhand turn the second actor's head, the first actor shrugs and takes a slap back, a poke in the chest pushes the second actor, the first actor leans away from a wild hook, a second stage slap and backhand land, and both give a thumbs up.",
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
          { anchor: "ss-slap" },
        ),
        act(
          "backhand",
          { target: at("wyn", "cheekRight") },
          { anchor: "ss-back" },
        ),
        act("dontKnow"),
        act("slapped", { from: at("wyn", "palmRight") }, { anchor: "ss-sold" }),
        act(
          "poke",
          { target: at("wyn", "chestLeft"), count: 1 },
          { anchor: "ss-poke" },
        ),
        act(
          "leanBack",
          { from: at("wyn", "handBackRight") },
          { anchor: "ss-lean" },
        ),
        act(
          "stageSlap",
          { target: at("wyn", "cheekLeft") },
          { anchor: "ss-slap2" },
        ),
        act(
          "backhand",
          { target: at("wyn", "cheekRight") },
          { anchor: "ss-back2" },
        ),
        act("thumbsUp"),
      ]),
      person("wyn", "f1", 0, 0.6, 180, [
        act(
          "slapped",
          { from: at("vic", "palmRight") },
          { sync: { of: "ss-slap" } },
        ),
        act(
          "slapped",
          { from: at("vic", "handBackRight") },
          { sync: { of: "ss-back" } },
        ),
        act(
          "stageSlap",
          { target: at("vic", "cheekLeft") },
          { sync: { of: "ss-sold", event: "start", align: "stroke" } },
        ),
        act(
          "pushed",
          { from: at("vic", "indexTipRight") },
          { sync: { of: "ss-poke" } },
        ),
        act(
          "rearHook",
          { at: at("vic", "jawLeft"), accuracy: "miss" },
          { sync: { of: "ss-lean", event: "stroke", align: "impact" } },
        ),
        act(
          "slapped",
          { from: at("vic", "palmRight") },
          { sync: { of: "ss-slap2" } },
        ),
        act(
          "slapped",
          { from: at("vic", "handBackRight") },
          { sync: { of: "ss-back2" } },
        ),
        act("thumbsUp"),
      ]),
    ],
  ),
  scene(
    {
      id: "chokehold",
      title: "Chokehold",
      summary:
        "A staged strangle: the attacker pokes the victim in the chest and grabs an arm while the victim holds up a palm, then closes both hands on the neck; the victim's hands come up to the attacker's forearms and shove him off; the attacker shakes a fist and leans away from the victim's slap.",
      setting: "combat",
      roles: { xia: "attacker", yan: "victim" },
      needs: [],
      view: "side",
    },
    "chokehold",
    [
      person("xia", "m2", 0, 0, 0, [
        act(
          "poke",
          { target: at("yan", "chestLeft"), count: 1 },
          { anchor: "ch-poke" },
        ),
        act(
          "grab",
          { target: at("yan", "upperArmRight") },
          { anchor: "ch-grab" },
        ),
        act(
          "choke",
          { target: at("yan", "neckLeft"), other: at("yan", "neckRight") },
          { anchor: "choke" },
        ),
        act("stand", { seconds: 1.4 }),
        act("pushed", { from: at("yan", "palmRight") }, { anchor: "ch-off" }),
        act("shakeFist"),
        act(
          "leanBack",
          { from: at("yan", "palmRight") },
          { anchor: "ch-lean" },
        ),
      ]),
      person("yan", "m1", 0, 0.5, 180, [
        act(
          "pushed",
          { from: at("xia", "indexTipRight") },
          { sync: { of: "ch-poke" } },
        ),
        act(
          "grabbed",
          { from: at("xia", "palmRight") },
          { sync: { of: "ch-grab" } },
        ),
        act("halt"),
        act(
          "struggle",
          {
            target: at("xia", "forearmLeft"),
            other: at("xia", "forearmRight"),
          },
          { sync: { of: "choke", event: "strokeStart" } },
        ),
        act(
          "shove",
          { target: at("xia", "chestLeft"), side: "right" },
          { sync: { of: "ch-off", event: "start", align: "stroke" } },
        ),
        act(
          "stageSlap",
          { target: at("xia", "cheekLeft") },
          { sync: { of: "ch-lean", event: "stroke", align: "stroke" } },
        ),
      ]),
    ],
  ),
  scene(
    {
      id: "scuffle",
      title: "Scuffle",
      summary:
        "A staged scuffle: the attacker grabs the victim's arm and ties him up in a clinch while the victim, wincing, fights the forearms; the attacker takes a fistful of hair at the crown and the victim is pulled by it, then shoves him off; the attacker shakes a fist, leans away from the victim's slap and shrugs.",
      setting: "combat",
      roles: { zak: "attacker", abe: "victim" },
      needs: [],
      view: "side",
    },
    "scuffle",
    [
      person("zak", "m2", 0, 0, 0, [
        act(
          "grab",
          { target: at("abe", "upperArmRight") },
          { anchor: "sc-grab" },
        ),
        act("clinch", { partner: "abe", hold: 1.5 }, { anchor: "sc-tie" }),
        act("hairPull", { target: at("abe", "crown") }, { anchor: "pull" }),
        act("pushed", { from: at("abe", "palmRight") }, { anchor: "sc-off" }),
        act("shakeFist"),
        act(
          "leanBack",
          { from: at("abe", "palmRight") },
          { anchor: "sc-lean" },
        ),
        act("dontKnow"),
      ]),
      person("abe", "m1", 0, 0.6, 180, [
        act(
          "grabbed",
          { from: at("zak", "palmRight") },
          { sync: { of: "sc-grab" } },
        ),
        act("wince"),
        act(
          "struggle",
          {
            target: at("zak", "forearmLeft"),
            other: at("zak", "forearmRight"),
          },
          { sync: { of: "sc-tie", event: "ready" } },
        ),
        act(
          "grabbed",
          { from: at("zak", "palmRight") },
          { sync: { of: "pull" } },
        ),
        act(
          "shove",
          { target: at("zak", "chestLeft"), side: "right" },
          { sync: { of: "sc-off", event: "start", align: "stroke" } },
        ),
        act(
          "stageSlap",
          { target: at("zak", "cheekLeft") },
          { sync: { of: "sc-lean", event: "stroke", align: "stroke" } },
        ),
      ]),
    ],
  ),
];
