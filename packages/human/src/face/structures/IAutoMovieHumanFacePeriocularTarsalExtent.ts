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
 * @evidence contracts/common.md#principled-implementation An arc length on the supporting surface states a hidden border in the coordinate the plate actually lies in, independent of the skin topology above it.
 * @evidence contracts/common.md#clear-and-simple-design Two per-column arrays and one qualification.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No default extent exists; an absent registration leaves the plate bounded by its skin station as before.
 * @evidence contracts/common.md#meaningful-documentation States why the extent is an arc length, its origin, direction, unit and array order.
 * @evidence contracts/modeling.md#spatial-conventions Metres of arc on the ocular exterior, measured from the posterior margin away from the aperture.
 * @evidence contracts/modeling.md#shared-boundaries The far tarsal border is shared by the tarsal body and the conjunctiva above it; one registered curve defines it for both.
 * @evidence contracts/anatomy.md#anatomical-source The publisher records the kind of each registration in `qualification`. Read sources give tarsal height only as a conventional range (upper 8 to 12 mm, lower 3 to 4 mm; Ferreira et al. 2020, Cancers 12(3):658, citing its reference 1) and horizontal widths of the upper plate as measured values (Hwang 2013, Anat Cell Biol 46(2):93, Korean cadavers); no read primary source measures height per column.
 * @evidence contracts/anatomy.md#parametric-authority Offline shared source registration; it is not a personal authoring input.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping Bounds existing parts and defines none.
 * @evidenceExclude contracts/modeling.md#parameter-channels Carries no channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry Emits no primitive.
 * @evidenceExclude contracts/modeling.md#rendered-observation The tissue builder that consumes it owns the displayed result.
 * @evidenceExclude contracts/anatomy.md#permitted-range The lid frame owner admits the extent against the exterior it is laid on.
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
