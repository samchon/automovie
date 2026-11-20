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
        "Two players take their rackets from the benches beside them. The receiver settles into the ready position, shuffles side to side and bounces on her toes while the feeder bends for a ball on her bench. The feeder hand-feeds it across the net, and the receiver drives it back with a forehand. Both recover to the ready position and keep shuffling and split-stepping for the next ball.",
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
          toward: { kind: "prop", subject: "tennis-ball", point: "grip" },
          side: "left",
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
        act("stand", { seconds: 1.5 }),
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
        act("step", { direction: "left", steps: 1 }),
        act("step", { direction: "right", steps: 1 }),
        act("racket", {
          kind: "readyPosition",
          seconds: 0.4,
          implement: "bea-racket",
        }),
        act("step", { direction: "right", steps: 1 }),
        act("step", { direction: "left", steps: 1 }),
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
        act("step", { direction: "right", steps: 1 }),
        act("step", { direction: "left", steps: 1 }),
        act("bounce", { beats: 4 }),
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
        act("step", { direction: "right", steps: 1 }),
        act("step", { direction: "left", steps: 1 }),
        act("racket", {
          kind: "readyPosition",
          seconds: 0.4,
          implement: "ana-racket",
        }),
        act("racket", {
          kind: "splitStep",
          seconds: 0.2,
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
      object("tennis-ball", "createBall", "tennis", 0.25, 5.68, 0, 0.474),
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
        "Four players run three attacks in a row. Each time the libero digs on the forearms, the setter sets overhead and the hitter spikes. The blocker across the net jumps to meet each spike at its peak and steps back off the net. The hitter steps back and bounces between attacks, and the setter bounces on her toes. After the third spike the libero pumps a fist, the setter raises both arms and the hitter pumps a fist. The blocker puts his hands on his hips and shrugs.",
      setting: "sport",
      roles: { v1: "libero", v2: "setter", v3: "hitter", v4: "blocker" },
      needs: [],
    },
    "volleyball",
    [
      person("v1", "f1", -1, -1, 0, [
        act("readyPosition", { seconds: 0.3 }),
        act("volleyDig", {}, { anchor: "vb-dig1" }),
        act("readyPosition", { seconds: 0.35 }),
        act("volleyDig", {}, { anchor: "vb-dig2" }),
        act("readyPosition", { seconds: 0.35 }),
        act("volleyDig", {}, { anchor: "vb-dig3" }),
        act("readyPosition", { seconds: 0.9 }),
        act("fistPump", { count: 2 }),
      ]),
      person("v2", "f2", 0, 0, 0, [
        act("readyPosition", { seconds: 0.3 }),
        act("stand", { seconds: 1.5 }),
        act(
          "volleySet",
          {},
          {
            anchor: "vb-set1",
            sync: { of: "vb-dig1", event: "stroke", offset: 0.15 },
          },
        ),
        act("bounce", { beats: 1 }),
        act("stand", { seconds: 1.5 }),
        act(
          "volleySet",
          {},
          {
            anchor: "vb-set2",
            sync: { of: "vb-dig2", event: "stroke", offset: 0.15 },
          },
        ),
        act("bounce", { beats: 1 }),
        act("stand", { seconds: 1.5 }),
        act(
          "volleySet",
          {},
          {
            anchor: "vb-set3",
            sync: { of: "vb-dig3", event: "stroke", offset: 0.15 },
          },
        ),
        act("readyPosition", { seconds: 0.2 }),
        act("victory"),
      ]),
      person("v3", "m1", 1, 0.2, 0, [
        act("bounce", { beats: 5 }),
        act("stand", { seconds: 1.5 }),
        act(
          "spike",
          {},
          {
            anchor: "vb-spike1",
            sync: { of: "vb-set1", event: "stroke", offset: 0.65 },
          },
        ),
        act("step", { direction: "back", steps: 1 }),
        act("bounce", { beats: 2 }),
        act("stand", { seconds: 1.5 }),
        act(
          "spike",
          {},
          {
            anchor: "vb-spike2",
            sync: { of: "vb-set2", event: "stroke", offset: 0.65 },
          },
        ),
        act("step", { direction: "back", steps: 1 }),
        act("bounce", { beats: 2 }),
        act("stand", { seconds: 1.5 }),
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
        act("bounce", { beats: 5 }),
        act("stand", { seconds: 1.5 }),
        act(
          "jump",
          { to: to(1.5, 2.4) },
          { sync: { of: "vb-spike1", event: "stroke", offset: -0.44 } },
        ),
        act("step", { direction: "back", steps: 1 }),
        act("bounce", { beats: 1 }),
        act("stand", { seconds: 1 }),
        act(
          "jump",
          { to: to(1.5, 2.4) },
          { sync: { of: "vb-spike2", event: "stroke", offset: -0.44 } },
        ),
        act("step", { direction: "back", steps: 1 }),
        act("bounce", { beats: 1 }),
        act("stand", { seconds: 1 }),
        act(
          "jump",
          { to: to(1.5, 2.4) },
          { sync: { of: "vb-spike3", event: "stroke", offset: -0.44 } },
        ),
        act("handsOnHips", { seconds: 1 }),
        act("dontKnow"),
      ]),
    ],
  ),
  scene(
    {
      id: "penalty",
      title: "Penalty",
      summary:
        "A kicker backs off the spot, waits hands on hips, eyes the goalkeeper, bounces on his toes and waits for the whistle. Then he runs up and drives the ball with the right foot high to the goalkeeper's right, and pumps a fist. The goalkeeper bounces on the line and shuffles side to side, sets, and dives left a beat after the strike. The defender bounces on the edge of the box with her hands on her hips, sprints in as the kick starts and slides in too late.",
      setting: "sport",
      roles: { kic: "kicker", kee: "goalkeeper", def: "defender" },
      needs: [],
    },
    "penalty",
    [
      person("kic", "m1", 0, 0, 0, [
        act("walk", { to: to(0, -1), face: 0 }),
        act("handsOnHips", { seconds: 1.8 }),
        act("look", { target: at("kee", "face"), seconds: 1.2 }),
        act("bounce", { beats: 4 }),
        act("stand", { seconds: 0.9 }),
        act("dash", { to: to(0, 1) }),
        act(
          "kickRight",
          {
            ball: "ball",
            toward: {
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
        act("bounce", { beats: 6 }),
        act("step", { direction: "left", steps: 1 }),
        act("step", { direction: "right", steps: 1 }),
        act("bounce", { beats: 6 }),
        act("step", { direction: "right", steps: 1 }),
        act("step", { direction: "left", steps: 1 }),
        act("crouch", { hold: 0.3 }),
        act("stand", { seconds: 1.9 }),
        act(
          "goalkeeperDiveLeft",
          {},
          { sync: { of: "pen-kick", event: "stroke", offset: 0.3 } },
        ),
      ]),
      person("def", "f1", 3, 3, 240, [
        act("bounce", { beats: 8 }),
        act("handsOnHips", { seconds: 1.5 }),
        act("bounce", { beats: 6 }),
        act("stand", { seconds: 1.9 }),
        act(
          "dash",
          { to: to(2.6, 5) },
          { sync: { of: "pen-kick", event: "start" } },
        ),
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
        "Two golfers with their clubs mimed. The first walks up to the tee, crouches to tee the ball, addresses it and makes a full swing. He follows the drive into the sky, crouches for the tee and walks off. The second crouches behind her ball to read the green, addresses it and putts. She watches it roll, walks to the cup, crouches to take the ball out and walks off the green.",
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
          seconds: 1.4,
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
          seconds: 1,
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
        "Three gymnasts work the floor. The first tumbles a cartwheel, a round-off and a front handspring, salutes, and tumbles the same pass back the other way. The second runs a forward roll, a backward roll, a handstand, another forward roll and a cartwheel, then salutes. The third leaps into a back salto and a front salto, leaps again into a front and a back salto, finishes with a cartwheel and a round-off, then salutes.",
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
        act("handstand", { seconds: 0.5 }),
        act("stand", { seconds: 0.3 }),
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
        "A jumper swings her legs and circles her arms to warm up, gathers herself, claps overhead to call for the crowd's rhythm, takes a short approach and lands from a Fosbury flop on a raised mat. In the next lane a sprinter circles his arms, sets in a crouch and dashes off, claps along with the jumper, watches her approach and pumps a fist as she lands.",
      setting: "sport",
      roles: { hj: "high jumper", pv: "sprinter" },
      needs: [],
      view: "three-quarter",
    },
    "jumps",
    [
      person("hj", "f1", -4, 0, 90, [
        act("legSwings", { reps: 4 }),
        act("armCircles", { reps: 1 }),
        act("stand", { seconds: 1 }),
        act("gestureClap", {}, { anchor: "hj-clap" }),
        act("strides", { to: to(-1.5, 0) }),
        act(
          "fosburyFlop",
          {
            to: { x: 1.2, y: 0.7, z: 0 },
            bar: "bar",
            on: "mat",
            apexReserve: 0.35,
          },
          { anchor: "hj-flop" },
        ),
      ]),
      person("pv", "m1", -4, 4, 90, [
        act("armCircles", { reps: 2 }),
        act("sprintStart", { seconds: 1 }),
        act("dash", { to: to(1, 4) }),
        act("stand", { seconds: 2 }),
        act("gestureClap", {}, { sync: { of: "hj-clap" } }),
        act("look", { target: at("hj", "face"), cue: "seen", seconds: 2 }),
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
        "Four runners hand a mimed baton down the track: the first leg starts from a crouch and passes to the second, who passes to the third, who passes to the anchor, each outgoing runner warming up in the zone until the incoming one arrives. Each runner jogs out of the lane after the pass, gets their breath back and follows the race, and the anchor runs it in, pumps a fist and raises both arms.",
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
        act("sprintStart", { seconds: 1.3 }),
        act(
          "sprint",
          { to: to(1, 0) },
          {
            anchor: "rl-leg1",
            over: [act("relayIncoming", { partner: "r2", at: 4.3 })],
          },
        ),
        act("jog", { to: to(2.5, -1.4), face: 90 }),
        act("handsOnHips", { seconds: 1.8 }),
        act("walk", { to: to(6, -1.4), face: 90 }),
        act("fistPump", { count: 2 }),
      ]),
      person("r2", "f1", -6, 0.6, 90, [
        act("legSwings", { reps: 2 }),
        act("stand", { seconds: 1 }),
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
        act("handsOnHips", { seconds: 1.8 }),
        act("walk", { to: to(15.3, 2), face: 90 }),
      ]),
      person("r3", "m2", 3, 0, 90, [
        act("armCircles", { reps: 2 }),
        act("legSwings", { reps: 1 }),
        act("stand", { seconds: 1.5 }),
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
        act("handsOnHips", { seconds: 1.8 }),
        act("walk", { to: to(21.8, -1.4), face: 90 }),
      ]),
      person("r4", "f2", 12, 0.6, 90, [
        act("armCircles", { reps: 2 }),
        act("legSwings", { reps: 2 }),
        act("stand", { seconds: 2 }),
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
        "Three athletes celebrate after the race: the winner jogs in, pumps a fist, strikes a victory pose, bumps fists with the runner-up, waves to the stands and pumps a fist again; the runner-up gets her breath back with her hands on her hips, applauds twice, catches her breath again, bumps fists, gives a thumbs up, puts her hands back on her hips and applauds; the third puts his hands behind his head, walks over, lays a firm hand on the winner's shoulder, steps back, applauds, catches his breath, gives a thumbs up and applauds again.",
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
        act("handsOnHips", { seconds: 1.6 }),
        act("gestureClap"),
        act("handsOnHips", { seconds: 1.6 }),
        act("gestureClap"),
        act("handsOnHips", { seconds: 1.2 }),
        act("fistBump", { partner: "w1" }),
        act("thumbsUp"),
        act("handsOnHips", { seconds: 1.6 }),
        act("gestureClap"),
      ]),
      person("w3", "m2", -1.6, 0.05, 90, [
        act("handsBehindHead"),
        act("walk", { to: to(-0.45, 0.05), face: 90 }),
        act("firmPress", { target: at("w1", "shoulderRight") }),
        act("step", { direction: "back", steps: 2 }),
        act("gestureClap"),
        act("handsOnHips", { seconds: 1.2 }),
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
        "Three players in a yard: the thrower throws to the catcher, jogs in, calls for the ball, jumps, runs wide and pumps a fist, and walks back in; the catcher takes it in both hands, throws it on to the kicker, applauds, jumps, jogs back, pumps a fist and gets her breath back; the kicker strikes one football with the right foot, calls for the handball, catches it, steps across, strikes a second football with the left foot, cheers and jogs after it.",
      setting: "sport",
      roles: { th: "thrower", ca: "catcher", ki: "kicker" },
      needs: [],
    },
    "ball-yard",
    [
      person("th", "m1", 0, 0, 0, [
        act("throwObject", { at: at("ca", "sternum") }, { anchor: "th" }),
        act("run", { to: to(0, 1.6), pace: "jog" }),
        act("gestureBeckon"),
        act("jump", { to: to(0, 1.8) }),
        act("jog", { to: to(-1.5, 2.6), face: 45 }),
        act("fistPump"),
        act("walk", { to: to(-0.4, 1.8), face: 0 }),
      ]),
      person("ca", "f1", 0, 5, 180, [
        act("catchObject", { from: "th", hands: "two", ball: "handball" }),
        act(
          "throwObject",
          { at: at("ki", "sternum"), prop: "handball", style: "underarm" },
          { anchor: "by-pass" },
        ),
        act("gestureClap"),
        act("jump", { to: to(0, 4.6) }),
        act("jog", { to: to(-0.8, 5.4), face: 180 }),
        act("fistPump"),
        act("handsOnHips", { seconds: 1.6 }),
      ]),
      person("ki", "m2", 2, 2, 270, [
        act("kickBall", { ball: "football" }),
        act("gestureBeckon"),
        act("catchObject", { from: "by-pass", hands: "two", ball: "handball" }),
        act("walk", { to: to(2, 1.3), face: 270 }),
        act("kickLeft", { ball: "football2" }),
        act("gestureCheer"),
        act("jog", { to: to(0.8, 1.6), face: 270 }),
      ]),
    ],
    // The ball caught lies at the thrower's feet, as the throw is mimed; the
    // footballs kicked lie ahead of the kicker, the second where he steps to.
    [
      object("handball", "createBall", "handball", 0, 0.3),
      object("football", "createBall", "football", 1.7, 2),
      object("football2", "createBall", "football", 1.7, 1.3),
    ],
  ),
  scene(
    {
      id: "martial-forms",
      title: "Martial arts forms",
      summary:
        "Three students run their forms and bow out together: the first sinks into a horse stance, punches four times, steps into a front stance and blocks low and high twice; the second runs the same form the other way round; the third shifts his weight through a tai chi transfer and sinks into a horse stance.",
      setting: "sport",
      roles: { k1: "student", k2: "student", k3: "student" },
      needs: [],
    },
    "forms",
    [
      person("k1", "m1", -1.2, 0, 0, [
        act("horseStance", { seconds: 1 }),
        act("karatePunches", { count: 4 }),
        act("frontStance", { hold: 0.5 }),
        act("lowBlock", { reps: 2 }),
        act("risingBlock", { reps: 2 }),
        act("gesture", { kind: "bow" }, { anchor: "mf-bow" }),
      ]),
      person("k2", "f1", 0, 0, 0, [
        act("frontStance", { hold: 0.5 }),
        act("lowBlock", { reps: 2 }),
        act("risingBlock", { reps: 2 }),
        act("horseStance", { seconds: 1 }),
        act("karatePunches", { count: 4 }),
        act("stand", { seconds: 0.5 }),
        act("gesture", { kind: "bow" }, { sync: { of: "mf-bow" } }),
      ]),
      person("k3", "m2", 1.2, 0, 0, [
        act("martialArt", { kind: "taiChiTransfer" }, { anchor: "mf-tai" }),
        act(
          "horseStance",
          { seconds: 1.5 },
          { sync: { of: "mf-tai", event: "relax" } },
        ),
        act("stand", { seconds: 3 }),
        act("gesture", { kind: "bow" }, { sync: { of: "mf-bow" } }),
      ]),
    ],
  ),
  scene(
    {
      id: "throwing-circle",
      title: "Throwing circle",
      summary:
        "A hammer thrower walks into the circle, circles his arms, practises two turns pivoting on the left foot, sets himself, turns three times through the throw and watches the hammer out before pumping a fist.",
      setting: "sport",
      roles: { thr: "hammer thrower" },
      needs: [],
    },
    "throwing-circle",
    [
      person("thr", "m2", 0, -2.2, 0, [
        act("walk", { to: to(0, 0), face: 0 }),
        act("armCircles", { reps: 2 }),
        act("hammerTurn", { reps: 2 }),
        act("stand", { seconds: 0.6 }),
        act("hammerTurn", { reps: 3 }),
        act("look", {
          target: { kind: "point", frame: "world", at: { x: 0, y: 3, z: 30 } },
          seconds: 1.2,
        }),
        act("fistPump"),
      ]),
    ],
  ),
];
