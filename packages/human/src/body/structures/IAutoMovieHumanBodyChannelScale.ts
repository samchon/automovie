import type { IAutoMovieHumanFaceEndpointScale } from "../../face/structures/IAutoMovieHumanFaceEndpointScale";

/**
 * How far one unit of a body channel moves the skin, and what it measures.
 *
 * A body channel is a dimensionless authored weight like a face channel, so
 * the per-unit RMS displacement, peak and moved-vertex count are reported the
 * same way (`IAutoMovieHumanFaceEndpointScale`, metres, over the whole
 * surface). What the body adds is the measurement: a girth, a distance or a
 * height evaluated on the shaped surface, so a channel that the source calls
 * `measure-bust-circ` can be shown and typed as millimetres of bust girth
 * rather than as a weight. `measurement` is null for a channel with no rule,
 * and a rule that cannot be evaluated on this basis (the neck lies above the
 * clip) reports null values inside a present record.
 *
 * @evidence requirements/actors/body-authoring/contract.md#actor-body-measurements Reports each channel's neutral value and per-unit change in metres beside its geometric commitment.
 * @evidence specifications/asset-and-representation/body-authoring/contract.md#body-spec-measurements Carries the RMS, peak and moved-vertex figures together with the rule's neutral, positive and negative evaluations.
 * @author Samchon
 */
export interface IAutoMovieHumanBodyChannelScale {
  /** Channel identity, matching the basis channel this measures. */
  id: string;

  /** Copied from the channel so a caller can group without a second lookup. */
  group: string;

  /** Metric effect of the positive endpoint, always present. */
  positive: IAutoMovieHumanFaceEndpointScale;

  /** Metric effect of the negative endpoint, or null for a nonnegative control. */
  negative: IAutoMovieHumanFaceEndpointScale | null;

  /**
   * The measurement rule bound to this channel, evaluated in metres at the
   * neutral and at each endpoint's full weight, or null when no rule is bound.
   * A rule the surface cannot answer (no section loop, a landmark the basis
   * lacks) reports null values rather than a number.
   */
  measurement: {
    /** Rule identity from `HUMAN_BODY_MEASUREMENTS`. */
    id: string;
    kind: "girth" | "distance" | "height" | "breadth";
    neutral: number | null;
    positive: number | null;
    negative: number | null;
  } | null;
}
