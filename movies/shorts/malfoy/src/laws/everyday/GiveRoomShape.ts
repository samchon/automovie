import type { IBodyMeasure } from "../body/IBodyMeasure";
import type { IBodyPosture } from "../body/IBodyPosture";
import { PostureFrame } from "../body/PostureFrame";

/**
 * Giving someone room: a half-metre step straight back from the person with
 * both forearms raised in front of the chest, elbows bent and low at the
 * sides, palms toward the person. The palms start to rise only as the step
 * back begins (0.3 s into the action) and are up 0.4 s later, so a hand never
 * reaches into the person given room; the step itself takes the action's
 * remaining time.
 *
 * ```ts
 * GiveRoomShape.palm(posture, "left", measure); // the open left palm's goal
 * GiveRoomShape.raised(0.5); // 0.5 of the way up
 * ```
 *
 * @evidence docs/research/everyday/walking.md Steps back at the gait's own length and cadence.
 */
export namespace GiveRoomShape {
  /** Seconds into the action when the step back (and the palms) begin. */
  export const STEP_BEGINS: number = 0.3;

  /** Seconds the palms take to come up. */
  export const PALMS_RISE: number = 0.4;

  /**
   * An open palm's goal: in front of the chest, 0.3 m forward and 0.16 m to
   * its side, 0.12 m below the shoulder line, the elbow bent low at the side
   * and the palm facing forward.
   *
   * @param p The posture the hand rides.
   * @param side The hand.
   * @param m The body.
   * @returns The hand's goal.
   */
  export function palm(p: IBodyPosture, side: "left" | "right", m: IBodyMeasure): IBodyPosture.IHand {
    const s: number = side === "left" ? 1 : -1;
    const trunk: number = m.shoulder - m.hip;
    const forward = PostureFrame.trunk(p).forward;
    return {
      point: PostureFrame.onTrunk(p, 0.22, s * 0.18, trunk - 0.1),
      elbow: PostureFrame.onTrunk(p, 0.12, s * (m.shoulderHalfWidth + 0.08), trunk - 0.4),
      palm: { x: forward.x, y: 0, z: forward.z },
    };
  }

  /**
   * How far the palms have risen at a second of the action.
   *
   * @param own Seconds since the action began.
   * @returns Share in [0, 1].
   */
  export function raised(own: number): number {
    return PostureFrame.smooth((own - STEP_BEGINS) / PALMS_RISE);
  }
}
