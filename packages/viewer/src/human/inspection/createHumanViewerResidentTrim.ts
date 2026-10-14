import type { ICreateHumanViewerResidentTrimProps } from "./ICreateHumanViewerResidentTrimProps.js";
import type { IHumanViewerResidentTrimReading } from "./IHumanViewerResidentTrimReading.js";

/**
 * Measure and reduce the renderer's JS heap pressure by releasing unused page residents.
 *
 * The page resident budget counts typed-array bytes. This owner instead sums the page and worker usedSize readings, which include JavaScript objects and may include garbage before collection. Neither quantity is a complete process-memory reading or a guarantee that a later allocation will fit.
 *
 * Before a capture, the sum plus seeded or previously observed per-domain headroom is compared with the supplied limit. When over it, collection precedes eviction; page usage is reread after each released resident. Learning retains the largest observed page-heap increase for that domain. After capture, trim collects and evicts toward the lower target.
 *
 * Eviction stops when the page owner has no releasable resident, preserving its shown resident. Worker runtimes remain owned by their workers and are counted without being released here. Insufficient headroom is reported and capture continues, so this is measured, best-effort retention management rather than hard production-job admission or pause.
 *
 * @evidence contracts/common.md#principled-implementation Actual page/worker heap readings and domain headroom determine collection and unused-page-resident eviction; learning records observed page transient growth.
 * @evidence contracts/common.md#clear-and-simple-design Shared sum/release helpers feed before, learn and trim while fixed domain headroom remains separate from the last decision record.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Heap readings are not relabeled complete process memory or allocation guarantees, the shown resident is preserved by the eviction owner and insufficient headroom remains an explicit best-effort decision.
 * @evidence contracts/common.md#meaningful-documentation The comment identifies heap versus array-byte accounting, observation learning, worker ownership and continuing capture after insufficient room.
 * @evidence contracts/performance.md#efficient-algorithms Each heap sum traverses worker readings once; eviction rereads page usage per actually released resident and stops when the bound fits or no unused resident remains.
 * @evidence contracts/performance.md#reuse-equivalent-work Each domain reuses its largest observed transient as headroom rather than treating another domain's capture as equivalent; heap pressure itself is reread before decisions.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Three headroom numbers and one last decision are retained; actual page eviction is awaited, worker runtimes are counted but borrowed and neither successful trim nor sampling proves garbage collection or a future fit.
 */
export function createHumanViewerResidentTrim(
  props: ICreateHumanViewerResidentTrimProps,
): {
  before: (domain: "face" | "body" | "person") => Promise<void>;
  learn: (domain: "face" | "body" | "person") => void;
  room: () => Record<"face" | "body" | "person", number>;
  trim: () => Promise<void>;
  status: () => IHumanViewerResidentTrimReading | null;
} {
  if (!(props.target < props.limit))
    throw new Error("A trim target must be below its limit");
  let last: IHumanViewerResidentTrimReading | null = null;
  /** Seeded or largest sampled growth above starting page heap, used as a policy headroom estimate. */
  const room: Record<"face" | "body" | "person", number> = { ...props.seeds };
  /** The page heap when the current capture started. */
  let started: number = 0;
  /** Release page residents while the sum plus `extra` exceeds `bound`; returns how many were released. */
  const release: (extra: number, bound: number) => Promise<IHumanViewerResidentRelease> = async (
    extra: number,
    bound: number,
  ): Promise<IHumanViewerResidentRelease> => {
    let reading: IHumanViewerResidentHeapSum = await sum(true);
    let evicted: number = 0;
    while (
      reading.page + reading.workers + extra > bound &&
      (await props.evict())
    ) {
      ++evicted;
      reading = { ...reading, page: (await props.page(true)).usedSize };
    }
    return { evicted, ...reading };
  };
  const sum: (collect: boolean) => Promise<IHumanViewerResidentHeapSum> = async (
    collect: boolean,
  ): Promise<IHumanViewerResidentHeapSum> => {
    const [page, workers]: [Awaited<ReturnType<ICreateHumanViewerResidentTrimProps["page"]>>, Awaited<ReturnType<ICreateHumanViewerResidentTrimProps["workers"]>>] = await Promise.all([
      props.page(collect),
      props.workers(collect),
    ]);
    return {
      page: page.usedSize,
      workers: workers.reduce(
        (total: number, worker: Awaited<ReturnType<ICreateHumanViewerResidentTrimProps["workers"]>>[number]): number => total + worker.usage.usedSize,
        0,
      ),
    };
  };
  return {
    /** Make room for a capture of this domain before it builds and draws. */
    before: async (domain: "face" | "body" | "person"): Promise<void> => {
      const reading: IHumanViewerResidentHeapSum = await sum(false);
      started = reading.page;
      if (reading.page + reading.workers + room[domain] > props.limit) {
        const made: IHumanViewerResidentRelease = await release(room[domain], props.limit);
        started = made.page;
        // The cheap reading includes garbage; a collection alone usually
        // makes the room, which is not worth a line.
        const short: boolean = made.page + made.workers + room[domain] > props.limit;
        if (made.evicted !== 0 || short)
          console.log(
            `RESIDENT ROOM ${new Date().toISOString()} ${domain} estimated headroom ${Math.round(room[domain] / 1e6)} MB; released ` +
              `${made.evicted}; page ${Math.round(made.page / 1e6)} MB + workers ${Math.round(made.workers / 1e6)} MB, limit ${Math.round(props.limit / 1e6)} MB` +
              (short
                ? " (the measured heaps leave less than the estimated headroom)"
                : ""),
          );
      }
      props.mark();
    },

    /** Learn the capture's transient for its domain. */
    learn: (domain: "face" | "body" | "person"): void => {
      const peak: number | null = props.windowPeak();
      if (peak !== null && peak - started > room[domain]) {
        room[domain] = peak - started;
        console.log(
          `RESIDENT ROOM ${new Date().toISOString()} learned: a ${domain} capture took ${Math.round(room[domain] / 1e6)} MB above its start`,
        );
      }
    },

    /** The current seeded or sampled headroom estimate, not a guarantee of every future capture peak. */
    room: (): Record<"face" | "body" | "person", number> => ({ ...room }),

    /** Read the heaps and release page residents while over the limit. */
    trim: async (): Promise<void> => {
      let reading: IHumanViewerResidentHeapSum = await sum(false);
      let evicted: number = 0;
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
