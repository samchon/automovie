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
 * @author Samchon
 */
export interface IAutoMovieHumanPersonGenerationBand {
  /** Face endpoint rows on body vertices. */
  bodyFaceTargets: Record<string, number[]>;

  /** Face attachment fields continued onto body vertices. */
  bodyAttachments: IAutoMovieHumanPersonBandAttachment[];
}
