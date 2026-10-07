/**
 * One published measurement that a layer thickness field is tied to.
 *
 * A thickness field covers the whole skin, and no source measures the whole
 * skin of the population a body is authored for. An anchor records the one
 * place where a field value is a measurement: which quantity a study
 * measured, where on the body, how, on whom, and the value it reported.
 * Everything a field holds away from its anchors is authored interpolation,
 * and a population no anchor measured is unknown rather than assumed equal.
 *
 * @evidence contracts/common.md#principled-implementation The record keeps a measurement together with the conditions it holds under, so a value cannot be read apart from its site and population.
 * @evidence contracts/common.md#clear-and-simple-design One flat record per measurement; the field lists its anchors and owns the interpolation between them.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts An anchor is a read source's value at its own site; it is never a fitted or back-solved number.
 * @evidence contracts/common.md#meaningful-documentation States why a field needs anchors and what lies between them.
 * @evidence contracts/modeling.md#spatial-conventions The value is metres of tissue thickness along the skin normal at the named site.
 * @evidence contracts/anatomy.md#anatomical-source Author, year, venue, quantity, protocol and population travel with the value, and the kind separates a measured mean from an authored one.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping An anchor defines no part.
 * @evidenceExclude contracts/modeling.md#parameter-channels An anchor is source data, not a channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry An anchor emits no geometry.
 * @evidenceExclude contracts/modeling.md#shared-boundaries An anchor builds no surface.
 * @evidenceExclude contracts/modeling.md#rendered-observation An anchor owns nothing a viewer displays.
 * @evidenceExclude contracts/anatomy.md#permitted-range The field consumer owns limited offset observations; an anchor admits no anatomical thickness.
 * @evidenceExclude contracts/anatomy.md#parametric-authority An anchor is offline source data, not an authoring input.
 * @author Samchon
 */
export interface IAutoMovieHumanBodyLayerThicknessAnchor {
  /** Which layer the value is a thickness of. */
  layer: "skin" | "subcutaneous";

  /** Body site or segment as the source defines it. */
  site: string;

  /** Reported thickness in metres. */
  metres: number;

  /** Whether the source measured this value or the field's author set it. */
  kind: "measured" | "authored";

  /** Author, year and venue of the source that was read, or the authoring account. */
  source: string;

  /** Quantity under the source's own definition and its acquisition protocol. */
  protocol: string;

  /** Who was measured; the value applies to no one else. */
  population: string;
}
