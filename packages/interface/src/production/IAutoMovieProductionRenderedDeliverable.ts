import { IAutoMovieProductionDeliverable } from "./IAutoMovieProductionDeliverable";
import { IAutoMovieProductionDeliverableFile } from "./IAutoMovieProductionDeliverableFile";
import { IAutoMovieProductionRenditionDelivery } from "./IAutoMovieProductionRenditionDelivery";

/**
 * One materialized production deliverable claimed by the aggregate render ledger.
 *
 * @evidence contracts/common.md#principled-implementation The row binds an authored deliverable id and kind to byte-exact files and kind-specific scalar facts; final validation derives runtime, frame count and codec from resident media and compares the tuple.
 * @evidence contracts/common.md#clear-and-simple-design Common file ownership stays in one list while nullable scalar facts distinguish video, audio, captions and stills; optional rendition provenance adds only feature visual-source lineage.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Manifest scalar claims cannot substitute for parser facts, and rendition provenance must match current occurrence lanes and selected receipt identities rather than any resident repaint candidate.
 * @evidence contracts/common.md#meaningful-documentation Defines authored id/kind equality, exact files, kind-dependent runtime/frame/codec nulls and selected visual rendition provenance.
 * @author Samchon
 */
export interface IAutoMovieProductionRenderedDeliverable {
  /** Exact id declared by production design. */
  id: string;

  /** Exact kind declared by production design. */
  kind: IAutoMovieProductionDeliverable["kind"];

  /** Byte-exact owned output files. */
  files: IAutoMovieProductionDeliverableFile[];

  /** Timeline duration, or null for a still-only deliverable. */
  runtimeSeconds: number | null;

  /** Rendered frame count, or null when the kind has no video frame clock. */
  frameCount: number | null;

  /** Actual codec name, or null for unencoded text/image artifacts. */
  codec: string | null;

  /**
   * Repaint provenance when this feature was conformed from selected visual renditions. Absent for deterministic delivery and non-feature outputs.
   */
  rendition?: IAutoMovieProductionRenditionDelivery;
}
