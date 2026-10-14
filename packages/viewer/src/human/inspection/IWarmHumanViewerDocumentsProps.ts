import type { IHumanViewerCatalogueEntry } from "./IHumanViewerCatalogueEntry.js";
import type { IHumanViewerWarming } from "./IHumanViewerWarming.js";

/**
 * What a warm pass needs from its host: the documents, the cache and capture steps, queue admission and the progress record it updates.
 *
 * @evidence contracts/common.md#principled-implementation A warm pass receives published documents, exact source authority, current-thumbnail lookup and separately queued capture effects with an observable progress record.
 * @evidence contracts/common.md#clear-and-simple-design The host owns cache paths, capture and queue admission; warm iteration owns only missing-document selection and progress updates.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Capture failures remain skipped records with reasons rather than successful completions, and changed source authority withdraws obsolete work.
 * @evidence contracts/common.md#meaningful-documentation Members define source-generation boundaries, cached-document meaning, capture/store behavior, lowest-lane queueing and shared health progress.
 * @evidenceExclude contracts/performance.md#efficient-algorithms These warm-pass bindings select no missing-document scan or priority-queue data structure themselves.
 * @evidence contracts/performance.md#reuse-equivalent-work Current thumbnail-key equivalence is supplied by cached; warm iteration counts matching existing images without rebuilding them.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The host owns GPU tasks and disk writes; the warm pass awaits one capture per document and retains only its bounded-by-document-count progress/failure records.
 *
 * @author Samchon
 */
export interface IWarmHumanViewerDocumentsProps {
  /** Source generation this pass warms. */
  revision: string;

  /** Published documents the pass covers. */
  documents: readonly IHumanViewerCatalogueEntry[];

  /**
   * Return the page's ready-source authority; a different one withdraws this pass before its next item.
   *
   * @evidence contracts/common.md#principled-implementation Warm iteration compares its target revision with actual ready page authority before submitting another document.
   * @evidence contracts/common.md#clear-and-simple-design A current-revision accessor keeps generation observation with the host rather than the warm loop.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Obsolete source work is not kept warming current thumbnails merely because its document ids still exist.
   * @evidence contracts/common.md#meaningful-documentation The member defines ready authority and withdrawal before the next warm item.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This authority query chooses no source-proof or ready-generation algorithm.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Prior ready state is not reusable after a source transition; the accessor must report current authority.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The authority string lends no page or generation hold to the warm pass.
   */
  currentRevision: () => string;

  /**
   * Whether this document's current warm query is already stored or has no supported thumbnail key.
   *
   * @evidence contracts/common.md#principled-implementation The host resolves its standard warm query to a current thumbnail key and answers whether capture is unnecessary.
   * @evidence contracts/common.md#clear-and-simple-design Cache eligibility and file existence stay with the host while iteration filters documents using one boolean.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts An older revision's stale fallback does not count as an equivalent current thumbnail.
   * @evidence contracts/common.md#meaningful-documentation The comment defines stored-current or unsupported-key semantics rather than implying every true result denotes a file.
   * @evidenceExclude contracts/performance.md#efficient-algorithms The eligibility callback selects no path hash or filesystem presence algorithm.
   * @evidence contracts/performance.md#reuse-equivalent-work Only the host's matching source/document/query thumbnail key permits skipping rebuild; unsupported queries need no stored output.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources This query returns a boolean without retaining image bytes or file handles.
   */
  cached: (id: string) => boolean;

  /**
   * Draw one document's standard query and await storage of its supported current thumbnail.
   *
   * @evidence contracts/common.md#principled-implementation The host captures the selected document through the product renderer and writes the PNG under its current supported thumbnail key.
   * @evidence contracts/common.md#clear-and-simple-design Drawing and disk publication remain one awaited host operation while warm iteration handles progress and refusal accounting.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts A capture or write refusal is not counted as a successfully warmed document.
   * @evidence contracts/common.md#meaningful-documentation The member documents standard-query capture and awaited storage where the key is supported.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This warm capture signature chooses no GPU rendering or PNG-write algorithm.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Capturing/writing is an owned effect; the preceding cached query decides whether an equivalent stored result already exists.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The host owns the queued renderer operation and temporary PNG/write buffers until the returned promise settles.
   */
  capture: (id: string) => Promise<void>;

  /**
   * Admit and await one capture in the host queue's lowest lane; do not release the slot before capture settlement.
   *
   * @evidence contracts/common.md#principled-implementation One awaited queue entry per warm document permits higher-priority interactive work between background captures.
   * @evidence contracts/common.md#clear-and-simple-design The host's existing queue owns scheduling; warm iteration submits its capture closure without a parallel queue implementation.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Background warm work cannot bypass shared-page admission or release an active capture slot through a timeout race.
   * @evidence contracts/common.md#meaningful-documentation The comment defines lowest-lane admission and waiting for actual capture settlement.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This queue capability chooses no lane-selection data structure.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Each queued capture changes the shared page and thumbnail storage; equal document labels alone cannot merge its effects.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The queue owns the active slot until the submitted capture promise settles, and the pass submits its next item only afterwards.
   */
  queue: (id: string, capture: () => Promise<void>) => Promise<unknown>;

  /** Progress record `/health` reports, reset by each pass. */
  status: IHumanViewerWarming;
}
