import type { IScene } from "../structures/IScene";
import { SceneBuild } from "./SceneBuild";

const { act, at, person, scene, to }: typeof SceneBuild = SceneBuild;

/**
 * The scenes that show how actions compose: one performed over another on
 * other parts of the body (`over`), an action cut short and redirected
 * (`until`), and one timed to another performer's instant (`sync`), with the
 * lexicon's uneven gaits and a confrontation on the street.
 */
export const SCENES_COMPOSITION: readonly IScene[] = [
  scene(
    {
      id: "walk-and-talk",
      title: "Walk and talk",
      summary:
        "Two people cross a square in opposite directions: one walks with a phone at the ear, the other walks slowly and waves on the way.",
      setting: "street",
      roles: { kim: "caller", lou: "stroller" },
      needs: [],
      view: "top",
    },
    "walk-and-talk",
    [
      person("kim", "f1", -3, 0, 90, [
        act(
          "walk",
          { to: to(3, 0) },
          { over: [act("handToFace", { task: "phone" })] },
        ),
      ]),
      person("lou", "m1", 3, 1.5, 270, [
        act(
          "walk",
          { to: to(-3, 1.5), pace: "slow" },
          { over: [act("gesture", { kind: "wave" })] },
        ),
      ]),
    ],
  ),
  scene(
    {
      id: "change-of-mind",
      title: "Change of mind",
      summary:
        "A walker turns back halfway across the street and runs the other way; a jogger cuts their jog short and walks off to the side.",
      setting: "street",
      roles: { max: "walker", noa: "jogger" },
      needs: [],
      view: "top",
    },
    "change-of-mind",
    [
      person("max", "m2", -3, 0, 90, [
        act("walk", { to: to(3, 0) }, { until: { share: 0.5 } }),
        act("run", { to: to(-3, -1), pace: "jog" }),
      ]),
      person("noa", "f2", 3, 2, 270, [
        act("run", { to: to(-3, 2), pace: "jog" }, { until: { share: 0.4 } }),
        act("walk", { to: to(0, 4) }),
      ]),
    ],
  ),
  scene(
    {
      id: "snap-and-flinch",
      title: "Snap and flinch",
      summary:
        "One friend snaps their fingers behind another's ear, who flinches at the very instant of the snap.",
      setting: "everyday",
      roles: { ola: "prankster", pip: "friend" },
      needs: [],
    },
    "snap-and-flinch",
    [
      person("ola", "f1", 0.4, -0.3, 0, [
        act("stand", { seconds: 0.8 }),
        act("fingerSnap", {}, { anchor: "snap" }),
      ]),
      person("pip", "m1", 0, 0.3, 0, [
        act("stand", { seconds: 0.4 }),
        act(
          "startle",
          { from: at("ola", "handBackRight") },
          { sync: { of: "snap", event: "strokeEnd" } },
        ),
      ]),
    ],
  ),
  scene(
    {
      id: "night-out",
      title: "Night out",
      summary:
        "Leaving a bar: one reveller staggers drunk, a friend follows with a stiff limp, and a third steps up face to face with a stranger and crosses his arms; she stands with hands on hips and sways to the music.",
      setting: "street",
      roles: {
        rae: "reveller",
        sam: "friend",
        tom: "reveller",
        uma: "stranger",
      },
      needs: [],
      view: "top",
    },
    "night-out",
    [
      person("rae", "m1", -3, 0, 90, [act("drunk", { to: to(1, 0) })]),
      person("sam", "f1", -3.5, 0.8, 90, [
        act("stiffLimp", { to: to(0, 0.8) }),
      ]),
      person("tom", "m2", 1, 3, 180, [
        act("confront", { target: at("uma", "sternum") }),
        act("armsCrossed"),
      ]),
      person("uma", "f2", 1, 1.6, 0, [
        act("stand", { seconds: 1 }),
        act("handsOnHips"),
        act("sway"),
      ]),
    ],
  ),
];
