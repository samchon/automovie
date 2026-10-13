import type { ICreateHumanViewerResidentTrimProps } from "./ICreateHumanViewerResidentTrimProps.js";
import type { IHumanViewerResidentTrimReading } from "./IHumanViewerResidentTrimReading.js";

/**
 * Measure and reduce the renderer's JS heap pressure by releasing unused page residents.
 *
 * The page resident budget counts typed-array bytes. This owner instead sums
 * the page and worker usedSize readings, which include JavaScript objects
 * and may include garbage before collection. Neither quantity is a complete
 * process-memory reading or a guarantee that a later allocation will fit.
 *
 * Before a capture, the sum plus seeded or previously observed per-domain
 * headroom is compared with the supplied limit. When over it, collection
 * precedes eviction; page usage is reread after each released resident.
 * Learning retains the largest observed page-heap increase for that domain.
 * After capture, trim collects and evicts toward the lower target.
 *
 * Eviction stops when the page owner has no releasable resident, preserving
 * its shown resident. Worker runtimes remain owned by their workers and are
 * counted without being released here. Insufficient headroom is reported
 * and capture continues, so this is measured, best-effort retention
 * management rather than hard production-job admission or pause.
 */
export function createHumanViewerResidentTrim(
  props: ICreateHumanViewerResidentTrimProps,
) {
  if (!(props.target < props.limit))
    throw new Error("A trim target must be below its limit");
  let last: IHumanViewerResidentTrimReading | null = null;
  /** The room each domain needs above its starting heap, learned from its captures. */
  const room = { ...props.seeds };
  /** The page heap when the current capture started. */
  let started = 0;
  /** Release page residents while the sum plus `extra` exceeds `bound`; returns how many were released. */
  const release = async (
    extra: number,
    bound: number,
  ): Promise<IHumanViewerResidentRelease> => {
    let reading = await sum(true);
    let evicted = 0;
    while (
      reading.page + reading.workers + extra > bound &&
      (await props.evict())
    ) {
      ++evicted;
      reading = { ...reading, page: (await props.page(true)).usedSize };
    }
    return { evicted, ...reading };
  };
  const sum = async (
    collect: boolean,
  ): Promise<IHumanViewerResidentHeapSum> => {
    const [page, workers] = await Promise.all([
      props.page(collect),
      props.workers(collect),
    ]);
    return {
      page: page.usedSize,
      workers: workers.reduce(
        (total, worker) => total + worker.usage.usedSize,
        0,
      ),
    };
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
          console.log(
            `RESIDENT ROOM ${new Date().toISOString()} ${domain} needs ${Math.round(room[domain] / 1e6)} MB; released ` +
              `${made.evicted}; page ${Math.round(made.page / 1e6)} MB + workers ${Math.round(made.workers / 1e6)} MB, limit ${Math.round(props.limit / 1e6)} MB` +
              (short
                ? " (the worker's runtimes leave less room than the capture needs)"
                : ""),
          );
      }
      props.mark();
    },

    /** Learn the capture's transient for its domain. */
    learn: (domain: "face" | "body" | "person"): void => {
      const peak = props.windowPeak();
      if (peak !== null && peak - started > room[domain]) {
        room[domain] = peak - started;
        console.log(
          `RESIDENT ROOM ${new Date().toISOString()} learned: a ${domain} capture took ${Math.round(room[domain] / 1e6)} MB above its start`,
        );
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
        while (
          reading.page + reading.workers > props.target &&
          (await props.evict())
        ) {
          ++evicted;
          reading = { ...reading, page: (await props.page(true)).usedSize };
        }
      }
      last = {
        at: new Date().toISOString(),
        page: reading.page,
        workers: reading.workers,
        limit: props.limit,
        evicted,
        room: { ...room },
      };
      if (evicted !== 0 || reading.page + reading.workers > props.limit)
        console.log(
          `RESIDENT TRIM ${last.at} released ${evicted}; page ${Math.round(reading.page / 1e6)} MB + workers ` +
            `${Math.round(reading.workers / 1e6)} MB, limit ${Math.round(props.limit / 1e6)} MB`,
        );
    },

    /** The last decision, or null before the first capture. */
    status: (): IHumanViewerResidentTrimReading | null => last,
  };
}

/**
 * Named local transport for createHumanViewerResidentTrim; member meaning remains with its calculation owner.
 *
 * @author Samchon
 */
interface IHumanViewerResidentRelease {
  evicted: number;
  page: number;
  workers: number;
}

/**
 * Named local transport for createHumanViewerResidentTrim; member meaning remains with its calculation owner.
 *
 * @author Samchon
 */
interface IHumanViewerResidentHeapSum {
  page: number;
  workers: number;
}
