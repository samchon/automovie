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
