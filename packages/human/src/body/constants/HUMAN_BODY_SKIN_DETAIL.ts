import type { IAutoMovieHumanBodySkinDetail } from "../structures/IAutoMovieHumanBodySkinDetail";

/**
 * The skin micro-relief a body's skin detail is generated from.
 *
 * - **Primary lines** are 20 to 100 µm deep and secondary lines 5 to 40 µm,
 *   perpendicular to the primary (Hashimoto 1974, as quoted by Zahouani et
 *   al. 2014). On a young adult's volar forearm the two primary families run
 *   at about 43 and 137 degrees (Diosa et al. 2021), closing about one
 *   polygon per square millimetre (Trojahn et al. 2015): two families at
 *   right angles about 0.8 mm apart, 40 µm deep, and their secondary lines a
 *   quarter millimetre apart, 12 µm deep.
 * - **Follicular openings**: Otberg et al. 2004 measured hair-follicle
 *   densities in six volunteers (doi:10.1046/j.0022-202X.2003.22110.x):
 *   back 29, thorax 22, upper arm 32, forearm 18, thigh 17 and calf 14 per
 *   cm². The common tile depicts the thorax's 22 as representative dimples
 *   at a 45 µm Gaussian radius. It does not predict each site's follicle
 *   density or model every sweat-gland pore.
 * - **Age**: forearm roughness Ra rises from 16.9 µm at 20 to 29 years to
 *   28.5 µm at 60 to 74 (Li et al. 2006), a factor of 1.7 by `macroAge` 0.65
 *   (67 years); the primary lines deepen as the secondary fade (Zahouani et
 *   al. 2014). The elderly skin's loss of one line orientation (Corcuff et
 *   al. 1991) is not modelled: the tile keeps both families. Ra is aggregate
 *   surface roughness, not a direct measurement of these groove depths; the
 *   age factors are an authored appearance proxy.
 *
 * @evidence requirements/actors/body-authoring/contract.md#actor-body-connected-basis Holds the measured line and pore statistics the skin's close-range relief is made of.
 * @evidence specifications/asset-and-representation/body-authoring/contract.md#body-spec-basis Fixes the tile, the line families, the pores and the age curve the relief is generated from.
 */
export const HUMAN_BODY_SKIN_DETAIL: IAutoMovieHumanBodySkinDetail = {
  seed: 20260925,
  pixels: 256,
  tileMillimetres: 10,
  lines: [
    // primary, 0.79 mm apart at right angles
    { a: 9, b: 9, depth: 40, width: 35, wander: 0.2, vary: 1.5 },
    { a: 9, b: -9, depth: 40, width: 35, wander: 0.2, vary: 1.5 },
    // secondary, 0.25 mm apart
    { a: 28, b: 28, depth: 12, width: 15, wander: 0.35, vary: 1.5 },
    { a: 28, b: -28, depth: 12, width: 15, wander: 0.35, vary: 1.5 },
  ],
  pores: {
    perSquareCentimetre: 22,
    radiusMicrometres: 45,
    depthMicrometres: 30,
  },
  age: [
    [0, 1],
    [0.65, 1.7],
    [1, 1.85],
  ],
};
