/**
 * A channel-driven translation of the whole mandible: protrusion, or one side
 * of laterotrusion.
 *
 * @evidence contracts/common.md#principled-implementation An expression channel scales one authored metre vector for whole-mandible protrusion or laterotrusion, added by the shared articulation owner.
 * @evidence contracts/common.md#clear-and-simple-design A channel/vector pair serves protrusive and lateral owners without duplicating pivot or axis.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The vector is not an observed clinical maximum or independent vertex edit; it bypasses no joint/contact admission.
 * @evidence contracts/common.md#meaningful-documentation The comment states whole-mandible scope and fields identify the channel and weight-one metre displacement.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This record executes no vector scaling or motion composition.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work It defines no shared articulation result or translation cache.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The basis owns its fixed triple and this type opens no resource.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanFaceBasisJawTranslation {
  /** The expression channel that drives this translation. */
  channel: string;

  /** Mandibular translation at weight one, in metres. */
  translation: [number, number, number];
}
