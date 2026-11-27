/**
 * Points of the midline and beside it, `[x, y]`, calibration millimetres.
 *
 * The owning layout retains only fixed-size numeric tuples.
 */
export interface IAutoMovieHumanHeadLandmarks {
  /** Glabella. */
  glabella: IAutoMovieHumanHeadLandmarks.P2;

  /** Nasion. */
  nasion: IAutoMovieHumanHeadLandmarks.P2;

  /** Pronasale. */
  pronasale: IAutoMovieHumanHeadLandmarks.P2;

  /** Subnasale. */
  subnasale: IAutoMovieHumanHeadLandmarks.P2;

  /** Stomion. */
  stomion: IAutoMovieHumanHeadLandmarks.P2;

  /**
   * Shared upper vermilion border; its chord to stomion is the public upper
   * height.
   */
  labraleSuperius: IAutoMovieHumanHeadLandmarks.P2;

  /**
   * Shared lower vermilion border; its chord to stomion is the public lower
   * height.
   */
  labraleInferius: IAutoMovieHumanHeadLandmarks.P2;

  /** Pogonion, the chin's most prominent point. */
  pogonion: IAutoMovieHumanHeadLandmarks.P2;

  /** Menton. */
  menton: IAutoMovieHumanHeadLandmarks.P2;

  /** Gnathion, where the chin's turn faces forward and down. */
  gnathion: IAutoMovieHumanHeadLandmarks.P2;

  /** Tragion, `[x, y]`, at the cranial base's half width. */
  tragion: IAutoMovieHumanHeadLandmarks.P2;

  /** Zygion, `[x, y]`. */
  zygion: IAutoMovieHumanHeadLandmarks.P2;

  /** Frontotemporale, `[x, y]`. */
  frontal: IAutoMovieHumanHeadLandmarks.P2;

  /** Gonion, `[x, y]`, before the jaw is built. */
  gonion: IAutoMovieHumanHeadLandmarks.P2;

  /**
   * Retained posterior profile's horizontal-tangent reference height; the
   * maximum-caliper point is found on the actual source and need not be here.
   */
  occiput: number;
}

/**
 * Type contracts exchanged by IAutoMovieHumanHeadLandmarks; runtime evaluation
 * remains in Human.
 */
export namespace IAutoMovieHumanHeadLandmarks {
  /** A point of a section. */
  export type P2 = [number, number];
}
