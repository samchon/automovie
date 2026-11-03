/** Points of the midline and beside it, `[x, y]`, calibration millimetres. */
export interface IAutoMovieHumanHeadLandmarks {
  /** Glabella. */
  glabella: P2;

  /** Nasion. */
  nasion: P2;

  /** Pronasale. */
  pronasale: P2;

  /** Subnasale. */
  subnasale: P2;

  /** Stomion. */
  stomion: P2;

  /** Pogonion, the chin's most prominent point. */
  pogonion: P2;

  /** Menton. */
  menton: P2;

  /** Gnathion, where the chin's turn faces forward and down. */
  gnathion: P2;

  /** Tragion, `[x, y]`, at the cranial base's half width. */
  tragion: P2;

  /** Zygion, `[x, y]`. */
  zygion: P2;

  /** Frontotemporale, `[x, y]`. */
  frontal: P2;

  /** Gonion, `[x, y]`, before the jaw is built. */
  gonion: P2;

  /** Opisthocranion's height. */
  occiput: number;
}

/** A point of a section. */
type P2 = [number, number];
