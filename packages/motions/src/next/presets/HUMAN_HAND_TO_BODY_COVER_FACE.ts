import type { IAutoMovieMotionHumanHandToBody } from "@automovie/interface";

/**
 * The cover-face preset: the right hand, one cover, no prop, no grasp and no
 * other hand, and the hold on the right and the left cheek as one row (bare
 * flat palms with the fingers upward, the head bowed 15 degrees, the pose
 * arriving at `atFace`, held 1.2 s after `taskEnd`). Spread into `handToFace`'s
 * parameters; the `coverFace` row fixes these values. Face hiding as part of
 * crying (Wróbel, Zickfeld and Ciesielski 2025,
 * https://doi.org/10.3758/s13428-025-02766-4); the bilateral pose, the bow and
 * the hold are authored choices.
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
