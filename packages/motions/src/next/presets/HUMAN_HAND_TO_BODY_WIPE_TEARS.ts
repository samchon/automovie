import type { IAutoMovieMotionHumanHandToBody } from "@automovie/interface";

/**
 * The wipe-tears preset: no other prop handle, and one rub of the right cheek
 * (mirrored for the left hand) by a flat palm, going up and down once with no
 * hold, the head unmoved, the arrival event `atCheek`. Spread into
 * `handToFace`'s parameters; the `wipeTears` row fixes these values. Face
 * touching as a visible component of crying (Wróbel, Zickfeld and Ciesielski
 * 2025, https://doi.org/10.3758/s13428-025-02766-4); the path, the palm shape
 * and the timing are authored choices.
 */
export const HUMAN_HAND_TO_BODY_WIPE_TEARS: IAutoMovieMotionHumanHandToBody.IWipeTearsPreset =
  {
    other: undefined,
    kind: {
      region: "cheekRight",
      effector: { surface: "palm", shape: "flat" },
      kind: "rub",
      count: 1,
      hold: 0,
      tangent: "up",
      head: 0,
      at: "atCheek",
    },
  };
