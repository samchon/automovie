import type { IScene } from "../structures/IScene";
import { SceneBuild } from "./SceneBuild";

const { act, object, person, scene, sheathed }: typeof SceneBuild = SceneBuild;

/** The range-counter shooter's mark downrange: a point at chest height ten metres ahead, world. */
const DOWNRANGE: Record<string, unknown> = {
  kind: "point",
  at: { x: 0, y: 1.4, z: 10 },
  frame: "world",
};

/** The combat scenes of the lexicon's blade, sword, melee and firearm-handling rows: two drills and a handgun drawn, reloaded and put back. */
export const SCENES_BLADES: readonly IScene[] = [
  scene(
    {
      id: "sword-drill",
      title: "Sword drill",
      summary:
        "Two fencers take their swords from the hip and drill side by side. The first runs a rising draw cut, a cut and a slash, a thrust and a stab, a backslash and a traverse, then rises to the roof, cuts down and slashes back, retreats and settles in the fool's guard. The second takes a guard, beats, disengages, cuts, parries and thrusts, retreats into the roof, cuts down, advances, parries and disengages, slashes, retreats and settles in the fool's guard.",
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
        act("vomTag", { blade: "swordA", seconds: 0.6 }),
        act("cut", { blade: "swordA" }),
        act("backslash", { blade: "swordA" }),
        act("retreat"),
        act("alber", { blade: "swordA", seconds: 0.6 }),
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
        act("retreat"),
        act("vomTag", { blade: "swordB", seconds: 0.6 }),
        act("cut", { blade: "swordB" }),
        act("advance"),
        act("parry", { blade: "swordB" }),
        act("disengage", { blade: "swordB" }),
        act("slash", { blade: "swordB" }),
        act("retreat"),
        act("alber", { blade: "swordB", seconds: 0.6 }),
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
        "Two trainees draw their blades from the hip and drill in combinations with footwork. The knife comes to guard, then is slashed, slashed back and stabbed; it advances on a slash and a stab, traverses on a backslash and a stab, retreats twice on slashes and stabs, advances on a backslash, a stab and a slash, and returns to guard. The dagger, taken point down, stabs overhand while the free hand's club stroke, mimed, comes down from overhead; the pair repeats on two advances, a traverse and two retreats, the free hand swinging across at the end.",
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
        act("enGarde", { blade: "knife", seconds: 0.6 }),
        act("knifeSlash", { blade: "knife" }),
        act("knifeBackslash", { blade: "knife" }),
        act("knifeStab", { blade: "knife" }),
        act("advance"),
        act("knifeSlash", { blade: "knife" }),
        act("knifeStab", { blade: "knife" }),
        act("traverse"),
        act("knifeBackslash", { blade: "knife" }),
        act("knifeStab", { blade: "knife" }),
        act("retreat"),
        act("knifeSlash", { blade: "knife" }),
        act("knifeBackslash", { blade: "knife" }),
        act("knifeStab", { blade: "knife" }),
        act("retreat"),
        act("knifeSlash", { blade: "knife" }),
        act("knifeStab", { blade: "knife" }),
        act("advance"),
        act("knifeBackslash", { blade: "knife" }),
        act("knifeStab", { blade: "knife" }),
        act("knifeSlash", { blade: "knife" }),
        act("enGarde", { blade: "knife", seconds: 1 }),
      ]),
      person("dee", "f2", 0.8, 0, 0, [
        act("pickUp", {
          prop: "dagger",
          handle: "reverseGrip",
          use: SceneBuild.BLADE_USE,
        }),
        act("stabOverhand", { blade: "dagger" }),
        act("clubStrike", { hand: "left" }),
        act("advance"),
        act("stabOverhand", { blade: "dagger" }),
        act("clubStrike", { hand: "left" }),
        act("stabOverhand", { blade: "dagger" }),
        act("traverse"),
        act("clubStrike", { hand: "left" }),
        act("stabOverhand", { blade: "dagger" }),
        act("clubStrike", { hand: "left" }),
        act("retreat"),
        act("stabOverhand", { blade: "dagger" }),
        act("clubStrike", { hand: "left" }),
        act("stabOverhand", { blade: "dagger" }),
        act("retreat"),
        act("stabOverhand", { blade: "dagger" }),
        act("clubStrike", { hand: "left" }),
        act("advance"),
        act("stabOverhand", { blade: "dagger" }),
        act("clubStrike", { hand: "left" }),
        act("stabOverhand", { blade: "dagger" }),
        act("clubStrike", { hand: "left" }),
        act("stabOverhand", { blade: "dagger" }),
        act("clubSwing", { hand: "left" }),
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
        "A shooter takes a handgun from the range counter by its grip, the bore along the forearm, and runs a string downrange: low ready, an aim and a pair of shots, high ready, an aim and two more pairs, a scan at low ready, an aim and a last pair; then lays the gun back down.",
      setting: "combat",
      roles: { eve: "shooter" },
      needs: [],
    },
    "range-counter",
    [
      person("eve", "m2", 0, 0.12, 0, [
        act("drawFirearm", { prop: "gun" }),
        act("lowReady", { gun: "gun" }),
        act("takeAim", { gun: "gun", target: DOWNRANGE }),
        act("recoil", { gun: "gun" }),
        act("recoil", { gun: "gun" }),
        act("highReady", { gun: "gun", seconds: 1 }),
        act("takeAim", { gun: "gun", target: DOWNRANGE }),
        act("recoil", { gun: "gun" }),
        act("recoil", { gun: "gun" }),
        act("recoil", { gun: "gun" }),
        act("recoil", { gun: "gun" }),
        act("lowReady", { gun: "gun" }),
        act("takeAim", { gun: "gun", target: DOWNRANGE }),
        act("recoil", { gun: "gun" }),
        act("recoil", { gun: "gun" }),
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
