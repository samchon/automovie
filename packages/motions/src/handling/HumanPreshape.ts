import type { AutoMovieHumanoidBone } from "@automovie/interface";

import type { IHumanBody } from "../body/IHumanBody";
import { HumanHand } from "../posture/HumanHand";
import type { IHumanPosture } from "../posture/IHumanPosture";
import { HumanGrip } from "./HumanGrip";
import { HumanPrehension } from "./HumanPrehension";

/**
 * The open hand a reach carries toward a grasp: the pre-shape whose
 * thumb-index aperture is the peak aperture for the grasped width
 * (`HumanPrehension.aperture`).
 *
 * The open hand is found on the thumb-index aperture of the body's own digit
 * colliders (`HumanGrip.aperture`): a blend from the closed grasp toward the
 * flat hand when the flat hand is wide enough, else the flat hand with the
 * thumb's carpometacarpal joint abducted until it is, the joint that opens the
 * human grip span; a span the hand cannot reach within 60 degrees of abduction
 * stops there and reports the aperture it reached.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what the pre-shape is, how it is found and what an unreachable span returns.
 * @evidence contracts/development/implementation.md#principled-implementation Bisection of a monotone opening parameter on the aperture measured between the body's own digit colliders, toward the peak aperture of the reach-to-grasp law.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One blend, one bisection and the thumb abduction branch.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts An unreachable span is capped at the joint's limit and the reached aperture reported, not faked.
 * @evidence contracts/development/implementation.md#efficient-algorithms At most 30 aperture readings per bisection, two bisections per pre-shape.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Called once per planned grasp.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
 */
export namespace HumanPreshape {
  /**
   * The open pre-shape whose thumb-index aperture is the peak aperture for a
   * width.
   *
   * @param body The body.
   * @param side The hand.
   * @param closed The closed grasp's digit angles.
   * @param width The grasped width, metres.
   * @returns The pre-shape's angles and the aperture it reaches, metres.
   */
  export function open(
    body: IHumanBody,
    side: HumanHand.Side,
    closed: IHumanPosture["joints"],
    width: number,
  ): { joints: IHumanPosture["joints"]; aperture: number } {
    const want: number = HumanPrehension.aperture(width);
    const flat: IHumanPosture["joints"] = HumanHand.shape(side, "flat");
    const blend = (w: number): IHumanPosture["joints"] => {
      const out: IHumanPosture["joints"] = {};
      for (const bone of new Set([
        ...Object.keys(closed),
        ...Object.keys(flat),
      ]) as Set<AutoMovieHumanoidBone>) {
        const a: readonly [number, number, number] = closed[bone] ?? [0, 0, 0];
        const b: readonly [number, number, number] = flat[bone] ?? [0, 0, 0];
        out[bone] = [
          a[0] + (b[0] - a[0]) * w,
          a[1] + (b[1] - a[1]) * w,
          a[2] + (b[2] - a[2]) * w,
        ];
      }
      return out;
    };
    const solve = (
      shape: (x: number) => IHumanPosture["joints"],
      hi: number,
    ): { joints: IHumanPosture["joints"]; aperture: number } => {
      let lo: number = 0;
      let top: number = hi;
      if (HumanGrip.aperture(body, side, shape(top)) <= want)
        return {
          joints: shape(top),
          aperture: HumanGrip.aperture(body, side, shape(top)),
        };
      for (let i: number = 0; i < 30; i++) {
        const mid: number = (lo + top) / 2;
        if (HumanGrip.aperture(body, side, shape(mid)) < want) lo = mid;
        else top = mid;
      }
      return {
        joints: shape(top),
        aperture: HumanGrip.aperture(body, side, shape(top)),
      };
    };
    if (HumanGrip.aperture(body, side, flat) >= want) return solve(blend, 1);

    // Wider than the flat hand: abduct the thumb's carpometacarpal joint, in
    // whichever sense widens the span.
    const thumb: AutoMovieHumanoidBone =
      `${side}ThumbMetacarpal` as AutoMovieHumanoidBone;
    const abducted =
      (sense: number) =>
      (x: number): IHumanPosture["joints"] => ({
        ...flat,
        [thumb]: [0, sense * 60 * x, 0] as const,
      });
    const sense: number =
      HumanGrip.aperture(body, side, abducted(1)(0.5)) >=
      HumanGrip.aperture(body, side, abducted(-1)(0.5))
        ? 1
        : -1;
    return solve(abducted(sense), 1);
  }
}
