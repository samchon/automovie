import type { IScene } from "../structures/IScene";
import { SceneBuild } from "./SceneBuild";

const { act, object, person, scene }: typeof SceneBuild = SceneBuild;

/** The combat scenes of the lexicon's blade, sword, melee and firearm-handling rows: two drills and a handgun drawn, reloaded and put back. */
export const SCENES_BLADES: readonly IScene[] = [
  scene(
    {
      id: "sword-drill",
      title: "Sword drill",
      summary:
        "Two fencers drill side by side: a draw, cuts and slashes, a thrust and a stab, a backslash, a traverse, a beat and a disengage, then a guard, a parry and a sword thrust.",
      setting: "combat",
      roles: { ari: "fencer", ben: "fencer" },
      needs: [],
    },
    "sword-drill",
    [
      person("ari", "m1", -0.8, 0, 0, [
        act("draw"),
        act("cut"),
        act("slash"),
        act("thrust"),
        act("stab"),
        act("backslash"),
        act("traverse"),
      ]),
      person("ben", "f1", 0.8, 0, 0, [
        act("swordGuard"),
        act("beat"),
        act("disengage"),
        act("swordCut"),
        act("swordParry"),
        act("swordThrust"),
      ]),
    ],
  ),
  scene(
    {
      id: "knife-drill",
      title: "Knife and club drill",
      summary:
        "Two trainees run their drill: a knife slash and backslash, a stab and an overhand stab, and a club strike.",
      setting: "combat",
      roles: { cal: "trainee", dee: "trainee" },
      needs: [],
    },
    "knife-drill",
    [
      person("cal", "m2", -0.8, 0, 0, [
        act("knifeSlash"),
        act("knifeBackslash"),
        act("knifeStab"),
      ]),
      person("dee", "f2", 0.8, 0, 0, [act("stabOverhand"), act("clubStrike")]),
    ],
  ),
  scene(
    {
      id: "range-counter",
      title: "At the range counter",
      summary:
        "A shooter takes a handgun from the range counter by its grip, the bore along the forearm, and lays it back down.",
      setting: "combat",
      roles: { eve: "shooter" },
      needs: [],
    },
    "range-counter",
    [
      person("eve", "m2", 0, 0.12, 0, [
        act("drawFirearm", { prop: "gun" }),
        act("stand", { seconds: 1 }),
        act("holsterFirearm", {
          prop: "gun",
          at: { x: -0.18, y: 0.91, z: 0.42 },
        }),
      ]),
    ],
    [
      object("counter", "createTable", "counter", 0, 0.65, 180),
      object("gun", "createHandgun", "compact", -0.18, 0.42, 0, 0.91),
    ],
  ),
];
