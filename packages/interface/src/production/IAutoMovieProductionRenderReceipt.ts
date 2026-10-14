import { IAutoMovieProductionRenderReceiptFile } from "./IAutoMovieProductionRenderReceiptFile";

/**
 * Renderer-owned aggregate receipt derived from the exact published manifest and output bytes.
 *
 * @evidence contracts/common.md#principled-implementation Terminal publication digests serialized manifest bytes, recomputes publication identity and probes every supplied deliverable file, then records those facts in canonical path order alongside the committed ledger.
 * @evidence contracts/common.md#clear-and-simple-design Separates renderer-derived byte and media evidence from the manifest's delivery claims while linking them by manifest and publication digests.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Supplied paths must exactly equal exclusively claimed paths; missing, duplicate, extra or byte-mismatched files refuse before receipt publication, and final readers reopen the resident output.
 * @evidence contracts/common.md#meaningful-documentation Defines receipt epoch, exact tracked-manifest digest, recomputed publication fingerprint and canonical per-file probe population.
 * @author Samchon
 */
export interface IAutoMovieProductionRenderReceipt {
  /** Receipt format. */
  version: 4;

  /** Exact digest of the active production's tracked render manifest. */
  manifestDigest: string;

  /** Exact recomputed publication identity carried by the manifest. */
  publicationFingerprint: string;

  /** Exact byte and media probes in canonical path order. */
  files: IAutoMovieProductionRenderReceiptFile[];
}
