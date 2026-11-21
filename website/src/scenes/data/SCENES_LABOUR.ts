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
const point = (x: number, y: number, z: number): SceneBuild.PointTarget => ({
  kind: "point",
  at: { x, y, z },
  frame: "world",
});

/** Inside the stove counter's saucepan, where the cook's spoon stirs. */
const PAN: SceneBuild.PropTarget = {
  kind: "prop",
  subject: "pan",
  point: "inside",
};

/** The work scenes of the lexicon's labour rows: a kitchen and a yard. */
export const SCENES_LABOUR: readonly IScene[] = [
  scene(
    {
      id: "kitchen-and-yard",
      title: "Kitchen and yard",
      summary:
        "At an inn a cook stirs, a server wipes the bar, and a stable hand throws to a porter.",
      setting: "work",
      roles: { kat: "cook", lev: "server", mak: "porter", nel: "stable hand" },
      needs: [],
    },
    "kitchen-and-yard",
    [
      person("kat", "f1", -2, 0, 0, [
        act("pickUp", {
          prop: "spoon",
          handle: "grip",
          use: { tip: "face", line: "square" },
        }),
        act("stir", { prop: "spoon", on: PAN }),
        act("look", { target: at("lev", "face"), cue: "seen" }),
        act("gesture", { kind: "nod" }),
        act("stir", { prop: "spoon", on: PAN, cycles: 6 }),
        act("look", { target: at("mak", "face"), cue: "seen" }),
        act("stir", { prop: "spoon", on: PAN, cycles: 6 }),
      ]),
      person("lev", "m2", 0, 0.12, 0, [
        act("scrub", { on: point(0, SceneBuild.COUNTER_TOP, 0.45) }),
        act("gesture", { kind: "touchFace" }),
        act("wipe", {
          on: point(-0.1, SceneBuild.COUNTER_TOP, 0.42),
          cycles: 3,
        }),
        act("gesture", { kind: "squareShoulders" }),
        act("wipe", {
          on: point(-0.2, SceneBuild.COUNTER_TOP, 0.4),
          cycles: 1,
        }),
      ]),
      person("mak", "m2", 2, -1, 0, [
        act("carryBag", { to: to(2, 1) }),
        act("haul", { to: to(2, 2.5) }),
        act("gesture", { kind: "touchFace" }),
        act("gesture", { kind: "raiseHand" }, { anchor: "ky-ready" }),
        act("thumbsUp"),
        act("carryBag", { to: to(2, 4) }),
        act("gesture", { kind: "nod" }),
      ]),
      person("nel", "f2", 2, 6, 180, [
        act("checkWatch"),
        act("gesture", { kind: "rubHands" }),
        act("gesture", { kind: "raiseHand" }),
        act("stand", { seconds: 1.5 }),
        act(
          "hurl",
          { at: at("mak", "sternum") },
          {
            sync: {
              of: "ky-ready",
              event: "strokeEnd",
              align: "release",
              offset: 0.2,
            },
          },
        ),
        act("gesture", { kind: "wave" }),
        act("gesture", { kind: "nod" }),
      ]),
    ],
    [
      object("stove", "createTable", "counter", -2, 0.6, 180),
      object(
        "pan",
        "createCookingPot",
        "saucepan",
        -1.95,
        0.5,
        0,
        SceneBuild.COUNTER_TOP,
      ),
      // The spoon lies level on the counter by the pan, its bowl toward the
      // far side: `createSpoon` stands the spoon along +Y from the butt of its
      // handle, so it is turned a quarter turn about +X.
      {
        ...object(
          "spoon",
          "createSpoon",
          undefined,
          -2.2,
          0.34,
          0,
          SceneBuild.COUNTER_TOP,
        ),
        rotation: { x: Math.SQRT1_2, y: 0, z: 0, w: Math.SQRT1_2 },
      },
      object("bar", "createTable", "counter", 0, 0.65, 180),
    ],
  ),
];
