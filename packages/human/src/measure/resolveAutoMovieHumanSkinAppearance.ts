import { IAutoMovieHumanAppearance } from "../structures/IAutoMovieHumanAppearance";

/**
 * Resolve optional surface marks into editable zero-feature controls.
 *
 * The returned private copy makes old saved appearances editable without changing
 * their rendered finish. Diameters are conventional authoring defaults; density
 * zero suppresses both color and normal images. No identity or population is read.
 */
export function resolveAutoMovieHumanSkinAppearance(
  skin: IAutoMovieHumanAppearance.ISkin,
): IAutoMovieHumanAppearance.ISkin {
  return {
    ...skin,
    seed: skin.seed ?? 0,
    freckles: {
      ...(skin.freckles ?? { density: 0, diameterMm: 3, contrast: 0.7 }),
    },
    acne: { ...(skin.acne ?? { density: 0, diameterMm: 5, severity: 0.6 }) },
  };
}
