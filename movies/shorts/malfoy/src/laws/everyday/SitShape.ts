import type { IBodyPosture } from "../body/IBodyPosture";
import { PostureFrame } from "../body/PostureFrame";

/**
 * Sitting down and standing up: the feet stay planted where the standing
 * posture puts them; through the first quarter of the descent the trunk
 * leans forward over the feet, the pelvis then lowers onto the seat over
 * the next 60%, and the lean peaks at 0.45 rad and settles back once the
 * pelvis is down. Rising runs the same path backward.
 *
 * ```ts
 * SitShape.posture(standing, seated, 0.5); // half way down
 * ```
 *
 * @evidence docs/research/everyday/sitting.md Pre-squat lean, descent and settling with planted feet.
 */
export namespace SitShape {
  /** The trunk's extra forward lean at its peak, radians. */
  export const LEAN: number = 0.45;

  /**
   * A posture part way down.
   *
   * @param standing The standing posture in front of the seat.
   * @param seated The seated posture.
   * @param down Share of the way down, 0 standing and 1 seated.
   * @returns The posture, feet planted.
   */
  export function posture(standing: IBodyPosture, seated: IBodyPosture, down: number): IBodyPosture {
    const descend: number = PostureFrame.smooth((down - 0.25) / 0.6);
    const result: IBodyPosture = PostureFrame.blend(standing, seated, descend);
    result.feet = standing.feet;
    result.lean += LEAN * Math.sin(Math.PI * Math.min(1, Math.max(0, down) / 0.9));
    return result;
  }
}
