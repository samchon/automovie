import type { IScene } from "../structures/IScene";
import { SceneBuild } from "./SceneBuild";

const { act, at, object, person, scene, to }: typeof SceneBuild = SceneBuild;

/**
 * A point on a counter top in front of a person facing +Z, just behind its
 * front edge.
 *
 * @param x Along the counter, metres.
 * @returns The target.
 */
const work = (x: number): SceneBuild.PointTarget => ({
  kind: "point",
  at: { x, y: SceneBuild.COUNTER_TOP, z: 0.37 },
  frame: "world",
});

/**
 * A knock's place on the doorway scene's door, on the face toward the
 * host at chest height beside the lever: the door stands at z = 1.
 */
const KNOCK: SceneBuild.PointTarget = {
  kind: "point",
  frame: "world",
  at: { x: 0.05, y: 1.4, z: 0.97 },
  normal: { x: 0, y: 0, z: -1 },
};

/**
 * The kerb stepped over on the stairs-and-ladder scene, across the walker's
 * way: `createKerb` stands with its back face at its origin and its front
 * edge toward `+Z`, so it is turned half round to face the walker coming up
 * `+Z`, its origin (`x`, `z`) its back. The step over reads the edge, the
 * height and the depth from the kerb itself.
 */
const KERB: { x: number; z: number } = { x: 2, z: 0.31 };

/** How far a standing person's toes lie ahead of their floor point, metres (an estimate across the site's bodies), from which a climb measures where its stairs or ladder begin. */
const TOE: number = 0.2;

/**
 * The flight climbed on the stairs-and-ladder scene: the stairs are placed
 * with these risers and treads, their first riser `start` ahead of the
 * toes, and the climb is given the same numbers, so the feet land on the
 * treads the visitor sees.
 */
const STAIRS: { count: number; riser: number; tread: number; start: number } = {
  count: 6,
  riser: 0.17,
  tread: 0.28,
  start: 0.05,
};

/**
 * The fixed ladder climbed on the same scene: placed with `placed` rungs at
 * this spacing, its rungs `start` ahead of the toes and turned to be climbed
 * facing +Z, and the climb reads its rungs from the ladder itself, the feet
 * climbing `rungs` of them. The hands reach about four rungs above the
 * feet, so the ladder stands twice as tall as the feet climb.
 */
const LADDER: {
  rungs: number;
  placed: number;
  spacing: number;
  start: number;
} = { rungs: 4, placed: 8, spacing: 0.3, start: 0.15 };

/** The everyday scenes at a door, a dressing table, a counter and a flight of stairs, each placed object sized by the same record its action reads. */
export const SCENES_PLACES: readonly IScene[] = [
  scene(
    {
      id: "left-luggage",
      title: "Left luggage",
      summary:
        "An attendant hands a traveller his tote over the counter, and the traveller hurries off.",
      setting: "everyday",
      roles: { att: "attendant", trv: "traveller" },
      needs: [],
    },
    "left-luggage",
    [
      person("att", "m2", 0, 0.12, 0, [
        act("rubEyes"),
        act("look", {
          with: "trunk",
          cue: "seen",
          target: at("trv", "face"),
          seconds: 1.5,
        }),
        act("gesture", { kind: "nod" }),
        act("pickUp", { prop: "bag", handle: "handle" }),
        act("handOver", { prop: "bag", to: "trv", handle: "strap" }),
        act("gesture", { kind: "wave", count: 2 }),
        act("wipe", { on: work(-0.15), cycles: 3 }),
      ]),
      person("trv", "m2", -0.75, 0.05, 90, [
        act("checkWatch"),
        act("gesture", { kind: "raiseHand", side: "left" }),
        act("receive", { prop: "bag", from: "att", handle: "strap" }),
        act("gesture", { kind: "nod" }),
        act("gesture", { kind: "wave", side: "left", count: 2 }),
        act("hurry", { to: to(-2.2, -0.5) }),
      ]),
    ],
    [
      object("counter", "createTable", "counter", 0, 0.65, 180),
      object(
        "bag",
        "createBag",
        "tote",
        -0.18,
        0.42,
        90,
        SceneBuild.COUNTER_TOP,
      ),
    ],
  ),
  scene(
    {
      id: "doorway",
      title: "Locked door",
      summary:
        "A woman knocks and tries a locked door, waves a friend over and tries again.",
      setting: "everyday",
      roles: { ada: "host", bea: "friend" },
      needs: [],
    },
    "doorway",
    [
      person("ada", "f1", 0, -1.2, 0, [
        act("walk", { to: to(0, 0.7) }),
        act("touch", {
          target: KNOCK,
          kind: "tap",
          with: "fist",
          side: "right",
          count: 3,
        }),
        act("look", {
          with: "head",
          target: { ...KNOCK, at: { x: 0, y: 1.9, z: 1 } },
          seconds: 1,
        }),
        act("openDoor", { door: "door", handle: "push", seconds: 1.5 }),
        act("dontKnow"),
        act("look", {
          with: "trunk",
          cue: "seen",
          target: at("bea", "face"),
          seconds: 0.9,
        }),
        act("comeHere", {}, { anchor: "door-beckon" }),
        act("openDoor", { door: "door", handle: "push", seconds: 1.5 }),
        act("handsOnHips", { seconds: 1.6 }),
      ]),
      person("bea", "m1", 1.2, -1.5, 0, [
        act("checkPhone"),
        act("look", {
          with: "head",
          cue: "seen",
          target: at("ada", "face"),
          seconds: 1.2,
        }),
        act("checkWatch"),
        act(
          "walk",
          { to: to(0.55, 0.4) },
          {
            sync: {
              of: "door-beckon",
              event: "strokeStart",
              latency: "reaction",
            },
          },
        ),
        act("shoulderPat", { target: at("ada", "shoulderLeft") }),
      ]),
    ],
    [object("door", "createDoor", "hinged", 0, 1)],
  ),
  scene(
    {
      id: "dressing-room",
      title: "Dressing room",
      summary:
        "An actor puts on a hat, checks a mirror, takes a knee and squares her shoulders.",
      setting: "everyday",
      roles: { cyd: "actor" },
      needs: [],
    },
    "dressing",
    [
      person("cyd", "f2", 0, 0, 0, [
        act("bend", {
          toward: { kind: "prop", subject: "bag", point: "handle" },
          strategy: "squat",
        }),
        act("pickUp", {
          prop: "hat",
          handle: "hold",
          hand: "left",
          use: {
            tip: "wear",
            line: "worn",
            at: { region: "crown" },
            round: true,
          },
        }),
        act("dress", { item: "hat", prop: "hat" }),
        act("look", {
          with: "head",
          target: {
            kind: "point",
            frame: "performer",
            at: { x: 0.3, y: 1.6, z: 1.5 },
          },
          seconds: 1,
        }),
        act("kneel", { kind: "one", hold: 0.6 }),
        act("selfAction", { kind: "shoulderRoll" }),
        act("handsOnHips", { seconds: 1 }),
        act("gesture", { kind: "squareShoulders" }),
      ]),
    ],
    [
      object("bag", "createBag", "tote", -0.3, 0.55),
      // A counter to the left of the bag and the hat near its front edge in
      // line with the left shoulder, the mirror of `SceneBuild.counter`'s
      // place for the right hand, so the left hand takes it standing.
      object("counter", "createTable", "counter", 0.6, 0.53, 180),
      object(
        "hat",
        "createHat",
        undefined,
        0.18,
        0.3,
        0,
        SceneBuild.COUNTER_TOP,
      ),
    ],
  ),
  scene(
    {
      id: "stairs-and-ladder",
      title: "Stairs and ladder",
      summary:
        "One person climbs stairs and cheers another up a ladder, which a third holds steady.",
      setting: "everyday",
      roles: { dot: "climber", eve: "climber", fin: "walker" },
      needs: [],
    },
    "climb",
    [
      person("dot", "f1", -1.5, 0, 0, [
        act("climbStairs", {
          pattern: "stepOverStep",
          count: STAIRS.count,
          riser: STAIRS.riser,
          tread: STAIRS.tread,
          start: STAIRS.start,
        }),
        act("look", {
          with: "trunk",
          cue: "seen",
          target: at("eve", "face"),
          seconds: 1.5,
        }),
        act("gesture", { kind: "cheer" }),
        act("gesture", { kind: "clap", count: 4 }),
        act("handsOnHips", { seconds: 1.2 }),
        act("gesture", { kind: "wave", count: 2 }),
      ]),
      person("eve", "m1", 0.5, 0, 0, [
        act("climbLadder", { ladder: "ladder", rungs: LADDER.rungs }),
      ]),
      person("fin", "m2", 2, -1, 0, [
        act("walk", { to: to(2, 0) }),
        act("stepOver", { obstacle: "kerb" }),
        act("walk", { to: to(0.5, 0.85), face: 180 }),
        act("touch", {
          target: { kind: "prop", subject: "ladder", point: "leftRail" },
          kind: "hold",
          hold: 3,
        }),
        act("look", {
          with: "head",
          cue: "seen",
          target: at("eve", "face"),
          seconds: 1.5,
        }),
        act("thumbsUp"),
      ]),
    ],
    [
      object(
        "stairs",
        "createStairs",
        undefined,
        -1.5,
        TOE + STAIRS.start,
        0,
        0,
        {
          steps: STAIRS.count,
          riser: STAIRS.riser,
          tread: STAIRS.tread,
        },
      ),
      // A fixture, so the hands that grip its rungs bear on it.
      {
        ...object(
          "ladder",
          "createLadder",
          "fixed",
          0.5,
          TOE + LADDER.start,
          180,
          0,
          {
            rungs: LADDER.placed,
            spacing: LADDER.spacing,
          },
        ),
        fixed: true,
      },
      object("kerb", "createKerb", "kerb", KERB.x, KERB.z, 180),
    ],
  ),
];
