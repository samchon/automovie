import type { IAutoMovieHumanBodySkinTone } from "../structures/IAutoMovieHumanBodySkinTone";

/**
 * The skin tone heterogeneity a body's skin detail is generated from.
 *
 * - **Chromophores.** Skin colour is set by two chromophores: melanin in the
 *   epidermis and haemoglobin in the dermal blood. A skin site's mean colour
 *   comes from the site albedo (`HUMAN_BODY_SKIN_SITES`). This table varies
 *   each chromophore about that mean, the unevenness image analysis
 *   separates into melanin and haemoglobin maps (Tsumura et al. 2003).
 * - **Absorbance at the primaries.** Relative to green, at the dominant
 *   wavelengths of the sRGB primaries (red 611 nm, green 549 nm, blue
 *   464 nm):
 *   - melanin absorbs as a power law, λ^-3.5 (Jacques 2013): red 0.69,
 *     blue 1.80;
 *   - oxygenated haemoglobin's molar extinction, interpolated from Prahl's
 *     tabulation (1999), is 1450, 44 038 and 39 972 cm⁻¹/M: red 0.033,
 *     blue 0.91.
 *
 *   More melanin darkens and yellows the skin; more blood reddens it.
 * - **Band.** Melanin varies from 2 to 40 mm and haemoglobin from 3 to
 *   25 mm, the scales of the spots and blotches that chromophore maps
 *   resolve on the cheek and forearm.
 * - **Spread.** Authored, not measured: 1.5 % optical density for melanin
 *   and 2 % for haemoglobin at green, about one CIE L* unit in all, the
 *   evenness of a young adult's skin.
 * - **Age.** The variation grows with age (Kikuchi et al. 2015, facial
 *   chromophore heterogeneity). The factor of 2 by `macroAge` 0.65
 *   (67 years) is authored.
 *
 * @evidence requirements/actors/body-authoring/contract.md#actor-body-connected-basis Holds the chromophore statistics the skin's tone variation is made of.
 * @evidence specifications/asset-and-representation/body-authoring/contract.md#body-spec-basis Fixes the tile, both chromophores' bands, spreads and absorbance, and the age curve the variation is generated from.
 */
export const HUMAN_BODY_SKIN_TONE: IAutoMovieHumanBodySkinTone = {
  seed: 20260926,
  pixels: 384,
  tileMillimetres: 160,
  melanin: {
    wavelengths: [2, 40],
    waves: 64,
    spread: 0.015,
    absorbance: [0.69, 1, 1.8],
  },
  haemoglobin: {
    wavelengths: [3, 25],
    waves: 64,
    spread: 0.02,
    absorbance: [0.033, 1, 0.91],
  },
  age: [
    [0, 1],
    [0.65, 2],
    [1, 2.2],
  ],
};
