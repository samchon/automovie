import { IAutoMovieProductionDeliverableFile } from "./IAutoMovieProductionDeliverableFile";
import { IAutoMovieProductionMediaProbe } from "./IAutoMovieProductionMediaProbe";

/**
 * One file record independently derived by the renderer-owned receipt gate.
 *
 * @evidence contracts/common.md#principled-implementation Combines inherited path and exact byte identity with the exclusively owning deliverable and format-specific facts parsed from the same supplied bytes during terminal publication.
 * @evidence contracts/common.md#clear-and-simple-design Reuses the deliverable-file contract and adds only ownership and observed media facts, allowing final validation to compare a claim and its independently derived receipt row.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A file path cannot be claimed by multiple deliverables and parser facts cannot be copied from manifest scalar claims; duplicate ownership and malformed bytes refuse.
 * @evidence contracts/common.md#meaningful-documentation Defines exclusive deliverable identity and parser-derived facts while inherited documentation supplies relative path, digest, size and sidecar meaning.
 * @author Samchon
 */
export interface IAutoMovieProductionRenderReceiptFile extends IAutoMovieProductionDeliverableFile {
  /** Deliverable that exclusively owns this path. */
  deliverable: string;

  /** Parser-derived media facts. */
  probe: IAutoMovieProductionMediaProbe;
}
