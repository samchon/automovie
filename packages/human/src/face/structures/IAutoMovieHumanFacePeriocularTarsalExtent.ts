/**
 * Registered extent of the tarsal plates of one eye on the ocular surface.
 *
 * A tarsal plate lies on the globe behind the lid skin and continues under
 * the lid fold, where no skin row marks its far border. Its extent is
 * therefore registered as an arc length on the ocular exterior and not as a
 * skin station: for each lid column, the distance from the posterior lid
 * margin along the globe meridian, away from the aperture, to the far border
 * of the plate. Source publishing owns the values. The lid frame owner
 * builds the posterior lamella over this extent on whatever exterior the
 * optical inputs define.
 *
 * Values are metres. Arrays follow `upperColumns` and `lowerColumns` of the
 * owning cage, medial to lateral, joins included; a join may carry zero.
 * Registered material paths locate the posterior-origin ocular arc on the
 * current exterior. The legacy branch without a material chart retains its
 * spatial strip approximation and does not establish the same exact arc.
 *
 * @evidence contracts/common.md#principled-implementation Registered same-lid source meridian paths locate each supplied posterior-margin-origin arc against the current ocular exterior, independently of the anterior skin near edge.
 * @evidence contracts/common.md#clear-and-simple-design Upper/lower aligned arc arrays and publisher qualification describe far support while the cage owns columns and material continuation paths.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Positive supported domains and actual source crossings are required by the band/locator; zero is not automatically an anterior-margin pole, and the legacy nearest-seated strip is an approximation rather than certified ocular-arc or anatomical measurement.
 * @evidence contracts/common.md#meaningful-documentation Metre arcs, join-inclusive order, posterior origin and registered-versus-legacy meanings prevent treating skin crease rows as measured tarsal borders.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This support record performs no arc integration or source-path location.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Shared extents are source input; compiled bands are reused by the tissue consumer.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Publisher arrays create no exterior query or generated lamella.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanFacePeriocularTarsalExtent {
  /** Far border of the upper plate per upper column, metres of arc from the posterior margin. */
  upperArcMetres: number[];

  /** Far border of the lower plate per lower column, metres of arc from the posterior margin. */
  lowerArcMetres: number[];

  /** Whether the extents are an authored convention or were observed on the source. */
  qualification: "authoredConvention" | "sourceObserved";
}
