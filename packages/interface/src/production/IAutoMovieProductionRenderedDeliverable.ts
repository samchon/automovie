import { IAutoMovieProductionDeliverable } from "./IAutoMovieProductionDeliverable";
import { IAutoMovieProductionDeliverableFile } from "./IAutoMovieProductionDeliverableFile";
import { IAutoMovieProductionRenditionDelivery } from "./IAutoMovieProductionRenditionDelivery";

/** One materialized production deliverable in the aggregate render ledger. */
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
   * Repaint provenance when this feature was conformed from selected visual
   * renditions. Absent for deterministic delivery and non-feature outputs.
   */
  rendition?: IAutoMovieProductionRenditionDelivery;
}
