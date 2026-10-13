import type {IAutoMoviePerformance} from "@automovie/interface";
import {APPROACH_DURATION} from "./APPROACH_DURATION";

/** Authored pursuit-film performances; the runtime compiles this tracked example unchanged. */
export const performances: IAutoMoviePerformance[] = [
  {
    beat: "approach",
    plan: "one locomote covers the whole beat; the head tracks the waiter; the camera follows.",
    draft: [
      {
        verb: "locomote",
        actor: "walker",
        start: 0,
        duration: APPROACH_DURATION,
        gait: "walk",
        to: { kind: "point", point: { x: 0, y: 0, z: -0.15 } },
      },
      {
        verb: "lookAt",
        actor: "walker",
        start: 0,
        duration: APPROACH_DURATION,
        to: { kind: "node", node: "waiter" },
      },
      { verb: "hold", actor: "waiter", start: 0, duration: APPROACH_DURATION },
      {
        verb: "frame",
        actor: "cam-main",
        start: 0,
        duration: "auto",
        framing: "full",
        move: "follow",
        on: { kind: "node", node: "walker" },
      },
    ],
    revise: {
      review: "stride covers the gap; the follow keeps both in frame.",
      final: null,
    },
    duration: APPROACH_DURATION,
  },
  {
    beat: "face-off",
    plan: "both hold; the camera orbits the waiter in close.",
    draft: [
      { verb: "hold", actor: "walker", start: 0, duration: 2.5 },
      {
        verb: "emote",
        actor: "waiter",
        start: 0,
        duration: 2.5,
        preset: "angry",
        intensity: 0.8,
      },
      {
        verb: "frame",
        actor: "cam-main",
        start: 0,
        duration: "auto",
        framing: "full",
        move: "orbit",
        on: { kind: "node", node: "waiter" },
      },
    ],
    revise: {
      review: "nothing moves but the camera, as blocked.",
      final: null,
    },
    duration: 2.5,
  },
];

// ── rigs + the content seam ──────────────────────────────────────────────────
