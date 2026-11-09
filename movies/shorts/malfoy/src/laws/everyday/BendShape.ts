import type { IAutoMovieVector3 } from "@automovie/interface";

import type { IBodyPosture } from "../body/IBodyPosture";
import { PostureFrame } from "../body/PostureFrame";

/**
 * Bending toward something on the floor: the knees bend and the hips hinge
 * (the rest posture of a bent state carries the depth), and a free right hand
 * reaches down toward the floor point, closer the deeper the bend: at full
 * depth it comes within 0.12 m of the floor; a partial bend stops it higher by
 * 0.4 m per missing depth. Named depths: a `lean` that only starts the bend,
 * `half` way, or `full`.
 *
 * ```ts
 * BendShape.depth("lean"); // 0.45
 * BendShape.hand(posture, floorPoint, 0.45, 1); // the free hand's goal
 * ```
 *
 * @evidence docs/research/everyday/handover.md Lowering 0.8–1.2 s; the head 0.35 m ahead of the feet at full hinge.
 */
export namespace BendShape {
  /** Named depths: a lean that reads as the start of a bend at full-shot size, half, and full. */
  export const DEPTHS = Object.freeze({ lean: 0.45, half: 0.6, full: 1 });

  /** A named or numeric depth. */
  export type Depth = keyof typeof DEPTHS | number;

  /**
   * A depth's share of the full hinge.
   *
   * @param depth Named or numeric.
   * @returns Share in [0, 1].
   */
  export function depth(depth: Depth): number {
    return typeof depth === "number" ? Math.max(0, Math.min(1, depth)) : DEPTHS[depth];
  }

  /**
   * The free hand's goal part way down.
   *
   * @param p The bent posture.
   * @param floor The floor point bent toward.
   * @param share The bend's depth.
   * @param progress Share of the bend done.
   * @returns The hand's goal.
   */
  export function hand(p: IBodyPosture, floor: IAutoMovieVector3, share: number, progress: number): IAutoMovieVector3 {
    const reach: number = progress * share * 0.8;
    return PostureFrame.lerp(p.hands.right.point, { x: floor.x, y: 0.12 + (1 - share) * 0.4, z: floor.z }, reach);
  }
}
