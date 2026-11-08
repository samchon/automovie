/**
 * Points of the midline and beside it, `[x, y]`, calibration millimetres.
 *
 * @evidence contracts/common.md#principled-implementation Shared named datums supply original head and regional sources; LS/LI chords remain independent of section bulk priors.
 * @evidence contracts/common.md#clear-and-simple-design One fixed landmark record replaces independently recomputed border locations.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The record claims neither individual clinical peaks nor final realized skin positions.
 * @evidence contracts/common.md#meaningful-documentation Every field identifies its anatomical site and the tuple's calibration units.
 * @evidenceExclude contracts/performance.md#efficient-algorithms A data interface evaluates no geometry.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The layout producer owns datum preparation.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The owning layout retains only fixed-size numeric tuples.
 */
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

  /** Shared upper vermilion border; its chord to stomion is the public upper height. */
  labraleSuperius: P2;

  /** Shared lower vermilion border; its chord to stomion is the public lower height. */
  labraleInferius: P2;

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

  /** Retained posterior profile's horizontal-tangent reference height; the maximum-caliper point is found on the actual source and need not be here. */
  occiput: number;
}

/** A point of a section. */
type P2 = [number, number];
