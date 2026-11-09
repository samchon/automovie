import type { IAutoMovieVector3 } from "@automovie/interface";

import type { IBodyPosture } from "../body/IBodyPosture";
import { PostureFrame } from "../body/PostureFrame";

/**
 * A hand reaching to a point and on: the hand travels from where it starts
 * to the point by the contact (an offer's handover point, a receiving hand on
 * the held object, a catch, a grip on a wrist, a pick-up or a put-down), then
 * either stays there (it now holds something there) or goes on to its end
 * place; a floor pick-up hinges the trunk down to 0.95 rad from upright with
 * the pelvis 0.22 m below upright at the contact (a body already bent only
 * completes the hinge); a receiving pull tugs the hand 5 cm back over 0.25 s.
 *
 * ```ts
 * ReachShape.posture({ from, to, side: "right", point, contact: 0.7, natural: 0.7, own: 0.35 });
 * ```
 *
 * @evidence docs/research/everyday/handover.md Transport and reach to the handover point; transfer; withdrawal; the floor pick-up's hinge.
 */
export namespace ReachShape {
  /** One reach. */
  export interface IInput {
    /** Posture at the start. */
    from: IBodyPosture;

    /** Posture at the end. */
    to: IBodyPosture;

    /** The reaching hand. */
    side: "left" | "right";

    /** Where the hand arrives at the contact. */
    point: IAutoMovieVector3;

    /** Seconds from the start to the contact. */
    contact: number;

    /** Seconds of the whole action. */
    natural: number;

    /** Seconds since the action began. */
    own: number;

    /** After the contact: `stay` keeps the hand at the point, `return` takes it on to its end place. */
    after: "stay" | "return";

    /** A floor pick-up: the trunk hinges down to the point, from the upright lean and pelvis height given (an already bent body hinges only the rest of the way). */
    floor?: { lean: number; pelvis: number };

    /** A receiving pull: the hand tugs back toward the body after the contact, along this forward direction. */
    pull?: IAutoMovieVector3;
  }

  /** The trunk's hinge at a floor pick-up's contact, radians. */
  export const FLOOR_HINGE: number = 0.95;

  /** The pelvis's drop at a floor pick-up's contact, metres. */
  export const FLOOR_DROP: number = 0.22;

  /**
   * The posture at a second of the reach.
   *
   * @param input The reach.
   * @returns The posture.
   */
  export function posture(input: IInput): IBodyPosture {
    const { from, to, side, contact, natural, own } = input;
    const out: number = PostureFrame.smooth(own / Math.max(0.05, contact));
    const back: number = PostureFrame.smooth((own - contact) / Math.max(0.05, natural - contact));
    const result: IBodyPosture = PostureFrame.blend(from, to, back);
    const start: IAutoMovieVector3 = from.hands[side].point;
    const held: IAutoMovieVector3 = input.after === "return" ? PostureFrame.lerp(input.point, to.hands[side].point, back) : input.point;
    result.hands[side] = { ...result.hands[side], point: own < contact ? PostureFrame.lerp(start, input.point, out) : held, palm: { x: 0, y: 1, z: 0 } };
    if (input.floor !== undefined) {
      // The full hinge is measured from upright, so a body already bent toward the floor only completes it.
      const depth: number = own < contact ? out : 1 - back;
      result.pelvis = { ...result.pelvis, y: Math.min(result.pelvis.y, input.floor.pelvis - FLOOR_DROP * depth) };
      result.lean = Math.max(result.lean, input.floor.lean + FLOOR_HINGE * depth);
    }
    if (input.pull !== undefined && own > contact) {
      const k: number = -0.05 * Math.min(1, (own - contact) / 0.25);
      const p: IAutoMovieVector3 = result.hands[side].point;
      result.hands[side] = { ...result.hands[side], point: { x: p.x + input.pull.x * k, y: p.y + input.pull.y * k, z: p.z + input.pull.z * k } };
    }
    return result;
  }
}
