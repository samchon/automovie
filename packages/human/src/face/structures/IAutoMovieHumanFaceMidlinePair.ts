/**
 * Upper and lower midline vertices on one face basis surface.
 *
 * The contact owner reads the pair's posed separation along the basis frame's
 * vertical, made perpendicular to the mandibular axis, as an aperture: the
 * vermilion seam pair gives the interlabial and the incisal edge pair the
 * interincisal aperture. Both vertices are found once on the shared topology.
 *
 * @evidence contracts/common.md#principled-implementation A fixed vertex pair on the shared topology measures the aperture on every evaluated document instead of a per-person table.
 * @evidence contracts/common.md#clear-and-simple-design One named surface-and-pair record serves both the lip and the incisor apertures.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The pair is shared basis topology, never a personal vertex selection or a fixture constant.
 * @evidence contracts/common.md#meaningful-documentation States vertex order, the measuring direction and which aperture each pair yields.
 * @evidence contracts/modeling.md#spatial-conventions Vertex IDs are dimensionless indices into the named surface; the measured separation is metres in the Y-up head frame.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The pair addresses an existing surface and defines no part.
 * @evidenceExclude contracts/modeling.md#parameter-channels The pair is a measurement site, not a shaping channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The pair emits no geometry.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The pair builds no boundary between parts.
 * @evidenceExclude contracts/modeling.md#rendered-observation The contact owner and face builder observe the evaluated form.
 * @evidence contracts/anatomy.md#anatomical-source The vermilion seam and incisal edge midlines are the anatomical landmarks the interlabial and interincisal apertures are defined on.
 * @evidenceExclude contracts/anatomy.md#permitted-range The pair bounds no value; the contact owner refuses impossible combinations.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Shared basis topology is not an input through which a caller shapes a person.
 * @author Samchon
 */
export interface IAutoMovieHumanFaceMidlinePair {
  /** ID of the basis surface both vertices belong to. */
  surface: string;

  /** Upper midline vertex index on that surface. */
  upper: number;

  /** Lower midline vertex index on that surface. */
  lower: number;
}
