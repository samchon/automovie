import type { IScene } from "../structures/IScene";
import { SceneBuild } from "./SceneBuild";

const { act, object, person, scene }: typeof SceneBuild = SceneBuild;

/**
 * The seven upper-body lexicon families in four everyday sequences: a
 * speaker's phrase, nod and rest; contact with a bench and the face; a held
 * hat put on; and a held hammer used at the bench. Open targets are finite
 * world points, and prop rows follow the pick-up that establishes their hold.
 */
export const SCENES_UPPER: readonly IScene[] = [
  scene(
    {
      id: "upper-explanation",
      title: "A short explanation",
      summary:
        "A speaker points to a spot ahead, acknowledges it with a nod and lets both hands rest at the sides.",
      setting: "everyday",
      roles: { sam: "speaker" },
      needs: [],
    },
    "upper-explanation",
    [
      person("sam", "m1", 0, 0, 0, [
        act("pointAt", {
          target: {
            kind: "point",
            at: { x: -0.18, y: 1.35, z: 0.45 },
            frame: "world",
            normal: { x: 0, y: 0, z: -1 },
          },
          side: "right",
        }),
        act("gestureNod", { count: 1, hold: 0.2 }),
        act("restSide", { seconds: 0.8 }),
      ]),
    ],
  ),
  scene(
    {
      id: "upper-bench-break",
      title: "A pause at the bench",
      summary:
        "A worker taps the counter top with the right palm, then wipes the mouth with the same hand.",
      setting: "work",
      roles: { lee: "worker" },
      needs: [],
    },
    "upper-bench-break",
    [
      person("lee", "f1", 0, 0, 0, [
        act("touchTap", {
          target: {
            kind: "point",
            at: { x: -0.18, y: SceneBuild.COUNTER_TOP, z: 0.3 },
            frame: "world",
            normal: { x: 0, y: 1, z: 0 },
          },
          with: "palm",
          side: "right",
          count: 1,
          hold: 0.2,
        }),
        act("faceWipeMouth", { side: "right", count: 1 }),
      ]),
    ],
    [object("bench", "createTable", "counter", 0, 0.53, 180)],
  ),
  scene(
    {
      id: "upper-hat",
      title: "Choosing a hat",
      summary:
        "A guest takes a hat from the counter with the left hand, puts it on and lets the hands come down.",
      setting: "everyday",
      roles: { tai: "guest" },
      needs: [],
    },
    "upper-hat",
    [
      person("tai", "f2", 0, 0, 0, [
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
        act("dressHat", { prop: "hat", hand: "left" }),
      ]),
    ],
    [
      // Keep the existing dressing scene's left-hand counter and hat placement.
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
      id: "upper-hammer",
      title: "Two taps at the workbench",
      summary:
        "A carpenter picks up a hammer, taps the bench twice and keeps the hammer in hand.",
      setting: "work",
      roles: { pat: "carpenter" },
      needs: [],
    },
    "upper-hammer",
    [
      person("pat", "f1", 0, 0.12, 0, [
        act("pickUp", {
          prop: "hammer",
          handle: "grip",
          hand: "right",
          use: { tip: "face", line: "square" },
        }),
        act("toolHammer", {
          prop: "hammer",
          hand: "right",
          on: {
            kind: "point",
            at: { x: -0.1, y: SceneBuild.COUNTER_TOP, z: 0.4 },
            frame: "world",
          },
          cycles: 2,
        }),
      ]),
    ],
    [
      object("bench", "createTable", "counter", 0, 0.65, 180),

      // createTool's +Y working line lies forward on the bench.
      {
        ...object(
          "hammer",
          "createTool",
          "hammer",
          -0.18,
          0.42,
          0,
          SceneBuild.COUNTER_TOP,
        ),
        rotation: { x: Math.SQRT1_2, y: 0, z: 0, w: Math.SQRT1_2 },
      },
    ],
  ),
];
