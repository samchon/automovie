import type { IHumanViewerCatalogueEntry } from "./IHumanViewerCatalogueEntry";
import type { IHumanViewerWarming } from "./IHumanViewerWarming";

/**
 * What a warm pass needs from its host: the documents, the cache and capture
 * steps, queue admission and the progress record it updates.
 *
 * @evidence contracts/common.md#clear-and-simple-design The host supplies persistence, capture and admission; the pass owns only ordering and progress.
 * @evidence contracts/common.md#meaningful-documentation Names every member and its owner.
 * @author Samchon
 */
export interface IWarmHumanViewerDocumentsProps {
  /** Source generation this pass warms. */
  revision: string;

  /** Published documents the pass covers. */
  documents: readonly IHumanViewerCatalogueEntry[];

  /** The generation the page can draw now; a different one ends the pass. */
  currentRevision: () => string;

  /** Whether a document already has its thumbnail. */
  cached: (id: string) => boolean;

  /** Draw one document and store its thumbnail. */
  capture: (id: string) => Promise<void>;

  /** Admit one capture to the host queue's lowest lane. */
  queue: (id: string, capture: () => Promise<void>) => Promise<unknown>;

  /** Progress record `/health` reports, reset by each pass. */
  status: IHumanViewerWarming;
}
