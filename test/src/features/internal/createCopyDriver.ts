import { type IAutoMovieCopyDriver } from "@automovie/interface";

/** Create the existing o-from-s copy fixture with all component flags disabled and full influence, then apply the caller's original overrides. */
export function createCopyDriver(
  overrides: Partial<IAutoMovieCopyDriver>,
): IAutoMovieCopyDriver {
  return {
    type: "copy",
    owner: "o",
    source: "s",
    translation: false,
    rotation: false,
    scale: false,
    influence: 1,
    ...overrides,
  };
}
