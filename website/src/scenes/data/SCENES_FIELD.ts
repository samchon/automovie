import type { IScene } from "../structures/IScene";
import { SceneBuild } from "./SceneBuild";

const { act, object, person, scene }: typeof SceneBuild = SceneBuild;

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
        "Two basketball players exchange a chest pass. The receiver catches the ball and the passer slides across and raises both hands.",
      setting: "sport",
      roles: { eli: "guard", fen: "forward" },
      needs: [],
    },
    "shoot-around",
    [
      person("eli", "f2", 0, 0, 0, [
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
        act("ballSport", {
          kind: "highHandContest",
          at: { x: 0, y: 1.4, z: 4 },
        }),
      ]),
      person("fen", "m1", 0, 4, 180, [
        act("stand", { seconds: 1 }),
        act(
          "stageCatch",
          { from: "chest", ball: "ball", intercept: 0.42 },
          { sync: { of: "chest" } },
        ),
      ]),
    ],
    [
      object("counter", "createTable", "counter", 0, 0.72, 180),
      object("ball", "createBall", "basketball", 0, 0.49, 0, 0.914),
    ],
  ),
  scene(
    {
      id: "vault-hall",
      title: "Vault hall",
      summary:
        "Two gymnasts: a cartwheel and a round-off to the right, and a handspring vault over a box from standing.",
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
        act("handspringVault", { on: "box" }),
      ]),
    ],
    [object("box", "createPlyoBox", "wood", 0, 1, 90)],
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
      person("hed", "f1", -1.2, 0, 0, [act("breaststroke")]),
      person("ivo", "m1", 0, 0, 0, [act("backstroke")]),
      person("jul", "f2", 1.2, 0, 0, [act("floating")]),
      person("kip", "m2", 2.4, 0, 0, [act("frontCrawl", { cycles: 4 })]),
      person("lum", "f1", 3.6, 0, 0, [act("treadWater")]),
    ],
  ),
];
