/**
 * Default, authoring interval and ground of one lid tissue dimension, in
 * millimetres.
 *
 * `kind` separates what a read source measured from what was derived from
 * measured values and from what is authored where no source answers.
 * `ground` names the source with its quantity, site and population, or the
 * derivation, or says that the value is authored. The interval is an
 * authoring envelope for an editor; it is not a clinical normal range, and
 * the lid frame still refuses a value the constructed lid cannot hold.
 *
 * @evidence contracts/common.md#principled-implementation Descriptor metadata distinguishes measured-site source defaults, derived quantities and authored extensions; the default expander uses its mm values only with registered cage/generated optics.
 * @evidence contracts/common.md#clear-and-simple-design Default, editor envelope, classification and source ground are distinct fields rather than an unexplained universal tissue slider.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Catalogue intervals are editing envelopes, not clinical normal ranges or patient measurements; cross-site arithmetic and lower-lid extensions remain authored, and geometry admission independently judges actual room.
 * @evidence contracts/common.md#meaningful-documentation Unit, source quantity/site/population and measured-versus-derived-versus-authored classification preserve the grounds and their limits.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This metadata record performs no statistical derivation or tissue construction.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Shared catalogue ownership is data reuse, not runtime mesh caching here.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Scalars and ground text retain no primary-source imaging or renderer resource.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanFacePeriocularScalarDescriptor {
  /** Default value. */
  defaultMm: number;

  /** Lower end of the authoring envelope. */
  minimumMm: number;

  /** Upper end of the authoring envelope. */
  maximumMm: number;

  /** Whether the default was measured by a read source, derived from measured values, or authored. */
  kind: "measured" | "derived" | "authored";

  /** Source with quantity, site and population, or the derivation, or the statement that it is authored. */
  ground: string;
}
