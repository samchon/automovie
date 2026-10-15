import { AutoMovieHumanHairColor } from "../structures/AutoMovieHumanHairColor";

/**
 * Linear RGB of each hair colour choice, the colour the strand atlas's grey is multiplied by.
 *
 * Hair colour follows eumelanin (brown to black) and pheomelanin (red to yellow) in the cortex, but no measured reflectance or melanin content per category was read, so these are conventional values chosen to read as their names under neutral light, the darkest near the reflectance of black hair and blond several times lighter. Grey mixes pigmented and white strands, which the strands' own brightness spread renders as a mid grey.
 */
export const AUTOMOVIE_HUMAN_HAIR_COLORS: Record<
  AutoMovieHumanHairColor,
  { r: number; g: number; b: number }
> = {
  black: { r: 0.018, g: 0.016, b: 0.015 },
  darkBrown: { r: 0.05, g: 0.03, b: 0.02 },
  brown: { r: 0.11, g: 0.065, b: 0.036 },
  lightBrown: { r: 0.24, g: 0.15, b: 0.085 },
  blond: { r: 0.55, g: 0.42, b: 0.25 },
  auburn: { r: 0.2, g: 0.065, b: 0.03 },
  red: { r: 0.36, g: 0.11, b: 0.035 },
  gray: { r: 0.33, g: 0.32, b: 0.31 },
  white: { r: 0.75, g: 0.74, b: 0.72 },
};
