import type { IAutoMovieMotionHumanHandToBody } from "@automovie/interface";

/**
 * The cover-face preset: the right hand, one cover, no prop, no grasp and no
 * other hand, and the hold on the right and the left cheek as one row (bare
 * flat palms with the fingers upward, the head bowed 15 degrees, the pose
 * arriving at `atFace`, held 1.2 s after `taskEnd`). Spread into
 * `handToFace`'s parameters; the `coverFace` row fixes these values. Face
 * hiding as part of crying (Wróbel, Zickfeld and Ciesielski 2025,
 * https://doi.org/10.3758/s13428-025-02766-4); the bilateral pose, the bow
 * and the hold are authored choices.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the fixed hand, count, cheeks, palms, bow, arrival event and hold with their units, how it is applied and which row reads it.
 * @evidence contracts/development/design.md#principled-representation The cover's fixed members of the hand-to-face law as one `ICoverFacePreset`.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Re-exported as `AutoMovieMotionHumanHandToBody.COVER_FACE`; the `coverFace` row reads it.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts None: the row and the preset share one value instead of two copies.
 */
export const HUMAN_HAND_TO_BODY_COVER_FACE: IAutoMovieMotionHumanHandToBody.ICoverFacePreset =
  {
    hand: "right",
    count: 1,
    prop: undefined,
    point: undefined,
    grasp: undefined,
    other: undefined,
    kind: {
      region: "cheekRight",
      other: "cheekLeft",
      effector: { surface: "palm", shape: "flat" },
      kind: "hold",
      count: 1,
      hold: 1.2,
      tangent: "up",
      head: 15,
      at: "atFace",
    },
  };
