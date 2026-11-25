import type { IScene } from "../structures/IScene";
import { SceneBuild } from "./SceneBuild";

const { act, at, object, person, scene, to }: typeof SceneBuild = SceneBuild;

/** The striker's receiving mark for the throw-in. */
const RECEIVING_MARK: ReturnType<typeof to> = to(0, 3);

/** World-space centre and dimensions of the Swim Strokes pool, in metres. */
const SWIM_POOL: Readonly<{
  x: number;
  z: number;
  water: number;
  length: number;
  edgeWidth: number;
  freeboard: number;
}> = { x: 1.2, z: 0.5, water: 1.1, length: 13, edgeWidth: 2.5, freeboard: 0.3 };

/**
 * The sport scenes of the lexicon's football, basketball, gymnastics and
 * swimming rows.
 */
export const SCENES_FIELD: readonly IScene[] = [
  scene(
    {
      id: "five-a-side",
      title: "Throw-in and goal",
      summary:
        "A throw-in is headed on and chest-trapped, and the striker scores past a diving keeper.",
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
        act("look", { recruit: "trunk", target: at("bea", "face") }),
        act("gesture", {
          kind: "point",
          target: {
            kind: "point",
            frame: "world",
            at: { ...RECEIVING_MARK, y: 1.4 },
          },
        }),
        act("throwIn", {}, { anchor: "fs-throw" }),
        act("jog", { to: to(-1.5, 1.5) }),
        act("gesture", { kind: "cheer" }),
      ]),
      person("bea", "f1", 2.5, -2, 270, [
        act("jog", { to: to(0.5, -3) }),
        act("jog", { to: to(0, 0), face: 270 }),
        act("gesture", { kind: "raiseHand", hand: "left" }),
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
        act("jog", { to: RECEIVING_MARK, face: 0 }),
        act("gesture", { kind: "raiseHand", hand: "left" }),
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
    [object("ball", "createSphericalBall", "football", 0, 3.3)],
  ),
  scene(
    {
      id: "shoot-around",
      title: "Shoot-around",
      summary:
        "A guard passes to a forward, contests his shot at the rim and shakes her head.",
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
        act("look", { recruit: "trunk", target: at("fen", "face") }),
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
          recruit: "trunk",
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
        act("gesture", { kind: "raiseHand", hand: "left" }),
        act(
          "stageCatch",
          { partner: "chest", ball: "ball", intercept: 0.42 },
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
      object("ball", "createSphericalBall", "basketball", 0, 1.69),
      {
        ...object("hoop", "createBasketballHoop", undefined, 0, -0.85, 0, 0, {
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
        "One gymnast tumbles a floor line; the other vaults the box twice onto a mat.",
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
        act("stand", { hold: 0.3 }),
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
        "Five swimmers switch between breaststroke, backstroke, crawl, treading water and floating.",
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
        act("breaststroke", { count: 6, water: SWIM_POOL.water }),
        act("treadWater", { count: 3, water: SWIM_POOL.water }),
        act("backstroke", { count: 3, water: SWIM_POOL.water }),
      ]),
      person("ivo", "m1", 0, 4.5, 0, [
        act("backstroke", { count: 6, water: SWIM_POOL.water }),
        act("treadWater", { count: 2, water: SWIM_POOL.water }),
        act("frontCrawl", { count: 3, water: SWIM_POOL.water }),
      ]),
      person("jul", "f2", 1.2, -4.5, 0, [
        act("treadWater", { count: 2, water: SWIM_POOL.water }),
        act("floating", { count: 3, water: SWIM_POOL.water }),
        act("treadWater", { count: 2, water: SWIM_POOL.water }),
        act("breaststroke", { count: 4, water: SWIM_POOL.water }),
      ]),
      person("kip", "m2", 2.4, -4.5, 0, [
        act("frontCrawl", { count: 6, water: SWIM_POOL.water }),
        act("treadWater", { count: 2, water: SWIM_POOL.water }),
        act("backstroke", { count: 3, water: SWIM_POOL.water }),
      ]),
      person("lum", "f1", 3.6, -4.5, 0, [
        act("treadWater", { count: 3, water: SWIM_POOL.water }),
        act("frontCrawl", { count: 5, water: SWIM_POOL.water }),
        act("treadWater", { count: 5, water: SWIM_POOL.water }),
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
