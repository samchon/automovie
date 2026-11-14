import type { IScene } from "../structures/IScene";
import { SceneBuild } from "./SceneBuild";

const { act, at, object, person, scene }: typeof SceneBuild = SceneBuild;

/**
 * A ball resting on the floor, as a kick's target: its centre a football's
 * radius up (0.11 m), ahead of where the support foot plants.
 *
 * @param x To the left of a person facing +Z, metres.
 * @param z Forward, metres.
 * @returns The target.
 */
const ball = (x: number, z: number): Record<string, unknown> => ({
  kind: "point",
  at: { x, y: 0.11, z },
  frame: "world",
});

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
    },
    "five-a-side",
    [
      person("ali", "m1", -3, 0, 90, [act("throwIn")]),
      person("bea", "f1", 0, 0, 270, [act("header")]),
      person("cyr", "m2", 0, 3, 0, [
        act("chestTrap"),
        act("thighTrap"),
        act("kickLeft", { ball: ball(0, 3.3) }, { anchor: "shot" }),
      ]),
      person("dag", "m1", 0, 11, 180, [
        act("stand", { seconds: 6 }),
        act("goalkeeperDiveRight", {}, { sync: { of: "shot" } }),
      ]),
    ],
  ),
  scene(
    {
      id: "shoot-around",
      title: "Shoot-around",
      summary:
        "Two basketball players: one dribbles on the spot and throws a chest pass, the other catches it in both hands and slides across in defence.",
      setting: "sport",
      roles: { eli: "guard", fen: "forward" },
      needs: [],
    },
    "shoot-around",
    [
      person("eli", "f2", 0, 0, 0, [
        act("dribble", { count: 4 }),
        act("pushPass", { at: at("fen", "sternum") }, { anchor: "chest" }),
      ]),
      person("fen", "m1", 0, 4, 180, [
        act("stand", { seconds: 1 }),
        act("twoHandCatch", { from: "chest" }),
        act("defensiveSlide"),
      ]),
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
      person("eun", "f1", -3, -1.5, 90, [
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
