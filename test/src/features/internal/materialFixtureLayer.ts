import type { IAutoMovieMaterialLayer } from "@automovie/interface";

/**
 * Construct one solid layer with the caller's id and metre thickness.
 *
 * The role and substance reference come from that id, and finish and opening-wrap flags start false; overrides are applied last so an existing consumer can deliberately author an invalid variant. This fresh record supplies input to assembly validation, placement and junction tests, which derive and assert their own expected positions or diagnostics. The builder performs no validation, resolves no substance and starts no host.
 */
export function materialFixtureLayer(
  id: string,
  thickness: number,
  overrides: Partial<IAutoMovieMaterialLayer> = {},
): IAutoMovieMaterialLayer {
  return {
    id,
    role: id,
    substance: "solid",
    thickness,
    material: `${id}-substance`,
    finish: false,
    wrapsOpening: false,
    ...overrides,
  };
}
