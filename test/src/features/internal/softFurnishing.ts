import type { IAutoMovieSoftFurnishing } from "@automovie/interface";

/** Build the original suite-room curtain binding to panel/track identities and apply shallow overrides. Fresh defaults and borrowed nested override values preserve the owning cases' input semantics without installing a cloth player. */
export const softFurnishing: (
  overrides?: Partial<IAutoMovieSoftFurnishing>,
) => IAutoMovieSoftFurnishing = (
  overrides: Partial<IAutoMovieSoftFurnishing> = {},
): IAutoMovieSoftFurnishing => ({
  id: "window-curtain",
  environment: "suite",
  space: "suite-room",
  domain: "panel",
  kind: "curtain",
  mode: "simulated",
  state: null,
  supports: ["track"],
  material: null,
  ...overrides,
});
