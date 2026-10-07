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
 * Before a capture it also makes room for the capture itself: a build and
 * its first draw hold transient copies far above the resident they leave
 * (a person on pid 13952 took the page from 296 MB to 1560 MB while drawing),
 * and a capture-only trim cannot see them coming. `before` releases page
 * residents until the sum plus the room the capture's domain needs fits the
 * limit; `after` measures the capture's own transient from the page heap
 * samples taken during it and keeps the largest per domain, so the reserved
 * room follows what the documents actually take.
 *
 * @evidence contracts/common.md#principled-implementation Eviction follows the isolates' own heap accounting of the quantity that ran out, not an estimate of another one.
 * @evidence contracts/common.md#clear-and-simple-design One owner reads, decides and asks the page to release; the page owns its residents.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No document-specific sizes; the limit is checked against measured heaps.
 * @evidence contracts/common.md#meaningful-documentation States why the cage is the limit, why the budget could not see it and the order of reading, collecting and releasing.
 */
export function createHumanViewerResidentTrim(props: ICreateHumanViewerResidentTrimProps) {
  if (!(props.target < props.limit)) throw new Error("A trim target must be below its limit");
  let last: IHumanViewerResidentTrimReading | null = null;
  /** The room each domain needs above its starting heap, learned from its captures. */
  const room = { ...props.seeds };
  /** The page heap when the current capture started. */
  let started = 0;
  /** Release page residents while the sum plus `extra` exceeds `bound`; returns how many were released. */
  const release = async (extra: number, bound: number): Promise<IHumanViewerResidentRelease> => {
    let reading = await sum(true);
    let evicted = 0;
    while (reading.page + reading.workers + extra > bound && await props.evict()) {
      ++evicted;
      reading = { ...reading, page: (await props.page(true)).usedSize };
    }
    return { evicted, ...reading };
  };
  const sum = async (collect: boolean): Promise<IHumanViewerResidentHeapSum> => {
    const [page, workers] = await Promise.all([props.page(collect), props.workers(collect)]);
    return { page: page.usedSize, workers: workers.reduce((total, worker) => total + worker.usage.usedSize, 0) };
  };
  return {
    /** Make room for a capture of this domain before it builds and draws. */
    before: async (domain: "face" | "body" | "person"): Promise<void> => {
      const reading = await sum(false);
      started = reading.page;
      if (reading.page + reading.workers + room[domain] > props.limit) {
        const made = await release(room[domain], props.limit);
        started = made.page;
        // The cheap reading includes garbage; a collection alone usually
        // makes the room, which is not worth a line.
        const short = made.page + made.workers + room[domain] > props.limit;
        if (made.evicted !== 0 || short)
          console.log(`RESIDENT ROOM ${new Date().toISOString()} ${domain} needs ${Math.round(room[domain] / 1e6)} MB; released ` +
            `${made.evicted}; page ${Math.round(made.page / 1e6)} MB + workers ${Math.round(made.workers / 1e6)} MB, limit ${Math.round(props.limit / 1e6)} MB` +
            (short ? " (the worker's runtimes leave less room than the capture needs)" : ""));
      }
      props.mark();
    },

    /** Learn the capture's transient for its domain. */
    learn: (domain: "face" | "body" | "person"): void => {
      const peak = props.windowPeak();
      if (peak !== null && peak - started > room[domain]) {
        room[domain] = peak - started;
        console.log(`RESIDENT ROOM ${new Date().toISOString()} learned: a ${domain} capture took ${Math.round(room[domain] / 1e6)} MB above its start`);
      }
    },

    /** The room each domain is known to need. */
    room: (): Record<"face" | "body" | "person", number> => ({ ...room }),

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
        limit: props.limit, evicted, room: { ...room } };
      if (evicted !== 0 || reading.page + reading.workers > props.limit)
        console.log(`RESIDENT TRIM ${last.at} released ${evicted}; page ${Math.round(reading.page / 1e6)} MB + workers ` +
          `${Math.round(reading.workers / 1e6)} MB, limit ${Math.round(props.limit / 1e6)} MB`);
    },

    /** The last decision, or null before the first capture. */
    status: (): IHumanViewerResidentTrimReading | null => last,
  };
}

/** Named local transport for createHumanViewerResidentTrim; member meaning remains with its calculation owner. */
interface IHumanViewerResidentRelease { evicted: number; page: number; workers: number }

/** Named local transport for createHumanViewerResidentTrim; member meaning remains with its calculation owner. */
interface IHumanViewerResidentHeapSum { page: number; workers: number }
