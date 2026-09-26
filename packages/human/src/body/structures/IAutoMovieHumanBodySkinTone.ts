/**
 * The table a body's skin tone heterogeneity is generated from: one square
 * tile of the skin surface, over which the two chromophores that colour skin,
 * melanin and haemoglobin, vary about their site mean, and the variation's
 * growth with age.
 *
 * @evidence requirements/actors/body-authoring/contract.md#actor-body-connected-basis Types the chromophore statistics a user can read to see what the skin's tone variation is made of.
 * @evidence specifications/asset-and-representation/body-authoring/contract.md#body-spec-basis Declares the table form: tile size and resolution, each chromophore's band, spread and absorbance, seed and the age curve.
 * @author Samchon
 */
export interface IAutoMovieHumanBodySkinTone {
  /** Seed of both chromophore fields. */
  seed: number;

  /** Texels along each side of the square tile. */
  pixels: number;

  /** Physical side of the tile, millimetres. */
  tileMillimetres: number;

  /** Melanin, the epidermal pigment. */
  melanin: IAutoMovieHumanBodySkinTone.IChromophore;

  /** Haemoglobin, the dermal blood. */
  haemoglobin: IAutoMovieHumanBodySkinTone.IChromophore;

  /**
   * The variation's strength by the document's `macroAge` weight, `[weight,
   * factor]` points, piecewise linear and held at the ends: skin tone grows
   * less even with age.
   */
  age: [number, number][];
}
export namespace IAutoMovieHumanBodySkinTone {
  /** One chromophore's spatial variation and its colour. */
  export interface IChromophore {
    /**
     * The band of the variation, the shortest and longest wavelength in
     * millimetres: a periodic sum of sinusoids at every integer frequency of
     * the tile inside the band, amplitudes falling as one over the frequency.
     */
    wavelengths: [number, number];

    /** Number of sinusoids drawn inside the band. */
    waves: number;

    /** Standard deviation of the chromophore's optical density at the green primary, natural log units. */
    spread: number;

    /** Its absorbance at the red, green and blue primaries relative to green. */
    absorbance: [number, number, number];
  }
}
