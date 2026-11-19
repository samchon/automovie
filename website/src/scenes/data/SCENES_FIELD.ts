import type { IScene } from "../structures/IScene";
import { SceneBuild } from "./SceneBuild";

const { act, object, person, scene }: typeof SceneBuild = SceneBuild;

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
        "A small-sided game: a throw-in, a header, a chest and a thigh trap, and a left-footed shot the keeper dives right for at the instant it is struck.",
      setting: "sport",
      roles: {
        ali: "winger",
        bea: "midfielder",
        cyr: "striker",
        dag: "goalkeeper",
      },
      needs: [],
      refusedUntil: 3549,
    },
    "five-a-side",
    [
      person("ali", "m1", -3, 0, 90, [act("throwIn")]),
      person("bea", "f1", 0, 0, 270, [act("header")]),
      person("cyr", "m2", 0, 3, 0, [
        act("chestTrap"),
        act("thighTrap"),
        act("kickLeft", { ball: "ball" }, { anchor: "shot" }),
      ]),
      person("dag", "m1", 0, 11, 180, [
        act("stand", { seconds: 6 }),
        act("goalkeeperDiveRight", {}, { sync: { of: "shot" } }),
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
        "The guard picks up the ball from the court and chest-passes to the forward. The guard slides and raises both hands as the forward shoots at the rim.",
      setting: "sport",
      roles: { eli: "guard", fen: "forward" },
      needs: [],
    },
    "shoot-around",
    [
      person("eli", "f2", 0, 1.2, 0, [
        act("pickUp", { prop: "ball", handle: "grip", lift: 0.15 }),
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
      ]),
      person("fen", "m1", 0, 4, 180, [
        act("stand", { seconds: 1 }),
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
        "One gymnast practices a cartwheel and a round-off. The other performs a standing handspring vault with hands on the box and feet landing on a mat.",
      setting: "sport",
      roles: { eun: "gymnast", flo: "gymnast" },
      needs: [],
      view: "side",
    },
    "vault-hall",
    [
      person("eun", "f1", -3, -3.5, 90, [
        act("cartwheelRight"),
        act("roundOffRight"),
      ]),
      person("flo", "f2", -1.5, 1, 90, [
        act("stand", { seconds: 0.5 }),
        act("handspringVault", { on: "box", landOn: "mat" }),
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
        "Five swimmers: breaststroke, backstroke, floating on the back, four cycles of front crawl, and treading water.",
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
      person("hed", "f1", -1.2, 0, 0, [
        act("breaststroke", { water: SWIM_POOL.water }),
      ]),
      person("ivo", "m1", 0, 0, 0, [
        act("backstroke", { water: SWIM_POOL.water }),
      ]),
      person("jul", "f2", 1.2, 0, 0, [
        act("floating", { water: SWIM_POOL.water }),
      ]),
      person("kip", "m2", 2.4, 0, 0, [
        act("frontCrawl", { cycles: 4, water: SWIM_POOL.water }),
      ]),
      person("lum", "f1", 3.6, 0, 0, [
        act("treadWater", { water: SWIM_POOL.water }),
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
