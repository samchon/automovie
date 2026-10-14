import type { ServerResponse } from "node:http";

import type { HumanViewerWork } from "./HumanViewerWork.js";
import type { IHumanViewerHeapUsage } from "./IHumanViewerHeapUsage.js";
import type { IHumanViewerWorkerHeap } from "./IHumanViewerWorkerHeap.js";

/**
 * What the `/heap` route reads and answers with.
 *
 * @evidence contracts/common.md#principled-implementation Heap reporting distinguishes collected page and browser-worker isolate heaps from current work metadata and ready source authority.
 * @evidence contracts/common.md#clear-and-simple-design Borrowed readers keep browser sampling with residency while the heap route only assembles one HTTP result.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Heap readings do not imply physical GPU allocation or include Node numerical-process heaps as renderer-isolate measurements.
 * @evidence contracts/common.md#meaningful-documentation Members define collection-before-read behavior, current progress, ready generation and status 503 when readings fail.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The heap-route input shape implements no garbage collection, target enumeration or V8 measurement algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Heap measurements observe changing isolate state and cannot be cached solely under source-generation identity.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Sampling callbacks are borrowed; residency and worker-heap readers own their CDP sessions and detach them independently.
 *
 * @author Samchon
 */
export interface IServeHumanViewerHeapProps {
  /** The response, given status 503 when no reading can be taken. */
  response: ServerResponse;

  /**
   * End the heap response with collected readings or a status-503 failure description.
   *
   * @evidence contracts/common.md#principled-implementation Heap output serializes independently collected page/worker measurements together with current work and revision metadata.
   * @evidence contracts/common.md#clear-and-simple-design The route assembles measurement results while the server-supplied writer owns response serialization.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Failed measurements produce a cause rather than fabricated zero heap usage.
   * @evidence contracts/common.md#meaningful-documentation The comment identifies successful heap results and the status-503 failure response.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This response-writer capability chooses no heap aggregation or JSON encoder implementation.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Heap values are time-specific observations and response writing is a distinct client effect.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The writer borrows HTTP transport and owns no CDP session or measurement task.
   */
  json: (value: unknown) => void;

  /**
   * Collect the resident page isolate's garbage, then read that isolate's heap.
   *
   * @evidence contracts/common.md#principled-implementation Post-collection sampling awaits page garbage collection before reporting page-isolate heap usage.
   * @evidence contracts/common.md#clear-and-simple-design The page reader remains with residency and is invoked independently from worker-isolate sampling.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts This measurement does not substitute retained model arrays or worker heaps for the page's actual heap.
   * @evidence contracts/common.md#meaningful-documentation The member documents page-isolate scope and collection-before-read ordering.
   * @evidenceExclude contracts/performance.md#efficient-algorithms The supplied reader signature chooses no V8 garbage collection or accounting algorithm.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Collection is effectful and current usage changes; a previous reading cannot stand in for this sample.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The reader borrows the resident's page session, whose lifetime belongs to residency rather than the heap route.
   */
  readLiveHeap: () => Promise<IHumanViewerHeapUsage>;

  /**
   * Collect and read each currently observable browser worker isolate; omit a worker that vanishes during sampling.
   *
   * @evidence contracts/common.md#principled-implementation Browser-worker heaps are sampled through their own CDP target sessions after each worker's garbage collection.
   * @evidence contracts/common.md#clear-and-simple-design One reader returns per-worker URL/usage records while keeping target attach/message/detach handling outside the HTTP route.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Missing workers are omitted instead of receiving fabricated readings, and Node numerical-process heaps are outside this renderer report.
   * @evidence contracts/common.md#meaningful-documentation The comment defines browser-worker scope and omission when a worker disappears mid-sample.
   * @evidenceExclude contracts/performance.md#efficient-algorithms The callback type prescribes no target enumeration or protocol-request matching data structure.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Worker identity and heap state may change between samples; equal script URLs do not make readings equivalent.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The worker-heap owner attaches per-target sessions, removes listeners and detaches its browser-root session when the reading completes.
   */
  readWorkerHeaps: () => Promise<IHumanViewerWorkerHeap[]>;

  /**
   * Return the latest decoded page-progress record, or null before one exists.
   *
   * @evidence contracts/common.md#principled-implementation Current work metadata supplements measured heaps with resident count/array bytes from the page's actual progress protocol.
   * @evidence contracts/common.md#clear-and-simple-design The route reads an existing decoded record instead of querying the busy renderer for duplicate progress state.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Progress bytes remain retained-array accounting and are not promoted into a physical GPU measurement.
   * @evidence contracts/common.md#meaningful-documentation The member documents the latest decoded record and null before any progress message.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This metadata accessor chooses no console decoding or resident byte-counting algorithm.
   * @evidence contracts/performance.md#reuse-equivalent-work Residency shares its latest protocol record until a newer progress notification replaces it; heap readings remain independent.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The accessor lends one status record without retaining the residents it describes.
   */
  work: () => HumanViewerWork | null;

  /**
   * Return the page's ready-generation authority, empty when no generation can draw.
   *
   * @evidence contracts/common.md#principled-implementation The heap response reports current page authority separately from measurements, which are observations taken during the awaited sampling.
   * @evidence contracts/common.md#clear-and-simple-design Readiness is borrowed from residency rather than inferred from whether CDP happened to answer a heap query.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts A successful heap sample does not certify drawable source readiness or the desired inventory revision.
   * @evidence contracts/common.md#meaningful-documentation The member defines ready-generation authority and empty no-drawable state.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This ready-authority query implements no source-proof or generation preparation algorithm.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Ready-source equality does not make changing page/worker heaps interchangeable measurements.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Only a source-authority string is borrowed, leaving browser generation ownership with residency.
   */
  readyRevision: () => string;
}
