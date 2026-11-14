import type { IScene } from "../structures/IScene";
import { SceneBuild } from "./SceneBuild";

const { act, object, person, scene, sheathed }: typeof SceneBuild = SceneBuild;

/** The combat scenes of the lexicon's blade, sword, melee and firearm-handling rows: two drills and a handgun drawn, reloaded and put back. */
export const SCENES_BLADES: readonly IScene[] = [
  scene(
    {
      id: "sword-drill",
      title: "Sword drill",
      summary:
        "Two fencers take their swords from the hip and drill side by side: a rising draw cut, a cut and a slash, a thrust and a stab, a backslash and a traverse; a guard, a beat and a disengage, a cut, a parry and a thrust.",
      setting: "combat",
      roles: { ari: "fencer", ben: "fencer" },
      needs: [],
    },
    "sword-drill",
    [
      person("ari", "m1", -0.8, 0, 0, [
        act("pickUp", {
          prop: "swordA",
          handle: "grip",
          use: SceneBuild.BLADE_USE,
        }),
        act("draw", { blade: "swordA" }),
        act("cut", { blade: "swordA" }),
        act("slash", { blade: "swordA" }),
        act("thrust", { blade: "swordA" }),
        act("stab", { blade: "swordA" }),
        act("backslash", { blade: "swordA" }),
        act("traverse"),
      ]),
      person("ben", "f1", 0.8, 0, 0, [
        act("pickUp", {
          prop: "swordB",
          handle: "grip",
          use: SceneBuild.BLADE_USE,
        }),
        act("swordGuard", { blade: "swordB" }),
        act("beat", { blade: "swordB" }),
        act("disengage", { blade: "swordB" }),
        act("swordCut", { blade: "swordB" }),
        act("swordParry", { blade: "swordB" }),
        act("swordThrust", { blade: "swordB" }),
      ]),
    ],
    [
      sheathed("swordA", "armingSword", "ari", "left"),
      sheathed("swordB", "longsword", "ben", "left"),
    ],
  ),
  scene(
    {
      id: "knife-drill",
      title: "Knife drill",
      summary:
        "Two trainees draw their blades from the hip: a knife slashed, slashed back and stabbed; a dagger taken point down for an overhand stab, then a club stroke with the free hand brought down from overhead, mimed.",
      setting: "combat",
      roles: { cal: "trainee", dee: "trainee" },
      needs: [],
    },
    "knife-drill",
    [
      person("cal", "m2", -0.8, 0, 0, [
        act("pickUp", {
          prop: "knife",
          handle: "grip",
          use: SceneBuild.BLADE_USE,
        }),
        act("knifeSlash", { blade: "knife" }),
        act("knifeBackslash", { blade: "knife" }),
        act("knifeStab", { blade: "knife" }),
      ]),
      person("dee", "f2", 0.8, 0, 0, [
        act("pickUp", {
          prop: "dagger",
          handle: "reverseGrip",
          use: SceneBuild.BLADE_USE,
        }),
        act("stabOverhand", { blade: "dagger" }),
        act("clubStrike", { hand: "left" }),
      ]),
    ],
    [
      sheathed("knife", "knife", "cal", "right"),
      sheathed("dagger", "dagger", "dee", "right"),
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
          at: { x: -0.18, y: SceneBuild.COUNTER_TOP, z: 0.42 },
        }),
      ]),
    ],
    [
      object("counter", "createTable", "counter", 0, 0.65, 180),
      object(
        "gun",
        "createHandgun",
        "compact",
        -0.18,
        0.42,
        0,
        SceneBuild.COUNTER_TOP,
      ),
    ],
  ),
  scene(
    {
      id: "reload-drill",
      title: "Reload drill",
      summary:
        "A shooter takes a handgun from the range counter, presses the support palm once to the magazine well and lays the gun back down.",
      setting: "combat",
      roles: { fil: "shooter" },
      needs: [],
      refusedUntil: 3528,
    },
    "reload-drill",
    [
      person("fil", "m2", 0, 0.12, 0, [
        act("drawFirearm", { prop: "gun" }),
        act("reloadFirearm", {
          target: { kind: "prop", subject: "gun", point: "magazine" },
        }),
        act("holsterFirearm", {
          prop: "gun",
          at: { x: -0.18, y: SceneBuild.COUNTER_TOP, z: 0.42 },
        }),
      ]),
    ],
    [
      object("counter", "createTable", "counter", 0, 0.65, 180),
      object(
        "gun",
        "createHandgun",
        "compact",
        -0.18,
        0.42,
        0,
        SceneBuild.COUNTER_TOP,
      ),
    ],
  ),
];
