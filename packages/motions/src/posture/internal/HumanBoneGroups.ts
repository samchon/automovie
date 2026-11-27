import type { AutoMovieHumanoidBone } from "@automovie/interface";

/*
 * The bone groups laws read by name, each held once: the sets of humanoid bones
 * that several laws demand, exempt or test against, declared here so a law
 * names the group instead of restating its bones.
 */
export namespace HumanBoneGroups {
  /*
   * Both feet.
   */
  export const FEET: ReadonlySet<AutoMovieHumanoidBone> = new Set([
    "leftFoot",
    "rightFoot",
  ]);

  /*
   * Both upper arms, the bones whose roots are the shoulders.
   */
  export const SHOULDERS: ReadonlySet<AutoMovieHumanoidBone> = new Set([
    "leftUpperArm",
    "rightUpperArm",
  ]);

  /*
   * The right upper arm alone, the shoulder of a right-handed implement.
   */
  export const RIGHT_SHOULDER: ReadonlySet<AutoMovieHumanoidBone> = new Set([
    "rightUpperArm",
  ]);

  /*
   * The chest bone alone.
   */
  export const CHEST: ReadonlySet<AutoMovieHumanoidBone> = new Set(["chest"]);

  /*
   * The head bone alone.
   */
  export const HEAD: ReadonlySet<AutoMovieHumanoidBone> = new Set(["head"]);

  /*
   * The hips (pelvis) bone alone.
   */
  export const HIPS: ReadonlySet<AutoMovieHumanoidBone> = new Set(["hips"]);

  /*
   * Both thighs, the bones whose roots are the hip joints.
   */
  export const THIGHS: ReadonlySet<AutoMovieHumanoidBone> = new Set([
    "leftUpperLeg",
    "rightUpperLeg",
  ]);

  /*
   * Both toes segments.
   */
  export const TOES: ReadonlySet<AutoMovieHumanoidBone> = new Set([
    "leftToes",
    "rightToes",
  ]);

  /*
   * Both arms' chains: upper arm, forearm and hand on each side.
   */
  export const ARMS: ReadonlySet<AutoMovieHumanoidBone> = new Set([
    "leftUpperArm",
    "leftLowerArm",
    "leftHand",
    "rightUpperArm",
    "rightLowerArm",
    "rightHand",
  ]);
}
