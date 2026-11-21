import type { IAutoMovieVector3 } from "@automovie/interface";

import type { IScene } from "../structures/IScene";
import { SceneBuild } from "./SceneBuild";

const { act, object, person, scene }: typeof SceneBuild = SceneBuild;

/**
 * A world point, as a look's, a point's or a touch's target.
 *
 * @param x To the left of a person facing +Z.
 * @param y Height.
 * @param z Forward.
 * @param normal The point's outward normal, when the target needs one.
 * @returns The target.
 */
const point = (
  x: number,
  y: number,
  z: number,
  normal?: IAutoMovieVector3,
): SceneBuild.PointTarget => ({
  kind: "point",
  at: { x, y, z },
  frame: "world",
  ...(normal === undefined ? {} : { normal }),
});

/** The bench top's upward normal. */
const UP: IAutoMovieVector3 = { x: 0, y: 1, z: 0 };

/** The nail the carpenter drives, on the bench top ahead of the right hand. */
const NAIL: SceneBuild.PointTarget = point(-0.1, SceneBuild.COUNTER_TOP, 0.4);

/**
 * The seven upper-body lexicon families in four everyday sequences: a
 * speaker's explanation, a worker's break at a bench, a hat chosen and worn,
 * and a nail driven with a held hammer. Open targets are finite world
 * points, and prop rows follow the pick-up that establishes their hold.
 */
export const SCENES_UPPER: readonly IScene[] = [
  scene(
    {
      id: "upper-explanation",
      title: "A short explanation",
      summary:
        "A speaker waves, opens his palms, points, counts to three, nods and gives a thumbs up.",
      setting: "everyday",
      roles: { sam: "speaker" },
      needs: [],
    },
    "upper-explanation",
    [
      person("sam", "m1", 0, 0, 0, [
        act("gestureWave", { count: 2 }),
        act("gesturePalmsUp", { hold: 0.3 }),
        act("pointAt", {
          target: point(-0.18, 1.35, 0.45, { x: 0, y: 0, z: -1 }),
          side: "right",
        }),
        act("countOne"),
        act("countTwo"),
        act("countThree"),
        act("gestureNod", { count: 2 }),
        act("thumbsUp"),
        act("restSide", { seconds: 0.8 }),
      ]),
    ],
  ),
  scene(
    {
      id: "upper-bench-break",
      title: "A pause at the bench",
      summary:
        "A worker wipes the bench, rolls her neck and shoulders and pats the bench to end her break.",
      setting: "work",
      roles: { lee: "worker" },
      needs: [],
    },
    "upper-bench-break",
    [
      person("lee", "f1", 0, 0, 0, [
        act("wipeAcross", {
          target: point(-0.18, SceneBuild.COUNTER_TOP, 0.3, UP),
          side: "right",
        }),
        act("touchTap", {
          target: point(-0.18, SceneBuild.COUNTER_TOP, 0.3, UP),
          with: "palm",
          side: "right",
          count: 2,
          hold: 0.2,
        }),
        act("faceWipeMouth", { side: "right", count: 1 }),
        act("selfNeckRoll", { count: 2 }),
        act("selfShoulderRoll", { count: 2 }),
        act("handOnHip", { side: "left" }),
        act("patOn", {
          target: point(-0.18, SceneBuild.COUNTER_TOP, 0.3, UP),
          side: "right",
        }),
      ]),
    ],
    [object("bench", "createTable", "counter", 0, 0.53, 180)],
  ),
  scene(
    {
      id: "upper-hat",
      title: "Choosing a hat",
      summary:
        "A guest studies a hat, puts it on, checks it in a mirror and gives a victory sign.",
      setting: "everyday",
      roles: { tai: "guest" },
      needs: [],
    },
    "upper-hat",
    [
      person("tai", "f2", 0, 0, 0, [
        act("look", { target: point(0.18, 1, 0.3), seconds: 1 }),
        act("chinOnFist", { side: "right" }),
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

        // A mirror would stand ahead of her: she checks the hat in it.
        act("look", { target: point(0, 1.6, 1.2), seconds: 1 }),
        act("handOnHip", { side: "left" }),
        act("gestureChinLift"),
        act("gestureBow", { depth: 20 }),
        act("victorySign"),
        act("gestureNod", { count: 1 }),
        act("restSide", { seconds: 0.8 }),
      ]),
    ],
    [
      // Keep the existing dressing scene's left-hand counter and hat placement.
      object("counter", "createTable", "counter", 0.6, 0.53, 180),
      object(
        "hat",
        "createHat",
        undefined,
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
      title: "Driving a nail",
      summary:
        "A carpenter sets a nail with two taps, drives it with seven blows and lays the hammer down.",
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
          on: NAIL,
          cycles: 2,
        }),
        act("look", { target: NAIL, seconds: 0.8 }),
        act("toolHammer", {
          prop: "hammer",
          hand: "right",
          on: NAIL,
          cycles: 7,
        }),
        act("rubOn", {
          target: point(-0.1, SceneBuild.COUNTER_TOP, 0.4, UP),
          side: "left",
        }),
        act("toolHammer", {
          prop: "hammer",
          hand: "right",
          on: NAIL,
          cycles: 2,
        }),
        act("putDown", {
          prop: "hammer",
          at: { x: -0.18, y: SceneBuild.COUNTER_TOP, z: 0.42 },
        }),
        act("gestureRubHands"),
      ]),
    ],
    [
      object("bench", "createTable", "counter", 0, 0.65, 180),

      // The hammer's +Y working line lies forward on the bench.
      {
        ...object(
          "hammer",
          "createHammer",
          undefined,
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
