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
 *
 *
 * @evidence contracts/development/common.md#meaningful-documentation Points of the midline and beside it, `[x, y]`, calibration millimetres.
 * @evidence contracts/development/design.md#principled-representation `glabella`: Glabella. `nasion`: Nasion. `pronasale`: Pronasale.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Also types AutoMovieHumanHeadVault.m, AutoMovieHumanHeadInnerParts.m.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `glabella`, `nasion`, `pronasale`, `subnasale`, `stomion`, `labraleSuperius`, `labraleInferius`, `pogonion`, `menton`, `gnathion`, `tragion`, `zygion`, `frontal`, `gonion`, `occiput`; callers supply the complete record.
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

  /** Shared upper vermilion border; its chord to stomion is the public upper height. */
  labraleSuperius: IAutoMovieHumanHeadLandmarks.P2;

  /** Shared lower vermilion border; its chord to stomion is the public lower height. */
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

  /** Retained posterior profile's horizontal-tangent reference height; the maximum-caliper point is found on the actual source and need not be here. */
  occiput: number;
}

/** Type contracts exchanged by IAutoMovieHumanHeadLandmarks; runtime evaluation remains in Human. */
export namespace IAutoMovieHumanHeadLandmarks {
  /** A point of a section.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation A point of a section.
   * @evidence contracts/development/design.md#principled-representation A point of a section. Ordered tuple slots are 0, 1; fixed arity preserves their correspondence.
   * @evidence contracts/development/design.md#minimal-and-owned-surface IAutoMovieHumanHeadLandmarks.P2 belongs to IAutoMovieHumanHeadLandmarks; its public declaration is reached by the Human main-entry export closure.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts A point of a section. Its exported identity is retained for the existing Human public surface.
   */
  export type P2 = [number, number];
}
