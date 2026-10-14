/**
 * One registered nostril sample polygon read in a basal view
 * (`readHumanNostrilBasal`); its reader and source registration own the
 * distinction between this convention and a measured opening.
 *
 *
 * @evidence contracts/common.md#principled-implementation Area and axes describe an angularly ordered registered nostril sample polygon projected into the basal view; source registration/reader own its distinction from a measured physical opening.
 * @evidence contracts/common.md#clear-and-simple-design Three result fields separate polygon area, longest chord and perpendicular extent from nostril registration and projection.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The record stores no target nostril proportions or specimen-specific surrogate opening.
 * @evidence contracts/common.md#meaningful-documentation Comments give square-metre versus metre units and the projected sample/long-chord conventions.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This nostril result shape selects no polygon ordering, area or chord algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The record coordinates no repeated basal projection or source-margin cache.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Only caller-held scalar results are represented, with no retained polygon, task or native resource.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanNostrilBasal {
  /** Area enclosed by the angularly ordered projected samples, square metres. */
  area: number;

  /** Longest chord of the projected margin, metres. */
  longAxis: number;

  /** Extent of the projected margin perpendicular to the long axis, metres. */
  shortAxis: number;
}
