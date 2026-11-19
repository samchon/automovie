import type { IScene } from "../structures/IScene";
import { SceneBuild } from "./SceneBuild";

const { act, at, object, person, scene, to }: typeof SceneBuild = SceneBuild;

/** The sport scenes composed from the lexicon's sport families of #3392. */
export const SCENES_GAMES: readonly IScene[] = [
  scene(
    {
      id: "tennis-rally",
      title: "Tennis rally",
      summary:
        "Two players take their rackets and set their feet by the net. A hand-fed ball comes across the court for a forehand return.",
      setting: "sport",
      roles: { ana: "receiver", bea: "feeder" },
      needs: [],
      view: "three-quarter",
      distance: 13.7,
    },
    "tennis",
    [
      person("bea", "f2", 0, 6, 180, [
        act("pickUp", {
          prop: "bea-racket",
          handle: "grip",
          lift: 0.1,
          use: { tip: "sweetSpot", line: "oblique" },
        }),
        act("pickUp", {
          prop: "tennis-ball",
          hand: "left",
          handle: "grip",
          lift: 0.14,
        }),
        act("stand", { seconds: 2 }),
        act(
          "ballSport",
          {
            kind: "handballThrow",
            side: "left",
            prop: "tennis-ball",
            at: { x: -0.81, y: 1.28, z: 0.55 },
            flightSeconds: 0.85,
          },
          { anchor: "tennis-feed" },
        ),
        act("racket", {
          kind: "readyPosition",
          seconds: 0.4,
          implement: "bea-racket",
        }),
      ]),
      person("ana", "f1", 0, 0, 0, [
        act("pickUp", {
          prop: "ana-racket",
          handle: "grip",
          lift: 0.11,
          use: { tip: "sweetSpot", line: "oblique" },
        }),
        act("racket", {
          kind: "readyPosition",
          seconds: 0.25,
          implement: "ana-racket",
        }),
        act(
          "tennisForehandReturn",
          {
            tool: "ana-racket",
            ball: "tennis-ball",
            toward: {
              kind: "point",
              frame: "world",
              at: { x: 0.8, y: 0, z: 5.6 },
            },
            impact: 0.55,
            speed: 8.9,
          },
          {
            anchor: "tennis-return",
            sync: { of: "tennis-feed", event: "stroke", offset: 0.85 - 0.55 },
          },
        ),
        act("racket", {
          kind: "splitStep",
          seconds: 0.2,
          implement: "ana-racket",
        }),
      ]),
    ],
    [
      {
        ...object("ana-bench", "createTable", "workbench", -0.64, 0.7, 0, 0, {
          height: 0.902,
        }),
        fixed: true,
      },
      {
        ...object("bea-bench", "createTable", "workbench", 0.405, 5.405, 0, 0, {
          height: 0.9,
        }),
        fixed: true,
      },
      {
        ...object(
          "ball-rest",
          "createTableware",
          "saucer",
          -0.13,
          5.66,
          0,
          0.9,
        ),
        fixed: true,
      },
      {
        ...object(
          "ana-racket",
          "createRacket",
          "tennis",
          -0.36,
          0.19,
          0,
          0.914,
        ),
        rotation: { x: Math.SQRT1_2, y: 0, z: 0, w: Math.SQRT1_2 },
      },
      {
        ...object("bea-racket", "createRacket", "tennis", 0.35, 5.76, 0, 0.914),
        rotation: { x: -Math.SQRT1_2, y: 0, z: 0, w: Math.SQRT1_2 },
      },
      object("tennis-ball", "createBall", "tennis", -0.13, 5.66, 0, 0.914),
      { ...object("court-net", "createGoal", "tennisNet", 0, 3), fixed: true },
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
      refusedUntil: 3552,
      view: "side",
    },
    "baseball",
    [
      person("pit", "m2", 0, 6, 180, [
        act("stand", { seconds: 1.6 }),
        act("pitch", { at: at("cat", "palmLeft") }, { anchor: "pit" }),
        act("underarmPitch", { at: at("cat", "palmLeft") }),
      ]),
      person("bat", "m1", 0.9, 0.7, 270, [
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
      refusedUntil: 3550,
    },
    "volleyball",
    [
      person("v1", "f1", -1, -1, 0, [act("volleyDig")]),
      person("v2", "f2", 0, 0, 0, [act("volleySet")]),
      person("v3", "m1", 1, 0.2, 0, [act("bounce"), act("spike")]),
      person("v4", "m2", 1.5, 2.6, 180, [
        act("bounce"),
        act("stand", { seconds: 0.3 }),
        act("jump", { to: to(1.5, 2.4) }),
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
        act("kickRight", { ball: "ball" }),
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
    // The ball on the spot, ahead of where the kicker's run ends.
    [object("ball", "createBall", "football", 0, 1.3)],
  ),
  scene(
    {
      id: "golf",
      title: "Golf",
      summary:
        "Two golfers with their clubs mimed: an address and a full swing, an address and a putt.",
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
      person("g1", "f1", -3, -2, 90, [
        act("cartwheelLeft"),
        act("roundOffLeft"),
        act("frontHandspring"),
      ]),
      person("g2", "f2", -3, 1, 90, [
        act("forwardRoll"),
        act("backwardRoll"),
        act("handstand"),
      ]),
      person("g3", "m1", -3, 4, 90, [
        act("leap", { to: to(-1.5, 4) }),
        act("backSalto", { to: to(-2.2, 4) }),
        act("frontSalto", { to: to(0, 4) }),
      ]),
    ],
  ),
  scene(
    {
      id: "high-jump",
      title: "High jump and sprint",
      summary:
        "A jumper takes a short approach and lands from a Fosbury flop on a raised mat while a sprinter runs in a separate lane.",
      setting: "sport",
      roles: { hj: "high jumper", pv: "sprinter" },
      needs: [],
      view: "three-quarter",
    },
    "jumps",
    [
      person("hj", "f1", -4, 0, 90, [
        act("strides", { to: to(-1.5, 0) }),
        act("fosburyFlop", {
          to: { x: 1.2, y: 0.7, z: 0 },
          bar: "bar",
          on: "mat",
          apexReserve: 0.35,
        }),
      ]),
      person("pv", "m1", -4, 4, 90, [act("dash", { to: to(-1, 4) })]),
    ],
    // The +X flight reaches the crossbar near its apex, just ahead of the mat.
    [
      object("bar", "createHighJump", "highJump", 0, 0, 90, 0, {
        height: 1.4,
      }),
      object("mat", "createLandingMat", "highJump", 2.2, 0, 90),
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
      person("r2", "f1", -6, 0.6, 90, [
        act(
          "sprint",
          { to: to(4, 0.6) },
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
      refusedUntil: 3553,
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
      person("w3", "m2", -0.45, 0.05, 90, [
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
        act("catchObject", { from: "th", hands: "two", ball: "handball" }),
        act("jump", { to: to(0, 4.6) }),
      ]),
      person("ki", "m2", 2, 2, 270, [act("kickBall", { ball: "football" })]),
    ],
    // The ball caught lies at the thrower's feet, as the throw is mimed; the
    // ball kicked lies ahead of the kicker.
    [
      object("handball", "createBall", "handball", 0, 0.3),
      object("football", "createBall", "football", 1.7, 2),
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
