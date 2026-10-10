import type { IAutoMovieHumanFaceSkinRegionAppearance } from "../../structures/IAutoMovieHumanFaceSkinRegionAppearance";

/**
 * Identity appearance for an unedited named skin area.
 * White gain and zero strength preserve the basis albedo exactly. This is an
 * algebraic identity, not a population-derived skin colour or a measurement.
 * A product preparing a new editable region takes an owned copy of this record;
 * source appearance itself stays with the immutable basis.
 */
export const HUMAN_FACE_SKIN_REGION_APPEARANCE: IAutoMovieHumanFaceSkinRegionAppearance =
  {
    gain: [1, 1, 1],
    strength: 0,
  };
