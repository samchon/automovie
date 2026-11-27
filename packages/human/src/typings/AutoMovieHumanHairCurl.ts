import type { AutoMovieHumanHairCurl as AutoMovieHumanHairCurlContract } from "@automovie/interface";

/** L'Oreal's eight fibre-shape classes, as recorded in Human's docs/anatomy/hair.md. Class labels do not define helix radius/pitch; the source record does not supply numerical class thresholds. Serialized labels remain I through VIII. */
export namespace AutoMovieHumanHairCurl {
  /** L'Oreal curl class I; one of the curve-diameter-defined classes I-IV. */
  export const I: "I" = "I" satisfies AutoMovieHumanHairCurlContract;
  /** L'Oreal curl class II; one of the curve-diameter-defined classes I-IV. */
  export const II: "II" = "II" satisfies AutoMovieHumanHairCurlContract;
  /** L'Oreal curl class III; one of the curve-diameter-defined classes I-IV. */
  export const III: "III" = "III" satisfies AutoMovieHumanHairCurlContract;
  /** L'Oreal curl class IV; one of the curve-diameter-defined classes I-IV. */
  export const IV: "IV" = "IV" satisfies AutoMovieHumanHairCurlContract;
  /** L'Oreal curly/coily class V, distinguished using curl index, waves and twists as well as diameter. */
  export const V: "V" = "V" satisfies AutoMovieHumanHairCurlContract;
  /** L'Oreal curly/coily class VI, distinguished using curl index, waves and twists as well as diameter. */
  export const VI: "VI" = "VI" satisfies AutoMovieHumanHairCurlContract;
  /** L'Oreal curly/coily class VII, distinguished using curl index, waves and twists as well as diameter. */
  export const VII: "VII" = "VII" satisfies AutoMovieHumanHairCurlContract;
  /** L'Oreal curly/coily class VIII, distinguished using curl index, waves and twists as well as diameter. */
  export const VIII: "VIII" = "VIII" satisfies AutoMovieHumanHairCurlContract;
}
