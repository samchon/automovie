import type { IScene } from "../structures/IScene";
import { SceneBuild } from "./SceneBuild";

const { act, at, person, scene, to }: typeof SceneBuild = SceneBuild;

/**
 * A ball resting on the floor, as a kick's target: its centre a football's
 * radius up (0.11 m), ahead of where the support foot plants.
 *
 * @param x To the left of a person facing +Z, metres.
 * @param z Forward, metres.
 * @returns The target.
 */
const ball = (x: number, z: number): Record<string, unknown> => ({
  kind: "point",
  at: { x, y: 0.11, z },
  frame: "world",
});

/** The sport scenes composed from the lexicon's sport families of #3392. */
export const SCENES_GAMES: readonly IScene[] = [
  scene(
    {
      id: "tennis-rally",
      title: "Tennis rally",
      summary:
        "Two players, one at the baseline and one at the net: ready positions and split steps; a forehand, a two-handed backhand and a topspin stroke answered by a volley, an overhead smash and a backhand drive.",
      setting: "sport",
      roles: { ana: "baseline", bea: "net" },
      needs: [],
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
        "A pitcher throws overarm and then underarm, the batter swings, checks a swing and bunts, the catcher crouches and catches in the gloved hand, a fielder takes a grounder.",
      setting: "sport",
      roles: { pit: "pitcher", bat: "batter", cat: "catcher", fie: "fielder" },
      needs: [],
      view: "side",
    },
    "baseball",
    [
      person("pit", "m2", 0, 6, 180, [
        act("stand", { seconds: 1.6 }),
        act("pitch", { at: at("cat", "palmLeft") }, { anchor: "pit" }),
        act("underarmPitch", { at: at("cat", "palmLeft") }),
      ]),
      person("bat", "m1", 0.6, 0.6, 270, [
        act("battingStance"),
        act("batSwing"),
        act("checkSwing"),
        act("bunt"),
      ]),
      person("cat", "f2", 0, 0, 0, [
        act("catcherCrouch", { seconds: 1 }),
        act("gloveCatch", { from: "pit", side: "left" }),
      ]),
      person("fie", "f1", 3, 8, 200, [
        act("stand", { seconds: 1 }),
        act("fieldGrounder"),
      ]),
    ],
  ),
  scene(
    {
      id: "volleyball",
      title: "Volleyball",
      summary:
        "Four players: a forearm dig, an overhead set, a hitter who bounces on the spot and spikes, and a blocker who bounces and jumps toward the net.",
      setting: "sport",
      roles: { v1: "libero", v2: "setter", v3: "hitter", v4: "blocker" },
      needs: [],
    },
    "volleyball",
    [
      person("v1", "f1", -1, -1, 0, [act("volleyDig")]),
      person("v2", "f2", 0, 0, 0, [act("volleySet")]),
      person("v3", "m1", 1, 0.2, 0, [act("bounce"), act("spike")]),
      person("v4", "m2", 0.5, 2, 180, [
        act("bounce"),
        act("stand", { seconds: 0.3 }),
        act("jump", { to: to(0.5, 1.8) }),
      ]),
    ],
  ),
  scene(
    {
      id: "penalty",
      title: "Penalty",
      summary:
        "A kicker runs up and strikes the ball with the right foot, the goalkeeper dives to the left, and a defender slides in.",
      setting: "sport",
      roles: { kic: "kicker", kee: "goalkeeper", def: "defender" },
      needs: [],
    },
    "penalty",
    [
      person("kic", "m1", 0, 0, 0, [
        act("dash", { to: to(0, 1) }),
        act("kickRight", { ball: ball(0, 1.3) }),
      ]),
      person("kee", "m2", 0, 11, 180, [
        act("crouch", { hold: 0.5 }),
        act("stand", { seconds: 0.3 }),
        act("goalkeeperDiveLeft"),
      ]),
      person("def", "f1", 3, 3, 240, [
        act("stand", { seconds: 0.3 }),
        act("slidingTackle"),
      ]),
    ],
  ),
  scene(
    {
      id: "golf",
      title: "Golf",
      summary: "Two golfers: an address, a full swing and a putt.",
      setting: "sport",
      roles: { g1: "golfer", g2: "golfer" },
      needs: [],
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
        "Three gymnasts: a cartwheel, a round-off and a front handspring; a forward and a backward roll and a handstand; a leap, a back salto and a front salto.",
      setting: "sport",
      roles: { g1: "gymnast", g2: "gymnast", g3: "gymnast" },
      needs: [],
      view: "side",
    },
    "gymnastics",
    [
      person("g1", "f1", -3, -1, 90, [
        act("cartwheelLeft"),
        act("roundOffLeft"),
        act("frontHandspring"),
      ]),
      person("g2", "f2", -3, 1, 90, [
        act("forwardRoll"),
        act("backwardRoll"),
        act("handstand"),
      ]),
      person("g3", "m1", -3, 3, 90, [
        act("leap", { to: to(-1.5, 3) }),
        act("backSalto", { to: to(-2.2, 3) }),
        act("frontSalto", { to: to(0, 3) }),
      ]),
    ],
  ),
  scene(
    {
      id: "high-jump",
      title: "Jump drills",
      summary:
        "Two athletes drill their run-up: A-skips and B-skips, butt kicks and high knees, strides into a Fosbury flop, a leap and a dash.",
      setting: "sport",
      roles: { hj: "high jumper", pv: "sprinter" },
      needs: [],
      view: "side",
    },
    "jumps",
    [
      person("hj", "f1", -4, 0, 90, [
        act("aSkip"),
        act("buttKicks"),
        act("strides", { to: to(-1.5, 0) }),
        act("fosburyFlop", { to: to(0, 0), bar: 1.2 }),
      ]),
      person("pv", "m1", -6, 3, 90, [
        act("bSkip"),
        act("highKnees"),
        act("stand", { seconds: 0.3 }),
        act("leap", { to: to(-4, 3) }),
        act("dash", { to: to(-1, 3) }),
      ]),
    ],
  ),
  scene(
    {
      id: "relay",
      title: "Relay",
      summary:
        "Four runners: the first leg sprints in and passes a mimed baton to the second running a step ahead, the third starts from a crouch and dashes off, the anchor waits and pumps a fist.",
      setting: "sport",
      roles: {
        r1: "first leg",
        r2: "second leg",
        r3: "third leg",
        r4: "anchor",
      },
      needs: [],
      view: "side",
    },
    "relay",
    [
      person("r1", "m1", -7, 0, 90, [
        act(
          "sprint",
          { to: to(3, 0) },
          { over: [act("relayIncoming", { partner: "r2", at: 1.5 })] },
        ),
      ]),
      person("r2", "f1", -6, 0.3, 90, [
        act(
          "sprint",
          { to: to(4, 0.3) },
          { over: [act("relayOutgoing", { partner: "r1", at: 1.5 })] },
        ),
      ]),
      person("r3", "m2", 5.5, 0.6, 90, [
        act("sprintStart"),
        act("dash", { to: to(8, 0.6) }),
      ]),
      person("r4", "f2", 9, 0.9, 90, [
        act("stand", { seconds: 2 }),
        act("fistPump"),
      ]),
    ],
  ),
  scene(
    {
      id: "victory-lap",
      title: "Victory lap",
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
      person("w2", "f1", 0.8, 0.3, 300, [
        act("handsOnHips"),
        act("lowFive", { partner: "w1" }),
        act("thumbsUp"),
      ]),
      person("w3", "m2", -0.5, 0.2, 60, [
        act("handsBehindHead"),
        act("firmPress", { target: at("w1", "shoulderRight") }),
      ]),
    ],
  ),
  scene(
    {
      id: "ball-yard",
      title: "Ball yard",
      summary:
        "Three players throw, catch and kick in a yard, then run and jump.",
      setting: "sport",
      roles: { th: "thrower", ca: "catcher", ki: "kicker" },
      needs: [],
    },
    "ball-yard",
    [
      person("th", "m1", 0, 0, 0, [
        act("throwObject", { at: at("ca", "sternum") }, { anchor: "th" }),
        act("run", { to: to(0, 3), pace: "jog" }),
      ]),
      person("ca", "f1", 0, 5, 180, [
        act("catchObject", { from: "th", hands: "two" }),
        act("jump", { to: to(0, 4.6) }),
      ]),
      person("ki", "m2", 2, 2, 270, [act("kickBall", { ball: ball(1.7, 2) })]),
    ],
  ),
  scene(
    {
      id: "martial-forms",
      title: "Martial arts forms",
      summary:
        "Three students run their forms: a horse stance, karate punches, a front stance with a low and a rising block, a tai chi push.",
      setting: "sport",
      roles: { k1: "student", k2: "student", k3: "student" },
      needs: [],
    },
    "forms",
    [
      person("k1", "m1", -1.2, 0, 0, [
        act("horseStance", { seconds: 1.5 }),
        act("karatePunches"),
      ]),
      person("k2", "f1", 0, 0, 0, [
        act("frontStance"),
        act("lowBlock"),
        act("risingBlock"),
      ]),
      person("k3", "m2", 1.2, 0, 0, [act("taiChiPush")]),
    ],
  ),
  scene(
    {
      id: "throwing-circle",
      title: "Throwing circle",
      summary:
        "A hammer thrower in the circle turns twice, pivoting on the left foot.",
      setting: "sport",
      roles: { thr: "hammer thrower" },
      needs: [],
    },
    "throwing-circle",
    [person("thr", "m2", 0, 0, 0, [act("hammerTurn"), act("hammerTurn")])],
  ),
];
