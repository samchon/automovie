import type { IAutoMoviePlantingInstallation } from "@automovie/interface";

/** Build the original suite-room planting binding, floor support and stand-pipe irrigation request. Identity/material/irrigation defaults are preserved, final overrides are shallow, and actual support/service validation remains with the owning cases. */
export const plantingInstallation: (
  overrides?: Partial<IAutoMoviePlantingInstallation>,
) => IAutoMoviePlantingInstallation = (
  overrides: Partial<IAutoMoviePlantingInstallation> = {},
): IAutoMoviePlantingInstallation => ({
  id: "lobby-planting",
  environment: "suite",
  space: "suite-room",
  cluster: "atrium-bed",
  kind: "planter",
  support: { kind: "surface", surface: "room-floor" },
  branchMaterial: null,
  leafMaterial: null,
  irrigation: {
    port: "stand-pipe",
    demandLitresPerDay: 12,
    medium: "reclaimed",
    fluidDomain: null,
  },
  ...overrides,
});
