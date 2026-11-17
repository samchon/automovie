import type { AutoMovieHumanoidBone } from "@automovie/interface";

import type { IHumanBody } from "../body/IHumanBody";
import { HumanHand } from "../posture/HumanHand";
import type { IHumanPosture } from "../posture/IHumanPosture";
import { HumanGrip } from "./HumanGrip";
import { HumanPrehension } from "./HumanPrehension";
import { prepareHumanShapeBlend } from "./prepareHumanShapeBlend";

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
 * @evidence contracts/development/design.md#principled-representation A clinical-degree shape and metre width produce clinical digit angles plus the body's actual metre aperture; the scalar search parameter represents opening rather than a cached body pose.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The single open operation composes the shared clinical interpolation owner, canonical hand shape and HumanGrip's actual capsule-distance reader; prehension alone owns the width-to-aperture law.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No fitted sample table, substituted collider span or target aperture is represented as an achieved result; the original thumb limit bounds unreachable openings.
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
   *
   * @evidence contracts/development/common.md#meaningful-documentation States width/aperture in metres and clinical joint angles; the namespace explains the unreachable span and thumb-abduction limit.
   * @evidence contracts/development/implementation.md#principled-implementation Retains the same actual tip-distance bisection over closed-to-flat blending and, when needed, signed thumb abduction.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The shared live clinical blend and actual aperture reader feed the original bisection and thumb-abduction branches.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts All thirty iterations, the sixty-degree abduction limit and actual reached aperture remain unchanged.
   * @evidence contracts/development/implementation.md#efficient-algorithms Only canonical digit geometry and exact FK metadata prepare once. Every original endpoint shape/aperture invocation, thirty bisection samples and final achieved read remains; each blend re-reads its current ordered key union and tuple expressions in O(D) work.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Body-owned capsule/rig metadata can be shared, but the borrowed closed tuple graph is never assumed plain or immutable. The cold interpolation owner retains every original source read and candidate shape independently.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns the original fresh chosen joint/scalar data and releases the synchronous aperture workspace on return/throw. No borrowed endpoint coefficient snapshot, body pose, sampled history or external handle escapes.
   */
  export function open(
    body: IHumanBody,
    side: HumanHand.Side,
    closed: IHumanPosture["joints"],
    width: number,
  ): { joints: IHumanPosture["joints"]; aperture: number } {
    const want: number = HumanPrehension.aperture(width);
    const flat: IHumanPosture["joints"] = HumanHand.shape(side, "flat");
    const aperture: ReturnType<typeof HumanGrip.prepareAperture> =
      HumanGrip.prepareAperture(body, side);
    const blend: (weight: number) => IHumanPosture["joints"] = (weight: number): IHumanPosture["joints"] =>
      prepareHumanShapeBlend.cold(closed, flat, weight);
    const solve: (shape: (x: number) => IHumanPosture["joints"], hi: number) => {
      joints: IHumanPosture["joints"]; aperture: number;
    } = (
      shape: (x: number) => IHumanPosture["joints"],
      hi: number,
    ): { joints: IHumanPosture["joints"]; aperture: number } => {
      let lo: number = 0;
      let top: number = hi;
      if (aperture(shape(top)) <= want)
        return {
          joints: shape(top),
          aperture: aperture(shape(top)),
        };
      for (let i: number = 0; i < 30; i++) {
        const mid: number = (lo + top) / 2;
        if (aperture(shape(mid)) < want) lo = mid;
        else top = mid;
      }
      return { joints: shape(top), aperture: aperture(shape(top)) };
    };
    if (aperture(flat) >= want) return solve(blend, 1);

    // Wider than the flat hand: abduct the thumb's carpometacarpal joint, in
    // whichever sense widens the span.
    const thumb: AutoMovieHumanoidBone =
      `${side}ThumbMetacarpal` as AutoMovieHumanoidBone;
    const abducted: (sense: number) => (x: number) => IHumanPosture["joints"] =
      (sense: number) =>
      (x: number): IHumanPosture["joints"] => ({
        ...flat,
        [thumb]: [0, sense * 60 * x, 0] as const,
      });
    const sense: number =
      aperture(abducted(1)(0.5)) >= aperture(abducted(-1)(0.5))
        ? 1
        : -1;
    return solve(abducted(sense), 1);
  }
}
