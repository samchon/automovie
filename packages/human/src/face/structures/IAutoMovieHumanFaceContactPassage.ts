/**
 * The tongue passage a face basis's oral contact evaluates.
 *
 * A tongue past the incisal plane must be thinner, over the slab of half-width
 * `slabMetres` about that plane, than both the interincisal and interlabial
 * apertures, because a constant-volume muscular hydrostat cannot be pressed
 * through closed teeth or sealed lips.
 *
 * @evidence contracts/common.md#principled-implementation Registered tongue identity/protrusion channel and incisal slab half-width support actual posed section thickness versus incisal/interlabial aperture admission.
 * @evidence contracts/common.md#clear-and-simple-design Surface/channel/metric slab define passage acquisition while the evaluator owns its moving incisal frame and measured gaps.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Behind-plane tissue needs no passage read, but a protruding tongue without a measured slab section refuses; no requested motion is clamped or moved by passage admission.
 * @evidence contracts/common.md#meaningful-documentation The comment supplies tongue/aperture premise and members name exact surface, channel and metre half-width.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This schema computes no triangle-slab intersection or thickness.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Passage registration defines no section cache or repeated posed-frame reuse.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The basis owns three values and this declaration opens no mesh-query resource.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanFaceContactPassage {
  /** ID of the tongue surface. */
  surface: string;

  /** Tongue protrusion channel. */
  channel: string;

  /** Slab half-width about the incisal plane, in metres. */
  slabMetres: number;
}
