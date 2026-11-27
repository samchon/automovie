export namespace LieTogetherData {
  /*
   * How far off the partner's skin the resting region lies, metres (provisional:
   * a skin contact).
   */
  export const REST: number = 0.005;

  /*
   * The lower arm's fold as the body settles, clinical degrees: the upper arm
   * forward and the elbow bent, the hand up before the face, so the arm a body
   * lies on stays out of the partner (provisional).
   */
  export const FOLD: Readonly<Record<ArmBone, readonly [number, number, number]>> = {
    upper: [90, 0, 0],
    lower: [140, 0, 0],
  };

  /*
   * The lower arm's fold when spooning, clinical degrees: the upper arm raised
   * along the floor above the head and the elbow bent back, the forearm under the
   * head as its pillow, so the arm a spooning body lies on stays behind its own
   * head instead of reaching into the partner it lies behind (the forward fold
   * met the partner's chest 42 mm deep; provisional).
   */
  export const PILLOW: Readonly<Record<ArmBone, readonly [number, number, number]>> = {
    upper: [160, 0, 0],
    lower: [100, 0, 0],
  };

  /*
   * How far two lying headings may differ, degrees (provisional).
   */
  export const ALIGNED: number = 25;

  /*
   * The two bones of a folding arm.
   */
  export type ArmBone = "upper" | "lower";
}
