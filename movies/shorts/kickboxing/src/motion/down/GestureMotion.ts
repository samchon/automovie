import {
  AutoMovieHumanRigControls,
  type IAutoMovieHumanPose,
} from "@automovie/human";

import type { MotionAction } from "../core/MotionAction";

/**
 * Small upper-body gestures that retain the caller's independent support track.
 *
 * @evidence contracts/common.md#implementation-and-ownership Clinical arm/hand and modest cervical gestures are composable over one supplied body placement. A gesture never routes a person, starts a count, awards a win or invents a floor contact. Each call copies its entry and preserves the actual lower body/root/support. Finger counts are explicit finite integers rather than pose labels.
 * @evidence contracts/common.md#authoring-interface Local seconds and a supplied actual entry determine interpolation. Count numbers and film transition times belong to the caller. Footwork must be realized first, then its current sample supplied on every frame; the gesture only owns upper-body channels. Native fitting and moving review remain required.
 */
export namespace GestureMotion {
  /**
   * Four deliberate gestures, independent of any bout timeline.
   * @evidence contracts/common.md#implementation-and-ownership Separates exuberant arm raising, directional pointing, visible hand count and both-arm stoppage while retaining one simple clinical authoring seam.
   * @evidence contracts/common.md#authoring-interface Labels choose articulation only; the film owns their semantic use and actual local start/end.
   */
  export type Kind = "celebrate" | "direct-corner" | "count" | "stop";
  /**
   * Explicit local gesture placement.
   * @evidence contracts/common.md#implementation-and-ownership Side chooses a pointing/counting hand, count is an integer 1..10, and duration controls the rise envelope without another state machine.
   * @evidence contracts/common.md#authoring-interface Duration is positive seconds, default .3. Count is mandatory only for count. Referee attention/heading and winner location remain with the scene owner.
   */
  export interface Options {
    /** Anatomical primary hand. */ side: MotionAction.Side;
    /** Visible finger total, 1..10. */ count?: number;
    /** Positive transition duration, seconds. */ duration?: number;
  }

  /**
   * Overlay only the gesture's upper-body clinical channels on the current body.
   *
   * @evidence contracts/common.md#implementation-and-ownership Public Human blending joins the supplied actual entry to an explicit arm endpoint. Root, support and lower-body articulation are copied unchanged; the input effectors are untouched but the gesture output removes attack tasks. No solver or cache is constructed. Work and temporary storage are bounded by one clinical pose. Count >5 uses both actual hands. Celebration retains asymmetry and two phased arm pulses without bouncing or moving planted feet.
   * @evidence contracts/common.md#authoring-interface Count supplies the current film-selected number; local time is since that number's transition and must not reset body time. Entry must be the current realized footwork/body sample. The returned sample clears attack effectors, since these gestures cannot inherit a strike request, and sets its local elapsed without altering incoming objects.
   */
  export function sample(
    kind: Kind,
    entry: MotionAction.Sample,
    seconds: number,
    options: Options,
  ): MotionAction.Sample {
    const duration: number = options.duration ?? 0.3;
    if (
      !["celebrate", "direct-corner", "count", "stop"].includes(kind) ||
      !Number.isFinite(seconds) ||
      !Number.isFinite(duration) ||
      duration <= 0 ||
      (options.side !== "left" && options.side !== "right") ||
      (kind === "count" &&
        (!Number.isInteger(options.count) ||
          options.count! < 1 ||
          options.count! > 10))
    )
      throw new Error(
        "Gesture requires a known kind, side, finite local time, positive rise and count 1..10 when counting",
      );
    if (seconds < 0)
      return {
        ...structuredClone(entry),
        effectors: [],
        elapsed: seconds,
        phase: "idle",
        progress: 0,
      };
    const progress: number = Math.max(0, Math.min(1, seconds / duration));
    const weight: number = progress * progress * (3 - 2 * progress);
    const target: IAutoMovieHumanPose = structuredClone(entry.pose);
    target.arms ??= { left: {}, right: {} };
    const other: MotionAction.Side = options.side === "left" ? "right" : "left";
    if (kind === "direct-corner") {
      target.arms[options.side] = {
        ...target.arms[options.side],
        shoulder: { flexion: 82, abduction: 20, rotation: 0 },
        elbow: { flexion: 15 },
        forearm: { pronation: 60 },
        wrist: { flexion: 0, radialDeviation: 0 },
        hand: hand(1),
      };
      target.arms[other] = {
        ...target.arms[other],
        shoulder: { flexion: 30, abduction: 12, rotation: 0 },
        elbow: { flexion: 85 },
        hand: hand(5),
      };
    } else if (kind === "count") {
      for (const side of [options.side, other]) {
        const fingers: number =
          side === options.side
            ? Math.min(5, options.count!)
            : Math.max(0, options.count! - 5);
        target.arms[side] = {
          ...target.arms[side],
          shoulder: {
            flexion: fingers > 0 ? 66 : 20,
            abduction: fingers > 0 ? 16 : 8,
            rotation: 0,
          },
          elbow: { flexion: fingers > 0 ? 75 : 95 },
          forearm: { pronation: -25 },
          wrist: { flexion: 0, radialDeviation: 0 },
          hand: hand(fingers),
        };
      }
    } else if (kind === "stop") {
      const sweep: number =
        Math.sin(
          Math.PI * Math.min(1, Math.max(0, (seconds - duration) / 0.8)),
        ) ** 2;
      for (const side of ["left", "right"] as const)
        target.arms[side] = {
          ...target.arms[side],
          shoulder: {
            flexion: 75 - 20 * sweep,
            abduction: 35 + 40 * sweep,
            rotation: 0,
          },
          elbow: { flexion: 28 },
          forearm: { pronation: 70 },
          hand: hand(5),
        };
    } else {
      for (const side of ["left", "right"] as const) {
        const phase: number = side === options.side ? 0 : 0.7;
        const pulse: number =
          (1 -
            Math.cos(Math.max(0, seconds - duration) * Math.PI * 1.5 + phase)) *
          3;
        target.arms[side] = {
          ...target.arms[side],
          shoulder: {
            flexion: 138 - pulse,
            abduction: side === options.side ? 35 : 28,
            rotation: 12,
          },
          elbow: { flexion: 24 + pulse },
          forearm: { pronation: 5 },
        };
      }
      target.neck = {
        ...target.neck,
        cervical: { ...target.neck?.cervical, flexion: -8 },
      };
      target.head = {
        ...target.head,
        jaw: { ...target.head?.jaw, opening: 12 },
      };
    }
    const pose: IAutoMovieHumanPose = AutoMovieHumanRigControls.blend(
      entry.pose,
      target,
      weight,
    );
    return {
      ...structuredClone(entry),
      pose,
      effectors: [],
      elapsed: seconds,
      phase: seconds < 0 ? "idle" : progress < 1 ? "delivery" : "complete",
      progress,
    };
  }
}

/** Explicit visible digit extension count; folded fingers retain clinical flexion. */
function hand(
  count: number,
): NonNullable<NonNullable<IAutoMovieHumanPose["arms"]>["left"]["hand"]> {
  const result: NonNullable<
    NonNullable<IAutoMovieHumanPose["arms"]>["left"]["hand"]
  > = {};
  for (const [index, digit] of (
    ["index", "middle", "ring", "little"] as const
  ).entries()) {
    const extended: boolean = index < Math.min(4, count);
    result[digit] = {
      mcpFlexion: extended ? 0 : 65,
      pipFlexion: extended ? 0 : 80,
      dipFlexion: extended ? 0 : 55,
      mcpAbduction: extended ? 3 : 0,
    };
  }
  result.thumb = {
    cmcFlexion: count === 5 ? -10 : 12,
    cmcAbduction: count === 5 ? 35 : 10,
    cmcOpposition: count === 5 ? 0 : 30,
    mcpFlexion: count === 5 ? 0 : 35,
    ipFlexion: count === 5 ? 0 : 45,
  };
  return result;
}
