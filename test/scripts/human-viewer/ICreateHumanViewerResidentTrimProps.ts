import type { IHumanViewerHeapUsage } from "./IHumanViewerHeapUsage";
import type { IHumanViewerWorkerHeap } from "./IHumanViewerWorkerHeap";

/**
 * What the resident trim reads and acts through.
 *
 * @evidence contracts/common.md#meaningful-documentation Names every member.
 * @author Samchon
 */
export interface ICreateHumanViewerResidentTrimProps {
  /** Bytes of JS heap the renderer's isolates together may use before page residents are released. */
  limit: number;

  /** Bytes a trim releases down to, below `limit`, so the next captures find room without collecting again. */
  target: number;

  /** Read the page isolate's heap, after a full collection when `collect` is set. */
  page: (collect: boolean) => Promise<IHumanViewerHeapUsage>;

  /** Read every worker isolate's heap, after a full collection when `collect` is set. */
  workers: (collect: boolean) => Promise<IHumanViewerWorkerHeap[]>;

  /** Ask the page to release its least recently used resident other than the one on screen; false when none is left. */
  evict: () => Promise<boolean>;
}
