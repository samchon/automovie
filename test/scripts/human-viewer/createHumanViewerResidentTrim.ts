import type { ICreateHumanViewerResidentTrimProps } from "./ICreateHumanViewerResidentTrimProps";
import type { IHumanViewerResidentTrimReading } from "./IHumanViewerResidentTrimReading";

/**
 * Keep the renderer's JS heap under its limit by releasing page residents.
 *
 * The page and its numerical worker are separate V8 isolates in one renderer
 * process, and every isolate of that process allocates from one 4 GiB pointer
 * cage; the resident page died twice of an allocation failure in that cage.
 * The page's own resident budget counts typed-array bytes, which live outside
 * the cage, so it cannot keep the cage from filling (a person resident counts
 * 9 MB but adds 25–27 MB of JS heap). This trim measures instead: after each
 * capture it reads the page and worker heaps (cheap readings, including
 * garbage), and only when their sum exceeds `limit` does it collect garbage,
 * read again, and release the least recently used page resident until the
 * sum is at most `target` or only the shown resident is left. Releasing down
 * to a target below the limit keeps the following captures from each paying
 * a full collection (measured 0.4–0.8 s) for a sum that sits at the limit. The worker's heap is its
 * loaded runtimes, which the page cannot release; it is counted so the page
 * gives up the room the worker needs.
 *
 * @evidence contracts/common.md#principled-implementation Eviction follows the isolates' own heap accounting of the quantity that ran out, not an estimate of another one.
 * @evidence contracts/common.md#clear-and-simple-design One owner reads, decides and asks the page to release; the page owns its residents.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No document-specific sizes; the limit is checked against measured heaps.
 * @evidence contracts/common.md#meaningful-documentation States why the cage is the limit, why the budget could not see it and the order of reading, collecting and releasing.
 */
export function createHumanViewerResidentTrim(props: ICreateHumanViewerResidentTrimProps) {
  if (!(props.target < props.limit)) throw new Error("A trim target must be below its limit");
  let last: IHumanViewerResidentTrimReading | null = null;
  const sum = async (collect: boolean): Promise<{ page: number; workers: number }> => {
    const [page, workers] = await Promise.all([props.page(collect), props.workers(collect)]);
    return { page: page.usedSize, workers: workers.reduce((total, worker) => total + worker.usage.usedSize, 0) };
  };
  return {
    /** Read the heaps and release page residents while over the limit. */
    trim: async (): Promise<void> => {
      let reading = await sum(false);
      let evicted = 0;
      if (reading.page + reading.workers > props.limit) {
        reading = await sum(true);
        while (reading.page + reading.workers > props.target && await props.evict()) {
          ++evicted;
          reading = { ...reading, page: (await props.page(true)).usedSize };
        }
      }
      last = { at: new Date().toISOString(), page: reading.page, workers: reading.workers,
        limit: props.limit, evicted };
      if (evicted !== 0 || reading.page + reading.workers > props.limit)
        console.log(`RESIDENT TRIM ${last.at} released ${evicted}; page ${Math.round(reading.page / 1e6)} MB + workers ` +
          `${Math.round(reading.workers / 1e6)} MB, limit ${Math.round(props.limit / 1e6)} MB`);
    },

    /** The last decision, or null before the first capture. */
    status: (): IHumanViewerResidentTrimReading | null => last,
  };
}
