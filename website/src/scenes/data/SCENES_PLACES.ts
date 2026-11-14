import type { IScene } from "../structures/IScene";
import { SceneBuild } from "./SceneBuild";

const { act, object, person, scene, to }: typeof SceneBuild = SceneBuild;

/**
 * The kerb stepped over on the stairs-and-ladder scene: a Euro crate lying
 * across the walker's way, its length along `+X` and its footprint centred
 * on (`x`, `z`). The crate is placed with these dimensions and the step over
 * is given its near side, height and depth from the same numbers, so the law
 * crosses exactly the solid the visitor sees.
 */
const KERB: {
  x: number;
  z: number;
  length: number;
  depth: number;
  height: number;
} = { x: 2, z: 0.38, length: 0.6, depth: 0.4, height: 0.2 };

/** How far a standing person's toes lie ahead of their floor point, metres (an estimate across the site's bodies), from which a climb measures where its stairs or ladder begin. */
const TOE: number = 0.14;

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
 * facing +Z, and the climb is given the same spacing and start for its
 * `rungs`. The hands reach about four rungs above the feet, so the ladder
 * stands twice as tall as the feet climb.
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
        "Someone bends to a bag, puts on a hat, takes a knee and rises, and rolls the shoulders.",
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
        act("dress", { item: "hat" }),
        act("kneel", { kind: "one", hold: 0.6 }),
        act("selfAction", { kind: "shoulderRoll" }),
      ]),
    ],
    [object("bag", "createBag", "tote", -0.15, 0.35)],
  ),
  scene(
    {
      id: "stairs-and-ladder",
      title: "Stairs and ladder",
      summary:
        "One person climbs a flight of six stairs, another climbs six rungs of a fixed ladder, and a third steps over a crate lying in the way and braces.",
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
        act("climbLadder", {
          rungs: LADDER.rungs,
          spacing: LADDER.spacing,
          start: LADDER.start,
        }),
      ]),
      person("fin", "m2", 2, -1, 0, [
        act("walk", { to: to(2, 0) }),
        act("stepOver", {
          obstacle: {
            at: { x: KERB.x, y: 0, z: KERB.z - KERB.depth / 2 },
            height: KERB.height,
            depth: KERB.depth,
          },
        }),
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
      object(
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
      object("kerb", "createLoad", "crate", KERB.x, KERB.z, 0, 0, {
        length: KERB.length,
        depth: KERB.depth,
        height: KERB.height,
      }),
    ],
  ),
];
