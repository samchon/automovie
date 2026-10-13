import { AutoMovieContentDigest } from "./AutoMovieContentDigest";
import { IAutoMovieProductionRenderReceiptFile } from "./IAutoMovieProductionRenderReceiptFile";

/** Renderer-owned aggregate receipt bound to current output bytes. */
export interface IAutoMovieProductionRenderReceipt {
  /** Receipt format. */
  version: 4;

  /** Exact digest of the active production's tracked render manifest. */
  manifestDigest: AutoMovieContentDigest;

  /** Exact recomputed publication identity carried by the manifest. */
  publicationFingerprint: AutoMovieContentDigest;

  /** Exact byte and media probes in canonical path order. */
  files: IAutoMovieProductionRenderReceiptFile[];
}
