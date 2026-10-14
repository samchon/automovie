import { planHumanViewerThumbnailRevision } from "@automovie/viewer/human/inspection/planHumanViewerThumbnailRevision";

/**
 * Load visible gallery thumbnails with at most two concurrent browser render fetches in the server's bulk lane. Server job scheduling and retirement remain with the server, and a card that leaves view before acquiring a slot waits for its next visit.
 *
 * Each card has a .frame child, a unique picture key and its matching render URL. Cached response bytes retain their actual revision authority; an older picture stays dimmed while replacement waits, and refused rendering reports its cause when no retained picture exists. Cache unavailability falls back to ordinary fetching. Persistent cache entries have no application entry or byte cap and follow browser origin quota; this owner clears live DOM/request resources rather than deleting shared stored pictures.
 *
 * Clear withdraws the current card generation, disconnects observation, rejects queued work, aborts active fetches and revokes displayed object URLs. Later watch calls can acquire a new card generation; old replies never paint it. The page must call clear before replacing its list and when its lifetime ends.
 *
 * @evidence contracts/common.md#principled-implementation Intersection visibility selects real render requests, a reserved-slot semaphore bounds concurrent fetch work, actual response revision controls cache admission, and generation checks withdraw stale painting after list replacement.
 * @evidence contracts/common.md#clear-and-simple-design One loader owns gallery observation, request slots and image URL lifetime, while the server owns actual rendering/priority and the shared revision planner owns response authority semantics.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Cache failure does not invent a picture, response authority is not replaced by request-time source identity, and retained stale output is labelled rather than represented as newly rendered work.
 * @evidence contracts/common.md#meaningful-documentation The comment specifies card metadata, two-request bulk scheduling, actual revision cache admission, stale/error display, persistent cache limitations and reusable clear lifetime.
 * @evidence contracts/performance.md#efficient-algorithms Queue acquisition reserves one of two slots before resuming its waiter. Removing the first array waiter shifts the remaining q entries, so draining a held queue can add quadratic total bookkeeping. Each card reads/stores b response bytes and creates one URL; revision decisions are constant metadata work and card sets scale with observed cards.
 * @evidence contracts/performance.md#reuse-equivalent-work One card starts once per list generation, response bytes are reused only when their stored actual revision matches current source, and stale cached bytes remain visible while replacement is pending. Caller keys must identify their matching request URL; this loader owns no numerical model cache.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Two reserved slots bound browser render fetches, queued waits have no independent count cap beyond observed cards, and clear rejects them, aborts fetch controllers and revokes image URLs. Aborted tasks release slots on settlement; cache IO is not cancellable and stale painting is withdrawn until it settles. Persistent Cache API entries survive clear with browser quota and no application eviction policy, while server job retirement remains server-owned.
 */
export function createHumanViewerThumbnails(props: {
  /** Current server revision; response bytes from another revision remain explicitly stale. */
  revision: () => string;
}): {
  /** Observe this card's frame and key/thumbnail metadata for lazy rendering. */
  watch: (card: HTMLElement) => void;

  /** Withdraw and release current cards before replacement or final page teardown; subsequent watch remains supported. */
  clear: () => void;
} {
  const cache: () => Promise<Cache | null> =
    async (): Promise<Cache | null> => {
      try {
        return await caches.open("human-viewer-thumbnails-v2");
      } catch {
        return null;
      }
    };
  const LIMIT: number = 2;
  let running: number = 0;
  let generation: number = 0;
  const cancelled: Error = new Error(
    "The thumbnail card generation was withdrawn.",
  );
  const scrolled: Error = new Error(
    "The thumbnail card left view before rendering.",
  );
  const waiting: ThumbnailWaiter[] = [];
  const controllers: Set<AbortController> = new Set();
  const urls: Map<HTMLImageElement, string> = new Map();
  const visible: Set<Element> = new Set();
  const started: Set<Element> = new Set();
  const acquire: (ticket: number) => Promise<void> = (
    ticket: number,
  ): Promise<void> => {
    if (ticket !== generation) return Promise.reject(cancelled);
    if (running < LIMIT) {
      ++running;
      return Promise.resolve();
    }
    return new Promise<undefined>(
      (
        resolve: (value: undefined | PromiseLike<undefined>) => void,
        reject: (reason?: unknown) => void,
      ): void => {
        waiting.push({
          ticket,
          resolve: (): void => resolve(undefined),
          reject,
        });
      },
    );
  };
  const release: () => void = (): void => {
    --running;
    while (waiting.length !== 0) {
      const next: ThumbnailWaiter = waiting.shift()!;
      if (next.ticket !== generation) {
        next.reject(cancelled);
        continue;
      }
      ++running;
      next.resolve();
      break;
    }
  };
  const once: <Result>(
    ticket: number,
    task: () => Promise<Result>,
  ) => Promise<Result> = async <Result>(
    ticket: number,
    task: () => Promise<Result>,
  ): Promise<Result> => {
    await acquire(ticket);
    try {
      if (ticket !== generation) throw cancelled;
      return await task();
    } finally {
      release();
    }
  };
  const display: (image: HTMLImageElement, bytes: Blob) => void = (
    image: HTMLImageElement,
    bytes: Blob,
  ): void => {
    const next: string = URL.createObjectURL(bytes);
    const previous: string | undefined = urls.get(image);
    urls.set(image, next);
    image.src = next;
    if (previous !== undefined) URL.revokeObjectURL(previous);
  };
  async function paint(
    card: HTMLElement,
    image: HTMLImageElement,
    frame: HTMLElement,
    key: string,
    url: string,
    ticket: number,
  ): Promise<void> {
    let kept: Response | undefined;
    try {
      let store: Cache | null = await cache();
      if (ticket !== generation) return;
      const name: string = "/thumbnail/" + encodeURIComponent(key);
      try {
        kept = await store?.match(name);
      } catch {
        store = null;
      }
      if (ticket !== generation) return;
      if (kept !== undefined) {
        const bytes: Blob = await kept.clone().blob();
        if (ticket !== generation) return;
        display(image, bytes);
        if (kept.headers.get("X-Revision") === props.revision()) return;
        image.classList.add("stale");
      }
      const result: ThumbnailReply = await once(
        ticket,
        async (): Promise<ThumbnailReply> => {
          if (!visible.has(card)) throw scrolled;
          const controller: AbortController = new AbortController();
          controllers.add(controller);
          try {
            const response: Response = await fetch(url + "&lane=bulk", {
              signal: controller.signal,
            });
            if (!response.ok) {
              const failure: { error?: string } = (await response.json()) as {
                error?: string;
              };
              throw new Error(failure.error ?? response.statusText);
            }
            const bytes: Blob = await response.blob();
            return {
              bytes,
              authority: planHumanViewerThumbnailRevision(
                props.revision(),
                response.headers.get("X-Human-Revision"),
                response.headers.get("X-Human-Stale") === "true",
              ),
            };
          } finally {
            controllers.delete(controller);
          }
        },
      );
      if (ticket !== generation) return;
      if (result.authority.cache) {
        try {
          await store?.put(
            name,
            new Response(result.bytes, {
              headers: {
                "Content-Type": "image/png",
                "X-Revision": result.authority.revision!,
              },
            }),
          );
        } catch {
          store = null;
        }
      }
      if (ticket !== generation) return;
      display(image, result.bytes);
      image.classList.toggle("stale", result.authority.stale);
    } catch (failure) {
      if (ticket !== generation || failure === cancelled) return;
      if (failure === scrolled) {
        started.delete(card);
        if (kept === undefined) frame.textContent = "Not drawn yet";
      } else if (kept === undefined)
        frame.textContent =
          failure instanceof Error ? failure.message : String(failure);
    }
  }
  const seen: IntersectionObserver = new IntersectionObserver(
    (observed: IntersectionObserverEntry[]): void => {
      for (const item of observed) {
        if (!item.isIntersecting) {
          visible.delete(item.target);
          continue;
        }
        visible.add(item.target);
        const card: HTMLElement = item.target as HTMLElement;
        if (started.has(card)) continue;
        started.add(card);
        const frame: HTMLElement = card.querySelector<HTMLElement>(".frame")!;
        const image: HTMLImageElement = document.createElement("img");
        image.alt = "";
        frame.replaceChildren(image);
        void paint(
          card,
          image,
          frame,
          card.dataset.key!,
          card.dataset.thumbnail!,
          generation,
        );
      }
    },
    { rootMargin: "0px" },
  );
  return {
    watch: (card: HTMLElement): void => seen.observe(card),
    clear: (): void => {
      ++generation;
      seen.disconnect();
      visible.clear();
      started.clear();
      for (const waiter of waiting.splice(0)) waiter.reject(cancelled);
      for (const controller of controllers) controller.abort();
      controllers.clear();
      for (const url of urls.values()) URL.revokeObjectURL(url);
      urls.clear();
    },
  };
}

type ThumbnailWaiter = {
  ticket: number;
  resolve: () => void;
  reject: (reason?: unknown) => void;
};
type ThumbnailReply = {
  bytes: Blob;
  authority: ReturnType<typeof planHumanViewerThumbnailRevision>;
};
