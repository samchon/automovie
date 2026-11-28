import type { AutoMovieHumanHairCurl as AutoMovieHumanHairCurlContract } from "@automovie/interface";

/**
 * The eight L'Oréal fiber-shape labels for scalp hair.
 *
 * The source classification groups I through IV by curve diameter. V through
 * VIII also consider curl index, waves and twists. The caller supplies a class
 * label. Length is a separate scalp-hair field.
 */
export namespace AutoMovieHumanHairCurl {
  /** Class I, the straight end of the L'Oréal scale. */
  export const I: "I" = "I" satisfies AutoMovieHumanHairCurlContract;
  /** Class II in the curve-diameter group. */
  export const II: "II" = "II" satisfies AutoMovieHumanHairCurlContract;
  /** Class III in the curve-diameter group. */
  export const III: "III" = "III" satisfies AutoMovieHumanHairCurlContract;
  /** Class IV in the curve-diameter group. */
  export const IV: "IV" = "IV" satisfies AutoMovieHumanHairCurlContract;
  /** Class V in the curly and coily group. */
  export const V: "V" = "V" satisfies AutoMovieHumanHairCurlContract;
  /** Class VI in the curly and coily group. */
  export const VI: "VI" = "VI" satisfies AutoMovieHumanHairCurlContract;
  /** Class VII in the curly and coily group. */
  export const VII: "VII" = "VII" satisfies AutoMovieHumanHairCurlContract;
  /** Class VIII, the tightly coiled end of the scale. */
  export const VIII: "VIII" = "VIII" satisfies AutoMovieHumanHairCurlContract;
}
