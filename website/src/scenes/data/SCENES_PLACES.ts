import type { IScene } from "../structures/IScene";
import { SceneBuild } from "./SceneBuild";

const { act, object, person, scene, to }: typeof SceneBuild = SceneBuild;

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
} = { rungs: 6, placed: 12, spacing: 0.3, start: 0.15 };

/** The everyday scenes at a door, a dressing table, a counter and a flight of stairs, each placed object sized by the same record its action reads. */
export const SCENES_PLACES: readonly IScene[] = [
  scene(
    {
      id: "left-luggage",
      title: "Left luggage",
      summary:
        "At the left-luggage counter an attendant lifts a tote by its handle and hands it over by the strap to the traveller beside him.",
      setting: "everyday",
      roles: { att: "attendant", trv: "traveller" },
      needs: [],
    },
    "left-luggage",
    [
      person("att", "m2", 0, 0.12, 0, [
        act("pickUp", { prop: "bag", handle: "handle" }),
        act("handOver", { prop: "bag", to: "trv", handle: "strap" }),
      ]),
      person("trv", "m2", -0.75, 0.05, 90, [
        act("stand", { seconds: 1 }),
        act("receive", { prop: "bag", from: "att", handle: "strap" }),
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
      title: "At a door",
      summary:
        "One person reaches for a hinged door's lever and holds it, the door staying shut, then waves over a friend, who walks up.",
      setting: "everyday",
      roles: { ada: "host", bea: "friend" },
      needs: [],
    },
    "doorway",
    [
      person("ada", "f1", 0, 0.7, 0, [
        act("openDoor", { door: "door", handle: "push", seconds: 1.5 }),
        act("comeHere"),
      ]),
      person("bea", "m1", 1.2, -1.5, 0, [
        act("stand", { seconds: 1.5 }),
        act("walk", { to: to(0.8, 0) }),
      ]),
    ],
    [object("door", "createDoor", "hinged", 0, 1)],
  ),
  scene(
    {
      id: "dressing-room",
      title: "Dressing room",
      summary:
        "Someone bends to a bag, takes a hat up from the counter and puts it on, takes a knee and rises, and rolls the shoulders.",
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
        act("kneel", { kind: "one", hold: 0.6 }),
        act("selfAction", { kind: "shoulderRoll" }),
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
        "createWearable",
        "hat",
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
        "One person climbs a flight of six stairs, another climbs six rungs of a fixed ladder, and a third steps over a kerb in the way and braces.",
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
      ]),
      person("eve", "m1", 0.5, 0, 0, [
        act("climbLadder", { ladder: "ladder", rungs: LADDER.rungs }),
      ]),
      person("fin", "m2", 2, -1, 0, [
        act("walk", { to: to(2, 0) }),
        act("stepOver", { obstacle: "kerb" }),
        act("brace", { kind: "push", seconds: 1 }),
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
