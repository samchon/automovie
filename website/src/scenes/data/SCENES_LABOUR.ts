import type { IScene } from "../structures/IScene";
import { SceneBuild } from "./SceneBuild";

const { act, at, object, person, scene, to }: typeof SceneBuild = SceneBuild;

/**
 * A work point the hands go to, world metres.
 *
 * @param x To the left of a person facing +Z.
 * @param y Height.
 * @param z Forward.
 * @returns The target.
 */
const point = (x: number, y: number, z: number): Record<string, unknown> => ({
  kind: "point",
  at: { x, y, z },
  frame: "world",
});

/** The work scenes of the lexicon's labour rows: a kitchen and a yard. */
export const SCENES_LABOUR: readonly IScene[] = [
  scene(
    {
      id: "kitchen-and-yard",
      title: "Kitchen and yard",
      summary:
        "Closing time at an inn: a cook stirs at the stove counter, a server scrubs the bar, a porter carries a bag in one hand and then hauls a heavy load in both, and a stable hand hurls a throw overarm to him.",
      setting: "work",
      roles: { kat: "cook", lev: "server", mak: "porter", nel: "stable hand" },
      needs: [],
    },
    "kitchen-and-yard",
    [
      person("kat", "f1", -2, 0, 0, [
        act("stir", { on: point(-2, SceneBuild.COUNTER_TOP + 0.1, 0.45) }),
      ]),
      person("lev", "m2", 0, 0.12, 0, [
        act("scrub", { on: point(0, SceneBuild.COUNTER_TOP, 0.45) }),
      ]),
      person("mak", "m2", 2, -1, 0, [
        act("carryBag", { to: to(2, 1) }),
        act("haul", { to: to(2, 2.5) }),
      ]),
      person("nel", "f2", 2, 6, 180, [
        act("hurl", { at: at("mak", "sternum") }),
      ]),
    ],
    [
      object("stove", "createTable", "counter", -2, 0.6, 180),
      object("bar", "createTable", "counter", 0, 0.65, 180),
    ],
  ),
];
