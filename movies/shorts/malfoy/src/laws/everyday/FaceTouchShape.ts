import type { IAutoMovieVector3 } from "@automovie/interface";

import type { IBodyMeasure } from "../body/IBodyMeasure";
import type { IBodyPosture } from "../body/IBodyPosture";
import { PostureFrame } from "../body/PostureFrame";

/**
 * A hand to the face and back: a forehead touch puts the fingertips on the
 * forehead's centre (3 cm above the head's centre, 0.11 m forward of the
 * trunk axis) with the elbow out to the side at shoulder height; a glasses
 * push puts a fingertip on the bridge (level with the head's centre) with the
 * elbow low. The hand rises over 0.3 s, holds, and falls over the last 0.3 s.
 * It lays over any posture: standing, walking, seated or riding.
 *
 * ```ts
 * FaceTouchShape.posture(walking, "touchForehead", "left", 0.8, 1.6, measure);
 * ```
 *
 * @evidence docs/research/everyday/handover.md Hand transport times of 0.3–0.5 s.
 */
export namespace FaceTouchShape {
  /** The two gestures. */
  export type Kind = "touchForehead" | "pushGlasses";

  /**
   * The hand's goal and elbow aim at full reach.
   *
   * @param p The posture the hand rides.
   * @param kind The gesture.
   * @param side The hand.
   * @param m The body.
   * @returns Fingertip goal and elbow aim.
   */
  export function goal(p: IBodyPosture, kind: Kind, side: "left" | "right", m: IBodyMeasure): { point: IAutoMovieVector3; elbow: IAutoMovieVector3 } {
    const up: number = m.shoulder - m.hip;
    const head: number = m.head - m.hip;
    const s: number = side === "left" ? 1 : -1;
    return kind === "touchForehead"
      ? { point: PostureFrame.onTrunk(p, 0.11, 0, head + 0.03), elbow: PostureFrame.onTrunk(p, 0.12, s * 0.38, up - 0.02) }
      : { point: PostureFrame.onTrunk(p, 0.11, 0, head), elbow: PostureFrame.onTrunk(p, 0.15, s * 0.2, up - 0.25) };
  }

  /**
   * A posture with the gesture laid over it.
   *
   * @param base The posture without the gesture.
   * @param kind The gesture.
   * @param side The hand.
   * @param own Seconds since the gesture began.
   * @param natural The gesture's seconds.
   * @param m The body.
   * @returns The posture; the base itself outside the gesture's seconds.
   */
  export function posture(base: IBodyPosture, kind: Kind, side: "left" | "right", own: number, natural: number, m: IBodyMeasure): IBodyPosture {
    if (own < 0 || own > natural) return base;
    const { point, elbow } = goal(base, kind, side, m);
    const k: number = PostureFrame.smooth(Math.min(own / 0.3, (natural - own) / 0.3));
    return { ...base, hands: { ...base.hands, [side]: { ...base.hands[side], point: PostureFrame.lerp(base.hands[side].point, point, k), elbow: PostureFrame.lerp(base.hands[side].elbow, elbow, k) } } };
  }
}
