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
