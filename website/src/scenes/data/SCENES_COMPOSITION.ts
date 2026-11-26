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
          { over: [act("handToFace", { kind: "phone" })] },
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
        "A walker turns back and runs; a jogger stops for breath, watches him and jogs on.",
      setting: "street",
      roles: { max: "walker", noa: "jogger" },
      needs: [],
      view: "top",
    },
    "change-of-mind",
    [
      person("max", "m2", -3, 0, 90, [
        act("walk", { to: to(3, 0) }, {
          until: { type: "share", share: 0.5 },
        }),
        act("run", { to: to(-3, -1), pace: "jog" }),
        act("look", { target: at("noa", "face"), cue: "seen" }),
        act("checkWatch"),
        act("walk", { to: to(-3, -4.2) }),
      ]),
      person("noa", "f2", 3, 2, 270, [
        act("run", { to: to(-3, 2), pace: "jog" }, {
          until: { type: "share", share: 0.4 },
        }),
        act("walk", { to: to(0, 4) }),
        act("handsOnHips", { hold: 1.6 }),
        act("neckRoll", { count: 1 }),
        act("look", { target: at("max", "face"), cue: "seen", duration: 1.2 }),
        act("checkWatch"),
        act("run", { to: to(-3.5, 4), pace: "jog" }),
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
        act("stand", { hold: 0.8 }),
        act("fingerSnap", {}, { anchor: "snap" }),
      ]),
      person("pip", "m1", 0, 0.3, 0, [
        act("stand", { hold: 0.4 }),
        act(
          "startle",
          { target: at("ola", "handBackRight") },
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
        "Outside a bar one drunk staggers, a friend limps after, and another argues with a stranger.",
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
      person("rae", "m1", -3, 0, 90, [
        act("drunk", { to: to(-0.5, 0) }),
        act("gesture", { kind: "cheer" }),
        act("stumble"),
        act("drunk", { to: to(1.5, -0.3) }),
        act("gesture", { kind: "wave" }),
      ]),
      person("sam", "f1", -3.5, 0.8, 90, [
        act("stiffLimp", { to: to(-1, 0.8) }),
        act("look", { target: at("rae", "face"), cue: "seen", duration: 1.2 }),
        act("gesture", { kind: "beckon" }),
        act("gesture", { kind: "shakeHead" }),
        act("stiffLimp", { to: to(1.5, 0.6) }),
        act("look", { target: at("rae", "face"), cue: "seen", duration: 1.2 }),
        act("gesture", { kind: "shrug" }),
      ]),
      person("tom", "m2", 1, 3, 180, [
        act("confront", { target: at("uma", "sternum") }, { anchor: "no-up" }),
        act("armsCrossed", { hold: 1 }),
        act(
          "gesture",
          { kind: "point", target: at("uma", "face") },
          { anchor: "no-point" },
        ),
        act("gesture", { kind: "shrug" }),
        act("dontKnow"),
        act("walk", { to: to(1, 3.7) }),
        act("look", { target: at("uma", "face"), cue: "seen", duration: 1.2 }),
        act("shakeFist"),
      ]),
      person("uma", "f2", 1, 1.6, 0, [
        act("stand", { hold: 3 }),
        act(
          "handsOnHips",
          { hold: 1.6 },
          { sync: { of: "no-up", event: "arrive" } },
        ),
        act("stand", { hold: 3 }),
        act(
          "gesture",
          { kind: "shakeHead" },
          { sync: { of: "no-point", event: "strokeEnd" } },
        ),
        act("halt"),
        act("sway"),
        act("gesture", { kind: "wave" }),
      ]),
    ],
  ),
];
