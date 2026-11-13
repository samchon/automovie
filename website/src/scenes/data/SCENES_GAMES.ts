import type { IScene } from "../structures/IScene";
import { SceneBuild } from "./SceneBuild";

const { act, at, person, scene, to } = SceneBuild;

/** The sport scenes composed from the lexicon's sport families of #3392. */
export const SCENES_GAMES: readonly IScene[] = [
  scene(
    {
      id: "tennis-rally",
      title: "Tennis rally",
      summary:
        "Two players at the net and the baseline: a ready position, a split step, forehands, backhands, a volley and an overhead smash.",
      setting: "sport",
      roles: { ana: "baseline", bea: "net" },
      needs: [3392, 3479],
      view: "side",
    },
    "tennis",
    [
      person("ana", "f1", 0, 0, 0, [
        act("readyPosition"),
        act("splitStep"),
        act("forehand"),
        act("splitStep"),
        act("twoHandBackhand"),
        act("topspin"),
      ]),
      person("bea", "f2", 0, 6, 180, [
        act("readyPosition"),
        act("volley"),
        act("splitStep"),
        act("overheadSmash"),
        act("backhandDrive"),
      ]),
    ],
  ),
  scene(
    {
      id: "at-bat",
      title: "At bat",
      summary:
        "A pitcher pitches, the batter swings, checks a swing and bunts, the catcher crouches and catches, a fielder takes a grounder.",
      setting: "sport",
      roles: { pit: "pitcher", bat: "batter", cat: "catcher", fie: "fielder" },
      needs: [3392, 3479],
      view: "side",
    },
    "baseball",
    [
      person("pit", "m2", 0, 6, 180, [act("pitch", { at: at("cat", "palmLeft") }, { anchor: "pit" }), act("underarmPitch", { at: at("cat", "palmLeft") })]),
      person("bat", "m1", 0.6, 0.6, 270, [act("battingStance"), act("batSwing"), act("checkSwing"), act("bunt")]),
      person("cat", "f2", 0, 0, 0, [act("gloveCatch", { from: "pit" }), act("catcherCrouch", { seconds: 2 })]),
      person("fie", "f1", 3, 8, 200, [act("readyPosition"), act("fieldGrounder")]),
    ],
  ),
  scene(
    {
      id: "volleyball",
      title: "Volleyball",
      summary: "Four players at the net: a dig, a set, a spike and a bounce on the spot.",
      setting: "sport",
      roles: { v1: "libero", v2: "setter", v3: "hitter", v4: "blocker" },
      needs: [3392],
    },
    "volleyball",
    [
      person("v1", "f1", -1, -1, 0, [act("volleyDig", { count: 2 })]),
      person("v2", "f2", 0, 0, 0, [act("volleySet", { count: 2 })]),
      person("v3", "m1", 1, 0.2, 0, [act("bounce"), act("spike")]),
      person("v4", "m2", 0.5, 2, 180, [act("bounce"), act("defensiveSlide")]),
    ],
  ),
  scene(
    {
      id: "penalty",
      title: "Penalty",
      summary:
        "A kicker takes a penalty with either foot, the goalkeeper dives left and right, a defender slides in.",
      setting: "sport",
      roles: { kic: "kicker", kee: "goalkeeper", def: "defender" },
      needs: [3392, 3479],
    },
    "penalty",
    [
      person("kic", "m1", 0, 0, 0, [act("dash", { to: to(0, 1) }), act("kickRight", { ball: at("kic", "footTopRight") })]),
      person("kee", "m2", 0, 11, 180, [act("readyPosition"), act("stand", { seconds: 0.3 }), act("goalkeeperDiveLeft")]),
      person("def", "f1", 3, 3, 240, [act("stand", { seconds: 0.3 }), act("slidingTackle")]),
    ],
  ),
  scene(
    {
      id: "golf",
      title: "Golf",
      summary: "Two golfers: an address, a full swing and a putt.",
      setting: "sport",
      roles: { g1: "golfer", g2: "golfer" },
      needs: [3392],
    },
    "golf",
    [
      person("g1", "m1", -1, 0, 90, [act("golfAddress"), act("golfSwing")]),
      person("g2", "f1", 1, 1, 90, [act("golfAddress"), act("putt")]),
    ],
  ),
  scene(
    {
      id: "gymnastics-hall",
      title: "Gymnastics hall",
      summary:
        "Three gymnasts: cartwheels, a round-off and a front handspring, saltos, rolls, a handstand and a leap.",
      setting: "sport",
      roles: { g1: "gymnast", g2: "gymnast", g3: "gymnast" },
      needs: [3392, 3426],
      view: "side",
    },
    "gymnastics",
    [
      person("g1", "f1", -3, -1, 90, [act("cartwheelLeft"), act("roundOffLeft"), act("frontHandspring")]),
      person("g2", "f2", -3, 1, 90, [act("forwardRoll"), act("backwardRoll"), act("handstand")]),
      person("g3", "m1", -3, 3, 90, [act("leap", { to: to(-1.5, 3) }), act("backSalto", { to: to(-1.5, 3) }), act("frontSalto", { to: to(0, 3) })]),
    ],
  ),
  scene(
    {
      id: "high-jump",
      title: "Jump drills",
      summary: "Two athletes drill their run-up: A-skips and B-skips, butt kicks and high knees, a leap and a dash.",
      setting: "sport",
      roles: { hj: "high jumper", pv: "pole vaulter" },
      needs: [3392],
      view: "side",
    },
    "jumps",
    [
      person("hj", "f1", -4, 0, 90, [act("aSkip"), act("buttKicks"), act("stand", { seconds: 0.3 }), act("leap", { to: to(-2.5, 0) })]),
      person("pv", "m1", -6, 3, 90, [act("bSkip"), act("highKnees"), act("dash", { to: to(-2, 3) })]),
    ],
  ),
  scene(
    {
      id: "relay",
      title: "Relay",
      summary: "Four runners: a sprint start, a sprint, and two baton changes in the zone.",
      setting: "sport",
      roles: { r1: "first leg", r2: "second leg", r3: "third leg", r4: "anchor" },
      needs: [3392],
      view: "side",
    },
    "relay",
    [
      person("r1", "m1", -6, 0, 90, [act("sprintStart"), act("sprint", { to: to(-1, 0) }), act("relayOutgoing", { partner: "r2", at: 5.5 })]),
      person("r2", "f1", -0.5, 0.3, 90, [act("relayIncoming", { partner: "r1", at: 5.5 }), act("sprint", { to: to(5, 0.3) })]),
      person("r3", "m2", 5.5, 0.6, 90, [act("readyPosition"), act("dash", { to: to(8, 0.6) })]),
      person("r4", "f2", 9, 0.9, 90, [act("readyPosition"), act("fistPump")]),
    ],
  ),
  scene(
    {
      id: "victory-lap",
      title: "Victory lap",
      summary: "Three athletes celebrate: a fist pump, a victory pose, hands behind the head, a low five and thumbs up.",
      setting: "sport",
      roles: { w1: "winner", w2: "runner-up", w3: "third" },
      needs: [3392],
    },
    "victory",
    [
      person("w1", "m1", 0, 0, 0, [act("fistPump"), act("victory"), act("lowFive", { partner: "w2" })]),
      person("w2", "f1", 0.8, 0.3, 300, [act("handsOnHips"), act("lowFive", { partner: "w1" }), act("thumbsUp")]),
      person("w3", "m2", -0.5, 0.2, 60, [act("handsBehindHead"), act("firmPress", { target: at("w1", "shoulderRight") })]),
    ],
  ),
  scene(
    {
      id: "ball-yard",
      title: "Ball yard",
      summary: "Three players throw, catch and kick in a yard, then run and jump.",
      setting: "sport",
      roles: { th: "thrower", ca: "catcher", ki: "kicker" },
      needs: [3392, 3479],
    },
    "ball-yard",
    [
      person("th", "m1", 0, 0, 0, [act("throwObject", { at: at("ca", "sternum") }, { anchor: "th" }), act("run", { to: to(0, 3), pace: "jog" })]),
      person("ca", "f1", 0, 5, 180, [act("catchObject", { from: "th", hands: "two" }), act("jump", { to: to(0, 5.4) })]),
      person("ki", "m2", 2, 2, 270, [act("kickBall", { ball: at("ki", "footTopRight") })]),
    ],
  ),
  scene(
    {
      id: "martial-forms",
      title: "Martial arts forms",
      summary: "Three students run their forms: a horse stance, karate punches, a front stance with a low and a rising block, a tai chi push.",
      setting: "sport",
      roles: { k1: "student", k2: "student", k3: "student" },
      needs: [3392],
    },
    "forms",
    [
      person("k1", "m1", -1.2, 0, 0, [act("horseStance", { seconds: 1.5 }), act("karatePunches")]),
      person("k2", "f1", 0, 0, 0, [act("frontStance"), act("lowBlock"), act("risingBlock")]),
      person("k3", "m2", 1.2, 0, 0, [act("taiChiPush"), act("hammerTurn")]),
    ],
  ),
  scene(
    {
      id: "pool-rows",
      title: "Swimmers",
      summary: "Two swimmers in the lexicon's strokes: a front crawl and treading water, still without water forces.",
      setting: "sport",
      roles: { p1: "swimmer", p2: "swimmer" },
      needs: [3392, 3432],
    },
    "pool-rows",
    [
      person("p1", "f2", -0.8, 0, 0, [act("frontCrawl", { cycles: 4 })]),
      person("p2", "m1", 0.8, 0, 0, [act("treadWater")]),
    ],
  ),
];
