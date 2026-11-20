import type { IScene } from "../structures/IScene";
import { SceneBuild } from "./SceneBuild";

const { act, at, object, person, scene, to }: typeof SceneBuild = SceneBuild;

/** World-space centre and dimensions of the Swim Strokes pool, in metres. */
const SWIM_POOL: Readonly<{
  x: number;
  z: number;
  water: number;
  length: number;
  edgeWidth: number;
  freeboard: number;
}> = { x: 1.2, z: 0.5, water: 1.1, length: 13, edgeWidth: 2.5, freeboard: 0.3 };

/** The sport scenes of the lexicon's football, basketball, gymnastics and swimming rows. */
export const SCENES_FIELD: readonly IScene[] = [
  scene(
    {
      id: "five-a-side",
      title: "Five-a-side",
      summary:
        "A small-sided game builds to a shot: the winger jogs to the touchline, looks up and points the striker into space; the midfielder checks away and back and calls for the ball, the striker makes a run and comes back with a hand up, and the keeper claps, points out his marker, shuffles across his line and holds up a palm. The winger's throw-in is headed on by the midfielder, the striker chest-traps and thigh-traps it and shoots left-footed as the keeper dives right; the winger and the midfielder cheer, the striker pumps a fist and the keeper picks himself up.",
      setting: "sport",
      roles: {
        ali: "winger",
        bea: "midfielder",
        cyr: "striker",
        dag: "goalkeeper",
      },
      needs: [],
    },
    "five-a-side",
    [
      person("ali", "m1", -3, -5.4, 0, [
        act("jog", { to: to(-3, 0), face: 90 }),
        act("look", { with: "trunk", target: at("bea", "face") }),
        act("gesture", { kind: "point", target: at("cyr", "face") }),
        act("throwIn", {}, { anchor: "fs-throw" }),
        act("jog", { to: to(-1.5, 1.5) }),
        act("gesture", { kind: "cheer" }),
      ]),
      person("bea", "f1", 2.5, -2, 270, [
        act("jog", { to: to(0.5, -3) }),
        act("jog", { to: to(0, 0), face: 270 }),
        act("gesture", { kind: "raiseHand", side: "left" }),
        act(
          "header",
          {},
          {
            anchor: "fs-header",
            sync: {
              of: "fs-throw",
              event: "stroke",
              align: "contact1",
              offset: 0.6,
            },
          },
        ),
        act("jog", { to: to(0.9, 2.6) }),
        act("gesture", { kind: "cheer" }),
      ]),
      person("cyr", "m2", 2, 1, 0, [
        act("jog", { to: to(2.3, 4) }),
        act("jog", { to: to(0, 3), face: 0 }),
        act("gesture", { kind: "raiseHand", side: "left" }),
        act(
          "chestTrap",
          {},
          {
            sync: {
              of: "fs-header",
              event: "contact1",
              align: "contact1",
              offset: 0.5,
            },
          },
        ),
        act("thighTrap"),
        act("kickLeft", { ball: "ball" }, { anchor: "shot" }),
        act("fistPump"),
      ]),
      person("dag", "m1", 0, 11, 180, [
        act("gesture", { kind: "clap", count: 2 }),
        act("gesture", { kind: "point", target: at("bea", "face") }),
        act("step", { direction: "left", steps: 1 }),
        act("step", { direction: "right", steps: 2 }),
        act("step", { direction: "left", steps: 1 }),
        act("gesture", { kind: "clap", count: 2 }),
        act("gesture", { kind: "stopPalm" }),
        act("step", { direction: "right", steps: 1 }),
        act("step", { direction: "left", steps: 1 }),
        act("goalkeeperDiveRight", {}, { sync: { of: "shot" } }),
        act("getUp"),
      ]),
    ],
    // The ball at the striker's feet, ahead of where the support foot plants.
    [object("ball", "createBall", "football", 0, 3.3)],
  ),
  scene(
    {
      id: "shoot-around",
      title: "Shoot-around",
      summary:
        "The guard claps for the ball, jogs to it, picks it up and looks for the forward, who has cut out to the wing and back with a hand up to call for it. She chest-passes to him, slides and raises both hands as he shoots at the rim, then turns to watch it and shakes her head as he pumps a fist.",
      setting: "sport",
      roles: { eli: "guard", fen: "forward" },
      needs: [],
    },
    "shoot-around",
    [
      person("eli", "f2", 0, -0.6, 0, [
        act("gesture", { kind: "clap", count: 3 }),
        act("jog", { to: to(0, 1.2), face: 0 }),
        act("pickUp", { prop: "ball", handle: "grip", lift: 0.15 }),
        act("look", { with: "trunk", target: at("fen", "face") }),
        act(
          "ballSport",
          {
            kind: "chestPass",
            prop: "ball",
            at: { x: 0, y: 1.3, z: 3.45 },
            flightSeconds: 0.42,
          },
          { anchor: "chest" },
        ),
        act("defensiveSlide"),
        act(
          "ballSport",
          { kind: "highHandContest", at: { x: 0, y: 1.9, z: 4 } },
          {
            anchor: "contest",
            sync: {
              of: "chest",
              event: "stroke",
              align: "stroke",
              offset: 3.18,
            },
          },
        ),
        act("look", {
          with: "trunk",
          cue: "seen",
          target: {
            kind: "point",
            frame: "world",
            at: { x: 0, y: 3.05, z: -0.474 },
          },
        }),
        act("gesture", { kind: "shakeHead" }),
      ]),
      person("fen", "m1", 2.4, 5.2, 270, [
        act("jog", { to: to(1.6, 6.6) }),
        act("jog", { to: to(0, 4), face: 180 }),
        act("gesture", { kind: "raiseHand", side: "left" }),
        act(
          "stageCatch",
          { from: "chest", ball: "ball", intercept: 0.42 },
          { sync: { of: "chest" } },
        ),
        // Both players' strokes use the same pass cue. The ring centre is
        // 0.151 m of clearance and half the 0.45 m opening from the board.
        act(
          "ballSport",
          {
            kind: "setShot",
            prop: "ball",
            at: { x: 0, y: 3.05, z: -0.474 },
            flightSeconds: 1.12,
          },
          {
            anchor: "basket-shot",
            sync: {
              of: "chest",
              event: "stroke",
              align: "stroke",
              offset: 3.18,
            },
          },
        ),
        act("fistPump"),
      ]),
    ],
    [
      object("ball", "createBall", "basketball", 0, 1.69),
      {
        ...object("hoop", "createGoal", "basketballHoop", 0, -0.85, 0, 0, {
          ring: 0.45,
          thickness: 0.013,
        }),
        fixed: true,
      },
      {
        // The pier meets the back of the board, beside the ball's path.
        ...object("hoop-pier", "createWall", "low", 0.8, -0.962, 0, 1.5, {
          height: 0.43,
          length: 3,
          thickness: 0.2,
        }),
        fixed: true,
        rotation: { x: 0, y: 0, z: Math.SQRT1_2, w: Math.SQRT1_2 },
      },
    ],
  ),
  scene(
    {
      id: "vault-hall",
      title: "Vault hall",
      summary:
        "One gymnast salutes and works a floor line: a cartwheel, a round-off, a front handspring and a held handstand, then lifts both arms to finish. The other salutes, performs a standing handspring vault with hands on the box and feet landing on a mat, jogs back round the box to her mark and vaults again, lifting both arms on the landing.",
      setting: "sport",
      roles: { eun: "gymnast", flo: "gymnast" },
      needs: [],
      view: "side",
    },
    "vault-hall",
    [
      person("eun", "f1", -3, -3.5, 90, [
        act("gesture", { kind: "raiseHand" }),
        act("cartwheelRight"),
        act("roundOffRight"),
        act("stand", { seconds: 0.3 }),
        act("frontHandspring"),
        act("handstand"),
        act("gesture", { kind: "cheer" }),
      ]),
      person("flo", "f2", -1.5, 1, 90, [
        act("gesture", { kind: "raiseHand" }),
        act("handspringVault", { on: "box", landOn: "mat" }),
        act("jog", { to: to(-0.3, 2.2) }),
        act("jog", { to: to(-1.5, 1), face: 90 }),
        act("handspringVault", { on: "box", landOn: "mat" }),
        act("gesture", { kind: "raiseHand" }),
      ]),
    ],
    [
      object("box", "createPlyoBox", "wood", 0, 1, 90),
      object("mat", "createExerciseMat", "gym", 1.4, 1, 90),
    ],
  ),
  scene(
    {
      id: "swim-strokes",
      title: "Swim strokes",
      summary:
        "Five swimmers work through a set: one swims breaststroke up the pool, stops to tread water and backstrokes home; one backstrokes down, treads and crawls back; one treads, floats on her back, treads again and breaststrokes off; one crawls up the pool, treads and backstrokes; and one treads water, crawls up the pool and treads again.",
      setting: "sport",
      roles: {
        hed: "swimmer",
        ivo: "swimmer",
        jul: "swimmer",
        kip: "swimmer",
        lum: "swimmer",
      },
      needs: [],
    },
    "swim-strokes",
    [
      person("hed", "f1", -1.2, -4.5, 0, [
        act("breaststroke", { cycles: 6, water: SWIM_POOL.water }),
        act("treadWater", { cycles: 3, water: SWIM_POOL.water }),
        act("backstroke", { cycles: 3, water: SWIM_POOL.water }),
      ]),
      person("ivo", "m1", 0, 4.5, 0, [
        act("backstroke", { cycles: 6, water: SWIM_POOL.water }),
        act("treadWater", { cycles: 2, water: SWIM_POOL.water }),
        act("frontCrawl", { cycles: 3, water: SWIM_POOL.water }),
      ]),
      person("jul", "f2", 1.2, -4.5, 0, [
        act("treadWater", { cycles: 2, water: SWIM_POOL.water }),
        act("floating", { cycles: 3, water: SWIM_POOL.water }),
        act("treadWater", { cycles: 2, water: SWIM_POOL.water }),
        act("breaststroke", { cycles: 4, water: SWIM_POOL.water }),
      ]),
      person("kip", "m2", 2.4, -4.5, 0, [
        act("frontCrawl", { cycles: 6, water: SWIM_POOL.water }),
        act("treadWater", { cycles: 2, water: SWIM_POOL.water }),
        act("backstroke", { cycles: 3, water: SWIM_POOL.water }),
      ]),
      person("lum", "f1", 3.6, -4.5, 0, [
        act("treadWater", { cycles: 3, water: SWIM_POOL.water }),
        act("frontCrawl", { cycles: 5, water: SWIM_POOL.water }),
        act("treadWater", { cycles: 5, water: SWIM_POOL.water }),
      ]),
    ],
    [
      object(
        "water",
        "createPoolWater",
        undefined,
        SWIM_POOL.x,
        SWIM_POOL.z,
        0,
        SWIM_POOL.water,
        {
          width: 3 * SWIM_POOL.edgeWidth,
          length: SWIM_POOL.length,
        },
      ),
      ...([-1, 1] as const).flatMap(
        (end: -1 | 1): ReturnType<typeof object>[] =>
          [-1, 0, 1].map(
            (segment: number): ReturnType<typeof object> =>
              object(
                `deck-${end < 0 ? "south" : "north"}-${segment + 2}`,
                "createPoolEdge",
                "deckEdge",
                SWIM_POOL.x + segment * SWIM_POOL.edgeWidth,
                SWIM_POOL.z + (end * SWIM_POOL.length) / 2,
                end < 0 ? 0 : 180,
                SWIM_POOL.water + SWIM_POOL.freeboard,
                { width: SWIM_POOL.edgeWidth, freeboard: SWIM_POOL.freeboard },
              ),
          ),
      ),
    ],
  ),
];
