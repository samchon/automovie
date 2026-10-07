import type { IAutoMovieHumanPersonBandAttachment } from "./IAutoMovieHumanPersonBandAttachment";

/**
 * The cross-partition rows of a source generation's neck band: each channel
 * that spans the cut defined once over the band instead of stopping at the
 * partition label.
 *
 * The head side carries no band rows: the face owns the head partition's
 * shape, and body endpoints that shape the head (quantities defined once over
 * the skin) reach it through the face view's endpoint drivers. `bodyFaceTargets` are face endpoint and corrective
 * rows on body-partition vertices (shared samples excluded), `[bodyVertex, dx,
 * dy, dz]`, in metres. `bodyAttachments` continue the face attachment fields
 * onto the same band. At the shared samples both partitions already carry
 * their absolute rows, so both formulas meet there. Rows are source data in
 * the shared frame; the band weights that shaped them belong to the
 * generation's producer.
 *
 * @evidence contracts/common.md#principled-implementation One definition per spanning channel over the band replaces a runtime boundary stage; the band lies on the body side only, so no face-owned feature is reshaped by it.
 * @evidence contracts/common.md#clear-and-simple-design Endpoint-keyed sparse rows in the bases' own layout, addressed to the other partition's vertices.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No row is authored by the evaluator; absence of a row means the channel has no band support.
 * @evidence contracts/common.md#meaningful-documentation States each field's domain, reference and the meeting condition at the cut.
 * @evidence contracts/modeling.md#shared-boundaries The rows make both partitions' fields continuous across the registered boundary.
 * @evidence contracts/modeling.md#parameter-channels The rows belong to existing channels and correctives by endpoint name; no channel is added.
 * @evidence contracts/modeling.md#spatial-conventions Metres in the shared Y-up, +Z-forward frame.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The rows define no part.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The rows emit no geometry.
 * @evidenceExclude contracts/modeling.md#rendered-observation The rows are observed through the evaluated person.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The rows are source convention fields.
 * @evidenceExclude contracts/anatomy.md#permitted-range The rows admit nothing.
 * @evidenceExclude contracts/anatomy.md#parametric-authority The rows are compiled source data.
 * @author Samchon
 */
export interface IAutoMovieHumanPersonGenerationBand {
  /** Face endpoint rows on body vertices. */
  bodyFaceTargets: Record<string, number[]>;

  /** Face attachment fields continued onto body vertices. */
  bodyAttachments: IAutoMovieHumanPersonBandAttachment[];
}
