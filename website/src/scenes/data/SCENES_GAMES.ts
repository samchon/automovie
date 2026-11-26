import type { IScene } from "../structures/IScene";
import { SceneBuild } from "./SceneBuild";

const { act, at, object, person, scene, to }: typeof SceneBuild = SceneBuild;

/** The sport scenes composed from the lexicon's sport families of #3392. */
export const SCENES_GAMES: readonly IScene[] = [
  scene(
    {
      id: "tennis-rally",
      title: "Tennis feed",
      summary:
        "A feeder hand-feeds a ball over the net and the receiver drives it back with a forehand.",
      setting: "sport",
      roles: { ana: "receiver", bea: "feeder" },
      needs: [],
      view: "three-quarter",
      distance: 13.7,
    },
    "tennis",
    [
      person("bea", "f2", 0, 6, 180, [
        act("bend", {
          target: { kind: "prop", subject: "tennis-ball", point: "grip" },
          hand: "left",
        }),
        act("pickUp", {
          prop: "tennis-ball",
          hand: "left",
          handle: "grip",
          lift: 0.14,
        }),
        act("pickUp", {
          prop: "bea-racket",
          handle: "grip",
          lift: 0.1,
          use: { tip: "sweetSpot", line: "oblique" },
        }),
        act("stand", { hold: 1.5 }),
        act(
          "ballSport",
          {
            kind: "handballThrow",
            hand: "left",
            prop: "tennis-ball",
            at: { x: -0.81, y: 1.28, z: 0.55 },
            flightSeconds: 0.85,
          },
          { anchor: "tennis-feed" },
        ),
        act("racket", {
          kind: "readyPosition",
          hold: 0.4,
          implement: "bea-racket",
        }),
        act("step", { direction: "left", steps: 1 }),
        act("step", { direction: "right", steps: 1 }),
        act("racket", {
          kind: "readyPosition",
          hold: 0.4,
          implement: "bea-racket",
        }),
        act("step", { direction: "right", steps: 1 }),
        act("step", { direction: "left", steps: 1 }),
        act("racket", {
          kind: "readyPosition",
          hold: 0.4,
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
          hold: 0.25,
          implement: "ana-racket",
        }),
        act("step", { direction: "right", steps: 1 }),
        act("step", { direction: "left", steps: 1 }),
        act("bounce", { count: 4 }),
        act(
          "tennisForehandReturn",
          {
            tool: "ana-racket",
            ball: "tennis-ball",
            target: {
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
          hold: 0.2,
          implement: "ana-racket",
        }),
        act("step", { direction: "right", steps: 1 }),
        act("step", { direction: "left", steps: 1 }),
        act("racket", {
          kind: "readyPosition",
          hold: 0.4,
          implement: "ana-racket",
        }),
        act("racket", {
          kind: "splitStep",
          hold: 0.2,
          implement: "ana-racket",
        }),
        act("step", { direction: "left", steps: 1 }),
        act("step", { direction: "right", steps: 1 }),
      ]),
    ],
    [
      // A bench beside each player, its seat 0.44 m up, holds the racket
      // lying along it, its grip toward the player; the feeder's also holds the
      // ball beside the grip.
      {
        ...object("ana-bench", "createBench", "flat", -0.36, 0.75, 0, 0, {
          height: 0.44,
        }),
        fixed: true,
      },
      {
        ...object("bea-bench", "createBench", "flat", 0.35, 5.2, 0, 0, {
          height: 0.44,
        }),
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
          0.452,
        ),
        rotation: { x: Math.SQRT1_2, y: 0, z: 0, w: Math.SQRT1_2 },
      },
      {
        ...object("bea-racket", "createRacket", "tennis", 0.35, 5.76, 0, 0.452),
        rotation: { x: -Math.SQRT1_2, y: 0, z: 0, w: Math.SQRT1_2 },
      },
      object(
        "tennis-ball",
        "createSphericalBall",
        "tennis",
        0.25,
        5.68,
        0,
        0.474,
      ),
      {
        ...object("court-net", "createTennisNet", undefined, 0, 3),
        fixed: true,
      },
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
        act("stand", { hold: 1.6 }),
        act("pitch", { target: at("cat", "palmLeft") }, { anchor: "pit" }),
        act("underarmPitch", { target: at("cat", "palmLeft") }),
      ]),
      person("bat", "m1", 0.9, 0.7, 270, [
        act("battingStance"),
        act("batSwing"),
        act("checkSwing"),
        act("bunt"),
      ]),
      person("cat", "f2", 0, 0, 0, [
        act("catcherCrouch", { hold: 1 }),
        act("gloveCatch", { partner: "pit", hand: "left", ball: "baseball" }),
      ]),
      person("fie", "f1", 3, 8, 200, [
        act("stand", { hold: 1 }),
        act("fieldGrounder"),
      ]),
    ],
    [object("baseball", "createBall", "baseball", 0.22, 5.8)],
  ),
  scene(
    {
      id: "volleyball",
      title: "Volleyball rehearsal",
      summary:
        "Four players rehearse digs, overhead sets, arm swings and timed jumps.",
      setting: "sport",
      roles: { v1: "libero", v2: "setter", v3: "hitter", v4: "blocker" },
      needs: [],
    },
    "volleyball",
    [
      person("v1", "f1", -1, -1, 0, [
        act("readyPosition", { hold: 0.3 }),
        act("volleyDig", {}, { anchor: "vb-dig1" }),
        act("readyPosition", { hold: 0.35 }),
        act("volleyDig", {}, { anchor: "vb-dig2" }),
        act("readyPosition", { hold: 0.35 }),
        act("volleyDig", {}, { anchor: "vb-dig3" }),
        act("readyPosition", { hold: 0.9 }),
        act("fistPump", { count: 2 }),
      ]),
      person("v2", "f2", 0, 0, 0, [
        act("readyPosition", { hold: 0.3 }),
        act("stand", { hold: 1.5 }),
        act(
          "volleySet",
          {},
          {
            anchor: "vb-set1",
            sync: { of: "vb-dig1", event: "stroke", offset: 0.15 },
          },
        ),
        act("bounce", { count: 1 }),
        act("stand", { hold: 1.5 }),
        act(
          "volleySet",
          {},
          {
            anchor: "vb-set2",
            sync: { of: "vb-dig2", event: "stroke", offset: 0.15 },
          },
        ),
        act("bounce", { count: 1 }),
        act("stand", { hold: 1.5 }),
        act(
          "volleySet",
          {},
          {
            anchor: "vb-set3",
            sync: { of: "vb-dig3", event: "stroke", offset: 0.15 },
          },
        ),
        act("stand", { hold: 0.3 }),
        act("readyPosition", { hold: 0.2 }),
        act("victory"),
      ]),
      person("v3", "m1", 1, 0.2, 0, [
        act("bounce", { count: 5 }),
        act("stand", { hold: 1.5 }),
        act(
          "spike",
          {},
          {
            anchor: "vb-spike1",
            sync: { of: "vb-set1", event: "stroke", offset: 0.65 },
          },
        ),
        act("step", { direction: "back", steps: 1 }),
        act("bounce", { count: 2 }),
        act("stand", { hold: 1.5 }),
        act(
          "spike",
          {},
          {
            anchor: "vb-spike2",
            sync: { of: "vb-set2", event: "stroke", offset: 0.65 },
          },
        ),
        act("step", { direction: "back", steps: 1 }),
        act("bounce", { count: 2 }),
        act("stand", { hold: 1.5 }),
        act(
          "spike",
          {},
          {
            anchor: "vb-spike3",
            sync: { of: "vb-set3", event: "stroke", offset: 0.65 },
          },
        ),
        act("step", { direction: "back", steps: 1 }),
        act("fistPump", { count: 3 }),
      ]),
      person("v4", "m2", 1.5, 2.6, 180, [
        act("bounce", { count: 5 }),
        act("stand", { hold: 1.5 }),
        act(
          "jump",
          { to: to(1.5, 2.4) },
          { sync: { of: "vb-spike1", event: "stroke", offset: -0.44 } },
        ),
        act("step", { direction: "back", steps: 1 }),
        act("bounce", { count: 1 }),
        act("stand", { hold: 1 }),
        act(
          "jump",
          { to: to(1.5, 2.4) },
          { sync: { of: "vb-spike2", event: "stroke", offset: -0.44 } },
        ),
        act("step", { direction: "back", steps: 1 }),
        act("bounce", { count: 1 }),
        act("stand", { hold: 1 }),
        act(
          "jump",
          { to: to(1.5, 2.4) },
          { sync: { of: "vb-spike3", event: "stroke", offset: -0.44 } },
        ),
        act("handsOnHips", { hold: 1 }),
        act("dontKnow"),
      ]),
    ],
  ),
  scene(
    {
      id: "penalty",
      title: "Penalty",
      summary:
        "A kicker scores high past a keeper diving the wrong way; a defender slides in late.",
      setting: "sport",
      roles: { kic: "kicker", kee: "goalkeeper", def: "defender" },
      needs: [],
    },
    "penalty",
    [
      person("kic", "m1", 0, 0, 0, [
        act("walk", { to: to(0, -1), face: 0 }),
        act("handsOnHips", { hold: 1.8 }),
        act("look", { target: at("kee", "face"), duration: 1.2 }),
        act("bounce", { count: 4 }),
        act("stand", { hold: 0.9 }),
        act("dash", { to: to(0, 1) }),
        act(
          "kickRight",
          {
            ball: "ball",
            target: {
              kind: "point",
              frame: "world",
              at: { x: 1.7, y: 0.9, z: 11.4 },
            },
            speed: 22,
            lift: 4,
          },
          { anchor: "pen-kick" },
        ),
        act("fistPump", { count: 1 }),
      ]),
      person("kee", "m2", 0, 11, 180, [
        act("bounce", { count: 6 }),
        act("step", { direction: "left", steps: 1 }),
        act("step", { direction: "right", steps: 1 }),
        act("bounce", { count: 6 }),
        act("step", { direction: "right", steps: 1 }),
        act("step", { direction: "left", steps: 1 }),
        act("crouch", { hold: 0.3 }),
        act("stand", { hold: 1.9 }),
        act(
          "goalkeeperDiveLeft",
          {},
          { sync: { of: "pen-kick", event: "stroke", offset: 0.3 } },
        ),
      ]),
      person("def", "f1", 3, 3, 240, [
        act("bounce", { count: 8 }),
        act("handsOnHips", { hold: 1.5 }),
        act("bounce", { count: 6 }),
        act("stand", { hold: 1.9 }),
        act(
          "dash",
          { to: to(2.6, 5) },
          { sync: { of: "pen-kick", event: "start" } },
        ),
        act("slidingTackle"),
      ]),
    ],
    // The ball on the spot, ahead of where the kicker's run ends.
    [object("ball", "createSphericalBall", "football", 0, 1.3)],
  ),
  scene(
    {
      id: "golf",
      title: "Golf",
      summary:
        "One golfer tees off; another reads the green, putts and takes the ball from the cup.",
      setting: "sport",
      roles: { g1: "golfer", g2: "golfer" },
      needs: [],
    },
    "golf",
    [
      person("g1", "m1", -1, -1.4, 90, [
        act("walk", { to: to(-1, 0), face: 90 }),
        act("crouch", { hold: 0.3 }),
        act("golfAddress"),
        act("golfSwing"),
        act("look", {
          target: { kind: "point", frame: "world", at: { x: 30, y: 12, z: 0 } },
          duration: 1.4,
        }),
        act("crouch", { hold: 0.3 }),
        act("walk", { to: to(-1, -1) }),
      ]),
      person("g2", "f1", 1, 1, 90, [
        act("crouch", { depth: "full", hold: 0.8 }),
        act("golfAddress"),
        act("putt"),
        act("look", {
          target: { kind: "point", frame: "world", at: { x: 3.5, y: 0, z: 1 } },
          duration: 1,
        }),
        act("walk", { to: to(3.2, 1) }),
        act("crouch", { depth: "full", hold: 0.2 }),
        act("walk", { to: to(2.8, 2.1) }),
      ]),
    ],
  ),
  scene(
    {
      id: "gymnastics-hall",
      title: "Gymnastics hall",
      summary:
        "Three gymnasts tumble: cartwheels and handsprings, rolls and a handstand, leaps and saltos.",
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
        act("victory"),
        act("cartwheelRight"),
        act("roundOffRight"),
        act("frontHandspring"),
        act("victory"),
      ]),
      person("g2", "f2", -3, 1, 90, [
        act("forwardRoll"),
        act("backwardRoll"),
        act("handstand", { hold: 0.5 }),
        act("stand", { hold: 0.3 }),
        act("forwardRoll"),
        act("cartwheelRight"),
        act("victory"),
      ]),
      person("g3", "m1", -3, 4, 90, [
        act("leap", { to: to(-1.5, 4) }),
        act("backSalto", { to: to(-2.2, 4) }),
        act("frontSalto", { to: to(0, 4) }),
        act("leap", { to: to(1.5, 4) }),
        act("frontSalto", { to: to(3.2, 4) }),
        act("backSalto", { to: to(2.5, 4) }),
        act("cartwheelRight"),
        act("roundOffRight"),
        act("victory"),
      ]),
    ],
  ),
  scene(
    {
      id: "high-jump",
      title: "High jump and sprint",
      summary:
        "A jumper warms up and clears the bar with a Fosbury flop; a sprinter dashes and cheers.",
      setting: "sport",
      roles: { hj: "high jumper", pv: "sprinter" },
      needs: [],
      view: "three-quarter",
    },
    "jumps",
    [
      person("hj", "f1", -4, -1.5, 90, [
        act("legSwings", { count: 4 }),
        act("armCircles", { count: 1 }),
        act("stand", { hold: 1 }),
        act("gestureClap", {}, { anchor: "hj-clap" }),
        // The approach meets the bar on a curve, then passes the right
        // footfall as the jump's planted entry.
        act(
          "run",
          {
            to: to(0.8, 0.57),
            via: [to(-3.2, -1.25), to(-2.1, -0.86), to(-1.35, -0.28)],
            pace: "run",
          },
          { until: { type: "event", event: "rightHeelStrike2" } },
        ),
        act(
          "fosburyFlop",
          {
            to: { x: 1.2, y: 0.7, z: 0 },
            bar: "bar",
            on: "mat",
            apexReserve: 0.35,
            takeoffFoot: "right",
          },
          { anchor: "hj-flop" },
        ),
      ]),
      person("pv", "m1", -4, 4, 90, [
        act("armCircles", { count: 2 }),
        act("sprintStart", { hold: 1 }),
        act("dash", { to: to(1, 4) }),
        act("stand", { hold: 2 }),
        act("gestureClap", {}, { sync: { of: "hj-clap" } }),
        act("look", { target: at("hj", "face"), cue: "seen", duration: 2 }),
        act(
          "fistPump",
          { count: 2 },
          { sync: { of: "hj-flop", event: "touchdown" } },
        ),
      ]),
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
        "Four runners pass a mimed baton down the track, and the anchor runs it in and celebrates.",
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
      // Each pass is run as both runners sprint off together, the outgoing
      // one a metre ahead in the next lane, so the hands meet at `at`, film
      // seconds about 1.5 s into both sprints.
      person("r1", "m1", -7, 0, 90, [
        act("sprintStart", { hold: 1.3 }),
        act(
          "sprint",
          { to: to(1, 0) },
          {
            anchor: "rl-leg1",
            over: [act("relayIncoming", { partner: "r2", at: 4.3 })],
          },
        ),
        act("jog", { to: to(2.5, -1.4), face: 90 }),
        act("handsOnHips", { hold: 1.8 }),
        act("walk", { to: to(6, -1.4), face: 90 }),
        act("fistPump", { count: 2 }),
      ]),
      person("r2", "f1", -6, 0.6, 90, [
        act("legSwings", { count: 2 }),
        act("stand", { hold: 1 }),
        act(
          "sprint",
          { to: to(2, 0.6) },
          {
            sync: { of: "rl-leg1", event: "start" },
            over: [act("relayOutgoing", { partner: "r1", at: 4.3 })],
          },
        ),
        act(
          "sprint",
          { to: to(10, 0.6) },
          {
            anchor: "rl-leg2",
            over: [act("relayIncoming", { partner: "r3", at: 6.5 })],
          },
        ),
        act("jog", { to: to(11.5, 2), face: 90 }),
        act("handsOnHips", { hold: 1.8 }),
        act("walk", { to: to(15.3, 2), face: 90 }),
      ]),
      person("r3", "m2", 3, 0, 90, [
        act("armCircles", { count: 2 }),
        act("legSwings", { count: 1 }),
        act("stand", { hold: 1.5 }),
        act(
          "sprint",
          { to: to(11, 0) },
          {
            sync: { of: "rl-leg2", event: "start" },
            over: [act("relayOutgoing", { partner: "r2", at: 6.5 })],
          },
        ),
        act(
          "sprint",
          { to: to(19, 0) },
          {
            anchor: "rl-leg3",
            over: [act("relayIncoming", { partner: "r4", at: 8.7 })],
          },
        ),
        act("jog", { to: to(20.5, -1.4), face: 90 }),
        act("handsOnHips", { hold: 1.8 }),
        act("walk", { to: to(21.8, -1.4), face: 90 }),
      ]),
      person("r4", "f2", 12, 0.6, 90, [
        act("armCircles", { count: 2 }),
        act("legSwings", { count: 2 }),
        act("stand", { hold: 2 }),
        act(
          "sprint",
          { to: to(26, 0.6) },
          {
            sync: { of: "rl-leg3", event: "start" },
            over: [act("relayOutgoing", { partner: "r3", at: 8.7 })],
          },
        ),
        act("fistPump", { count: 2 }),
        act("victory"),
      ]),
    ],
  ),
  scene(
    {
      id: "victory-lap",
      title: "Victory lap",
      summary:
        "The winner celebrates and bumps fists with the runner-up; the third grips his shoulder.",
      setting: "sport",
      roles: { w1: "winner", w2: "runner-up", w3: "third" },
      needs: [],
    },
    "victory",
    [
      person("w1", "m1", 0, -5, 0, [
        act("jog", { to: to(0, 0), face: 0 }),
        act("fistPump"),
        act("victory"),
        act("fistBump", { partner: "w2" }),
        act("gestureWave", { count: 3 }),
        act("fistPump", { count: 2 }),
      ]),
      // The third keeps his distance until he comes in for the hand on the
      // shoulder.
      person("w2", "f1", 0.8, 0.3, 300, [
        act("handsOnHips", { hold: 1.6 }),
        act("gestureClap"),
        act("handsOnHips", { hold: 1.6 }),
        act("gestureClap"),
        act("handsOnHips", { hold: 1.2 }),
        act("fistBump", { partner: "w1" }),
        act("thumbsUp"),
        act("handsOnHips", { hold: 1.6 }),
        act("gestureClap"),
      ]),
      person("w3", "m2", -1.6, 0.05, 90, [
        act("handsBehindHead"),
        act("walk", { to: to(-0.45, 0.05), face: 90 }),
        act("firmPress", { target: at("w1", "shoulderRight") }),
        act("step", { direction: "back", steps: 2 }),
        act("gestureClap"),
        act("handsOnHips", { hold: 1.2 }),
        act("thumbsUp"),
        act("gestureClap"),
      ]),
    ],
  ),
  scene(
    {
      id: "ball-yard",
      title: "Ball yard",
      summary:
        "A catcher takes a throw and passes it to a kicker, who catches it and kicks two balls.",
      setting: "sport",
      roles: { th: "thrower", ca: "catcher", ki: "kicker" },
      needs: [],
    },
    "ball-yard",
    [
      person("th", "m1", 0, 0, 0, [
        act("throwObject", { target: at("ca", "sternum") }, { anchor: "th" }),
        act("run", { to: to(0, 1.6), pace: "jog" }),
        act("gestureBeckon"),
        act("jump", { to: to(0, 1.8) }),
        act("jog", { to: to(-1.5, 2.6), face: 45 }),
        act("fistPump"),
        act("walk", { to: to(-0.4, 1.8), face: 0 }),
      ]),
      person("ca", "f1", 0, 5, 180, [
        act("catchObject", { partner: "th", hands: "two", ball: "handball" }),
        act(
          "throwObject",
          { target: at("ki", "sternum"), prop: "handball", style: "underarm" },
          { anchor: "by-pass" },
        ),
        act("gestureClap"),
        act("jump", { to: to(0, 4.6) }),
        act("jog", { to: to(-0.8, 5.4), face: 180 }),
        act("fistPump"),
        act("handsOnHips", { hold: 1.6 }),
      ]),
      person("ki", "m2", 2, 2, 270, [
        act("kickBall", { ball: "football" }),
        act("gestureBeckon"),
        act("catchObject", {
          partner: "by-pass",
          hands: "two",
          ball: "handball",
        }),
        act("walk", { to: to(2, 1.3), face: 270 }),
        act("kickLeft", { ball: "football2" }),
        act("gestureCheer"),
        act("jog", { to: to(0.8, 1.6), face: 270 }),
      ]),
    ],
    // The ball caught lies at the thrower's feet, as the throw is mimed; the
    // footballs kicked lie ahead of the kicker, the second where he steps to.
    [
      object("handball", "createSphericalBall", "handball", 0, 0.3),
      object("football", "createSphericalBall", "football", 1.7, 2),
      object("football2", "createSphericalBall", "football", 1.7, 1.3),
    ],
  ),
  scene(
    {
      id: "martial-forms",
      title: "Martial arts forms",
      summary:
        "Three students run punches, blocks and stances in different orders, then bow together.",
      setting: "sport",
      roles: { k1: "student", k2: "student", k3: "student" },
      needs: [],
    },
    "forms",
    [
      person("k1", "m1", -1.2, 0, 0, [
        act("horseStance", { hold: 1 }),
        act("karatePunches", { count: 4 }),
        act("frontStance", { hold: 0.5 }),
        act("lowBlock", { count: 2 }),
        act("risingBlock", { count: 2 }),
        act("gesture", { kind: "bow" }, { anchor: "mf-bow" }),
      ]),
      person("k2", "f1", 0, 0, 0, [
        act("frontStance", { hold: 0.5 }),
        act("lowBlock", { count: 2 }),
        act("risingBlock", { count: 2 }),
        act("horseStance", { hold: 1 }),
        act("karatePunches", { count: 4 }),
        act("stand", { hold: 0.5 }),
        act("gesture", { kind: "bow" }, { sync: { of: "mf-bow" } }),
      ]),
      person("k3", "m2", 1.2, 0, 0, [
        act("martialArt", { kind: "taiChiTransfer" }, { anchor: "mf-tai" }),
        act(
          "horseStance",
          { hold: 1.5 },
          { sync: { of: "mf-tai", event: "relax" } },
        ),
        act("stand", { hold: 3 }),
        act("gesture", { kind: "bow" }, { sync: { of: "mf-bow" } }),
      ]),
    ],
  ),
  scene(
    {
      id: "throwing-circle",
      title: "Throwing circle",
      summary:
        "A hammer thrower rehearses two turns, throws with three and watches the mimed hammer.",
      setting: "sport",
      roles: { thr: "hammer thrower" },
      needs: [],
    },
    "throwing-circle",
    [
      person("thr", "m2", 0, -2.2, 0, [
        act("walk", { to: to(0, 0), face: 0 }),
        act("armCircles", { count: 2 }),
        act("hammerTurn", { count: 2 }),
        act("stand", { hold: 0.6 }),
        act("hammerTurn", { count: 3 }),
        act("look", {
          target: { kind: "point", frame: "world", at: { x: 0, y: 3, z: 30 } },
          duration: 1.2,
        }),
        act("fistPump"),
      ]),
    ],
  ),
];
