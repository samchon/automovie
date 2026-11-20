import type { IScene } from "../structures/IScene";
import { SceneBuild } from "./SceneBuild";

const { act, counter, object, person, scene }: typeof SceneBuild = SceneBuild;

/**
 * A world point a look goes to.
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

/** The floor below the counter's edge where the right hand's mug lands. */
const FLOOR_RIGHT: Record<string, unknown> = point(-0.2, 0, 0.3);

/** The floor below the counter's edge where the left hand's mug lands. */
const FLOOR_LEFT: Record<string, unknown> = point(0.2, 0, 0.3);

/** A support stance on both feet. */
const FEET: Record<string, unknown> = {
  contacts: [
    { part: "leftFoot", kind: "bear" },
    { part: "rightFoot", kind: "bear" },
  ],
};

/** A support stance on both feet and both palms. */
const FEET_AND_HANDS: Record<string, unknown> = {
  contacts: [
    { part: "leftFoot", kind: "bear" },
    { part: "rightFoot", kind: "bear" },
    { part: "leftHand", kind: "bear" },
    { part: "rightHand", kind: "bear" },
  ],
};

/** The balance test's push instants, film seconds: each impulse lands as a perturbation starts, so every take reads the same push. */
const PUSHES: readonly [number, number, number] = [0.5, 6.5, 10.6];

/** Contact and force examples: bearing on the floor, pressing a fixed load, releasing a held prop and absorbing an authored impulse. Every record goes through the same public chain and take worker as the gallery's other scenes. */
export const SCENES_INTERACTION: readonly IScene[] = [
  scene(
    {
      id: "hands-down-and-up",
      title: "Hands down and up",
      summary:
        "An athlete goes down onto both palms, one palm, then hands and knees, standing each time.",
      setting: "gym",
      roles: { ath: "athlete" },
      needs: [],
      view: "side",
    },
    "hands-down-and-up",
    [
      person("ath", "m1", 0, 0, 0, [
        act("support", { stances: [FEET, FEET_AND_HANDS, FEET] }),
        act("gesture", { kind: "rubHands" }),
        act("support", {
          stances: [
            FEET,
            {
              contacts: [
                { part: "leftFoot", kind: "bear" },
                { part: "rightFoot", kind: "bear" },
                { part: "rightHand", kind: "bear" },
              ],
            },
            FEET,
          ],
        }),
        act("neckRoll", { count: 1 }),
        act("support", {
          stances: [
            FEET,
            {
              contacts: [
                { part: "leftKnee", kind: "bear" },
                { part: "rightKnee", kind: "bear" },
                { part: "leftHand", kind: "bear" },
                { part: "rightHand", kind: "bear" },
              ],
            },
            FEET,
          ],
        }),
        act("gesture", { kind: "nod" }),
      ]),
    ],
  ),
  scene(
    {
      id: "stuck-sled",
      title: "A sled that will not move",
      summary:
        "An athlete pushes a sled harder and harder, then pulls it, but it never moves.",
      setting: "gym",
      roles: { ath: "athlete" },
      needs: [],
      view: "side",
    },
    "stuck-sled",
    [
      person("ath", "m1", 0, 0, 0, [
        act("pushPull", {
          prop: "sled",
          way: "push",
          left: "left",
          right: "right",
          load: "light",
          moves: false,
          seconds: 2,
        }),
        act("neckRoll", { count: 1 }),
        act("pushPull", {
          prop: "sled",
          way: "push",
          left: "left",
          right: "right",
          load: "heavy",
          moves: false,
          seconds: 2,
        }),
        act("gesture", { kind: "shakeHead" }),
        act("pushPull", {
          prop: "sled",
          way: "pull",
          left: "left",
          right: "right",
          load: "moderate",
          moves: false,
          seconds: 2,
        }),
        act("handsOnHips", { seconds: 1.6 }),
        act("look", { target: point(0, 0.5, 0.35), seconds: 1.6 }),
        act("gesture", { kind: "shrug" }),
      ]),
    ],
    [{ ...object("sled", "createSled", undefined, 0, 0.35), fixed: true }],
  ),
  scene(
    {
      id: "letting-go",
      title: "Letting go",
      summary:
        "A guest drops one mug, shrugs, drops a second and covers her face.",
      setting: "everyday",
      roles: { gst: "guest" },
      needs: [],
    },
    "letting-go",
    [
      person("gst", "f1", 0, 0, 0, [
        act("pickUp", { prop: "mug", handle: "handle", hand: "right" }),
        act(
          "stand",
          { seconds: 1 },
          { over: [act("release", { prop: "mug", hand: "right" })] },
        ),
        act("look", { target: FLOOR_RIGHT, seconds: 1.2 }),
        act("dontKnow"),
        act("pickUp", { prop: "mug2", handle: "handle", hand: "left" }),
        act(
          "stand",
          { seconds: 1 },
          { over: [act("release", { prop: "mug2", hand: "left" })] },
        ),
        act("look", { target: FLOOR_LEFT, seconds: 1.2 }),
        act("facepalm"),
        act("crouch", { hold: 1 }),
        act("stand", { seconds: 0.5 }),
      ]),
    ],
    [
      ...counter("counter", "mug", "createDrinkware", "mug", 0, 0),
      object(
        "mug2",
        "createDrinkware",
        "mug",
        0.18,
        0.3,
        0,
        SceneBuild.COUNTER_TOP,
      ),
    ],
  ),
  scene(
    {
      id: "balance-impulse",
      title: "Three pushes",
      summary:
        "A participant takes pushes from behind, the side and the front, and steps back to his mark.",
      setting: "gym",
      roles: { bal: "participant" },
      needs: [],
      view: "side",
    },
    "balance-impulse",
    [
      person("bal", "m1", 0, 0, 0, [
        act("stand", { seconds: 0.5 }, { anchor: "bi-start" }),
        act("perturb"),
        act("look", {
          target: point(0, 1.5, -1.5),
          cue: "signal",
          seconds: 1.2,
        }),
        act("gesture", { kind: "squareShoulders" }),
        act("stand", { seconds: 3 }),
        act(
          "perturb",
          {},
          { sync: { of: "bi-start", event: "start", offset: PUSHES[1] } },
        ),
        act("look", {
          target: point(1.5, 1.5, 0),
          cue: "signal",
          seconds: 1.4,
        }),
        act("stand", { seconds: 3 }),
        act(
          "perturb",
          {},
          { sync: { of: "bi-start", event: "start", offset: PUSHES[2] } },
        ),
        act("step", { direction: "forward", steps: 1 }),
        act("gesture", { kind: "nod" }),
      ]),
    ],
    [],
    [],
    [
      {
        kind: "impulse",
        subject: "bal",
        at: "sternum",
        seconds: PUSHES[0],
        impulse: { x: 0, y: 0, z: 3 },
      },
      {
        kind: "impulse",
        subject: "bal",
        at: "sternum",
        seconds: PUSHES[1],
        impulse: { x: -6, y: 0, z: 0 },
      },
      {
        kind: "impulse",
        subject: "bal",
        at: "sternum",
        seconds: PUSHES[2],
        impulse: { x: 0, y: 0, z: -24 },
      },
    ],
  ),
];
