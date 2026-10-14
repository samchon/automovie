/**
 * One published measurement that a layer thickness field is tied to.
 *
 * A thickness field covers the whole skin, and no source measures the whole skin of the population a body is authored for. An anchor records the one place where a field value is a measurement: which quantity a study measured, where on the body, how, on whom, and the value it reported. Everything a field holds away from its anchors is authored interpolation, and a population no anchor measured is unknown rather than assumed equal.
 *
 * @evidence contracts/common.md#principled-implementation Layer/site/metre value and measured/authored provenance retain the source quantity/protocol/population where one thickness anchor actually applies.
 * @evidence contracts/common.md#clear-and-simple-design Each anchor stores its observation conditions separately from whole-skin authored interpolation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Unmeasured sites/populations stay unknown rather than inheriting an anchor's measured status.
 * @evidence contracts/common.md#meaningful-documentation Members specify layer/site, metre thickness, provenance kind, source/protocol and observed population scope.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Anchor metadata records a value without fitting or interpolating a thickness field.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A study-site anchor defines evidence scope without cached whole-skin estimates.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Thickness/provenance scalars own no acquired study files or measurement instruments.
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
