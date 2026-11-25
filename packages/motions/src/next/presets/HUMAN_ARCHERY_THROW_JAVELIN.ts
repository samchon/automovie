import type { IAutoMovieMotionHumanArchery } from "@automovie/interface";

/**
 * The throw javelin preset: a javelin or a spear thrown overarm at the middle
 * of the elite release angles Campos, Brizuela and Ramon (2004) measured at the
 * 1999 World Championships (27.7 to 40.1 degrees), 33.9 degrees, the shaft
 * along its velocity. The `throwJavelin` and `throwSpear` rows of
 * `HumanThrownWeapon` read it, so the row and the preset share one value.
 */
export const HUMAN_ARCHERY_THROW_JAVELIN: IAutoMovieMotionHumanArchery.IJavelinPreset =
  {
    style: "overarm",
    angle: (27.7 + 40.1) / 2,
    attitude: { kind: "velocity" },
  };
