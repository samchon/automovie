import type { IAutoMovieAxisFrame } from "@automovie/interface";

export namespace HumanoidRestFrameData {
  /*
   * Bones of each arm from the clavicle to the fingertips, without the side
   * prefix.
   */
  export const ARM: readonly string[] = [
    "Shoulder",
    "UpperArm",
    "LowerArm",
    "Hand",
    "ThumbMetacarpal",
    "ThumbProximal",
    "ThumbDistal",
    "IndexProximal",
    "IndexIntermediate",
    "IndexDistal",
    "MiddleProximal",
    "MiddleIntermediate",
    "MiddleDistal",
    "RingProximal",
    "RingIntermediate",
    "RingDistal",
    "LittleProximal",
    "LittleIntermediate",
    "LittleDistal",
  ];

  /*
   * Bones of each leg from the hip to the toes, without the side prefix.
   */
  export const LEG: readonly string[] = ["UpperLeg", "LowerLeg", "Foot", "Toes"];

  /*
   * Bones whose fingertip-ward motions read on the hand's basis, without the side
   * prefix.
   */
  export const HAND: readonly string[] = ARM.slice(3);

  /*
   * A reversed axis at the rig's own rest.
   */
  export const REVERSED: IAutoMovieAxisFrame = { sign: -1, neutral: 0 };
}
