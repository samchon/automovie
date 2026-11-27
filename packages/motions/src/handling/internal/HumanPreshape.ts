import {
  AutoMovieEngineKinematics,
} from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanPreshape,
} from "@automovie/interface";

import { HumanHand } from "../../posture/internal/HumanHand";
import { prepareHumanShapeBlend } from "../../posture/internal/prepareHumanShapeBlend";
import { HumanGrip } from "./HumanGrip";
import { HumanPrehension } from "./HumanPrehension";

/*
 * The open hand a reach carries toward a grasp: the pre-shape whose thumb-index
 * aperture is the peak aperture for the grasped width
 * (`HumanPrehension.aperture`).
 *
 * The open hand is found on the thumb-index aperture of the body's own digit
 * colliders (`HumanGrip.aperture`): a blend from the closed grasp toward the
 * flat hand when the flat hand is wide enough, else the flat hand with the
 * thumb's carpometacarpal joint abducted until it is, the joint that opens the
 * human grip span; a span the hand cannot reach within the joint's range of
 * abduction stops at the range's end and reports the aperture it reached.
 */
export namespace HumanPreshape {
  /*
   * The open pre-shape whose thumb-index aperture is the peak aperture for a
   * width.
   * Parameter body: The body.
   * Parameter side: The hand.
   * Parameter closed: The closed grasp's digit angles.
   * Parameter width: The grasped width, metres.
   * Returns: The pre-shape's angles and the aperture it reaches, metres.
   */
  export function open(
    body: IAutoMovieMotionHumanBody,
    side: AutoMovieHumanSide,
    closed: IAutoMovieMotionHumanPosture["joints"],
    width: number,
  ): IAutoMovieMotionHumanPreshape.IOpenResult {
    const want: number = HumanPrehension.aperture(width);
    const flat: IAutoMovieMotionHumanPosture["joints"] = HumanHand.shape(
      side,
      "flat",
    );
    const aperture: ReturnType<typeof HumanGrip.prepareAperture> =
      HumanGrip.prepareAperture(body, side);

    // The opening that reaches the wanted aperture, by bisection on the
    // opening share of a shape monotone in it; `ITERATIONS` halvings leave
    // the share within 2^-30 of the crossing. A shape that stays narrower
    // at its full opening is returned there.
    const solve: (
      shape: (x: number) => IAutoMovieMotionHumanPosture["joints"],
    ) => IAutoMovieMotionHumanPreshape.IOpenResult = (
      shape: (x: number) => IAutoMovieMotionHumanPosture["joints"],
    ): IAutoMovieMotionHumanPreshape.IOpenResult => {
      const full: IAutoMovieMotionHumanPosture["joints"] = shape(1);
      const widest: number = aperture(full);
      if (widest <= want) return { joints: full, aperture: widest };
      let lo: number = 0;
      let top: number = 1;
      for (let i: number = 0; i < ITERATIONS; i++) {
        const mid: number = (lo + top) / 2;
        if (aperture(shape(mid)) < want) lo = mid;
        else top = mid;
      }
      const joints: IAutoMovieMotionHumanPosture["joints"] = shape(top);
      return { joints, aperture: aperture(joints) };
    };
    if (aperture(flat) >= want)
      return solve(prepareHumanShapeBlend(closed, flat));

    // Wider than the flat hand: abduct the thumb's carpometacarpal joint, in
    // whichever sense widens the span, up to the end of the body's range in
    // that sense, so every trial is a pose the joint can take.
    const thumb: AutoMovieHumanoidBone =
      `${side}ThumbMetacarpal` as AutoMovieHumanoidBone;
    const limit: (sense: number) => number = (sense: number): number =>
      AutoMovieEngineKinematics.clampJointToSkeleton(
        { bone: thumb, flexion: 0, abduction: sense * 180, twist: 0 },
        body.skeleton,
      ).abduction ?? 0;
    const abducted: (
      sense: number,
    ) => (x: number) => IAutoMovieMotionHumanPosture["joints"] = (
      sense: number,
    ): ((x: number) => IAutoMovieMotionHumanPosture["joints"]) => {
      const end: number = limit(sense);
      return (x: number): IAutoMovieMotionHumanPosture["joints"] => ({
        ...flat,
        [thumb]: [0, end * x, 0] as const,
      });
    };
    const sense: number =
      aperture(abducted(1)(0.5)) >= aperture(abducted(-1)(0.5)) ? 1 : -1;
    return solve(abducted(sense));
  }
}

/*
 * The halvings of the opening share's bisection: 2^-30 of the share, far below
 * a joint's resolution.
 */
const ITERATIONS: number = 30;
