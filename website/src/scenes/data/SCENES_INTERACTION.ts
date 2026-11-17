import type { IScene } from "../structures/IScene";
import { SceneBuild } from "./SceneBuild";

const { act, counter, object, person, scene }: typeof SceneBuild = SceneBuild;

/** Contact and force examples: bearing on the floor, pressing a fixed load, releasing a held prop and absorbing an authored impulse. Every record goes through the same public chain and take worker as the gallery's other scenes. */
export const SCENES_INTERACTION: readonly IScene[] = [
  scene(
    {
      id: "hands-down-and-up",
      title: "Hands down and up",
      summary:
        "An athlete folds down to place both palms beside the planted feet, then returns to standing, transferring weight across the declared floor contacts.",
      setting: "gym",
      roles: { ath: "athlete" },
      needs: [],
      view: "side",
    },
    "hands-down-and-up",
    [
      person("ath", "m1", 0, 0, 0, [
        act("support", {
          stances: [
            {
              contacts: [
                { part: "leftFoot", kind: "bear" },
                { part: "rightFoot", kind: "bear" },
              ],
            },
            {
              contacts: [
                { part: "leftFoot", kind: "bear" },
                { part: "rightFoot", kind: "bear" },
                { part: "leftHand", kind: "bear" },
                { part: "rightHand", kind: "bear" },
              ],
            },
            {
              contacts: [
                { part: "leftFoot", kind: "bear" },
                { part: "rightFoot", kind: "bear" },
              ],
            },
          ],
        }),
      ]),
    ],
  ),
  scene(
    {
      id: "stuck-sled",
      title: "A sled that will not move",
      summary:
        "An athlete takes the sled's two upright handles and presses for two seconds, leaning into a light load while it stays where it stands.",
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
      ]),
    ],
    [{ ...object("sled", "createSled", undefined, 0, 0.35), fixed: true }],
  ),
  scene(
    {
      id: "letting-go",
      title: "Letting go",
      summary:
        "A guest takes a mug by its handle, then opens the holding hand while standing and lets the mug fall.",
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
          { seconds: 3 },
          { over: [act("release", { prop: "mug", hand: "right" })] },
        ),
      ]),
    ],
    counter("counter", "mug", "createDrinkware", "mug", 0, 0),
  ),
  scene(
    {
      id: "balance-impulse",
      title: "Absorbing an impulse",
      summary:
        "A balance test: after half a second of standing, a person absorbs a three newton-second forward impulse and settles with both feet planted.",
      setting: "gym",
      roles: { bal: "participant" },
      needs: [],
      view: "side",
    },
    "balance-impulse",
    [
      person("bal", "m1", 0, 0, 0, [
        act("stand", { seconds: 0.5 }),
        act("perturb"),
      ]),
    ],
    [],
    [],
    [
      {
        kind: "impulse",
        subject: "bal",
        at: "sternum",
        seconds: 0.5,
        impulse: { x: 0, y: 0, z: 3 },
      },
    ],
  ),
];
