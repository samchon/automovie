/**
 * Lazy thumbnails for the viewer's gallery pages. Only cards on screen are
 * requested, at most two at a time and in the server's lowest lane, so
 * browsing never floods the GPU queue that other sessions share and a person
 * using the controls is always served first. A card that scrolls away before
 * its turn is skipped. The server draws the pictures ahead of time and keeps
 * them on disk, so most requests are file reads. A picture is kept in the
 * browser's cache under the source revision that drew it; after a source
 * change the older picture stays, dimmed, until the new one arrives, and a
 * card whose render is refused shows the server's reason. Nothing leaves the
 * browser: the cache holds only what the loopback server rendered.
 *
 * Each card is an element with a `.frame` child; `key` names its picture in
 * the cache and `url` is the `/render` request that draws it.
 */
import { planHumanViewerThumbnailRevision } from "./planHumanViewerThumbnailRevision";

export function createHumanViewerThumbnails(props: {
  /** The source revision the server reports now; a picture from another is stale. */
  revision: () => string;
}) {
  const cache = async (): Promise<Cache | null> => {
    try {
      // The previous cache schema labeled responses with request-time source.
      return await caches.open("human-viewer-thumbnails-v2");
    } catch {
      return null;
    }
  };
  const LIMIT = 2;
  let running = 0;
  const waiting: (() => void)[] = [];
  const once = async <T>(task: () => Promise<T>): Promise<T> => {
    if (running >= LIMIT)
      await new Promise<undefined>((resolve) => {
        waiting.push(() => resolve(undefined));
      });
    ++running;
    try {
      return await task();
    } finally {
      --running;
      waiting.shift()?.();
    }
  };
  const visible = new Set<Element>();
  const started = new Set<Element>();
  async function paint(
    card: HTMLElement,
    image: HTMLImageElement,
    frame: HTMLElement,
    key: string,
    url: string,
  ): Promise<void> {
    const store = await cache();
    const name = "/thumbnail/" + encodeURIComponent(key);
    const kept = await store?.match(name);
    if (kept !== undefined) {
      image.src = URL.createObjectURL(await kept.clone().blob());
      if (kept.headers.get("X-Revision") === props.revision()) return;
      image.classList.add("stale");
    }
    try {
      const bytes = await once(async () => {
        // A card that scrolled away while it waited is left for its next visit.
        if (!visible.has(card)) throw new Error("scrolled away");
        const response = await fetch(url + "&lane=bulk");
        if (!response.ok)
          throw new Error(
            ((await response.json()) as { error?: string }).error ??
              response.statusText,
          );
        return { bytes: await response.blob(), authority: planHumanViewerThumbnailRevision(
          props.revision(), response.headers.get("X-Human-Revision"),
          response.headers.get("X-Human-Stale") === "true",
        ) };
      });
      if (bytes.authority.cache) await store?.put(
        name,
        new Response(bytes.bytes, {
          headers: {
            "Content-Type": "image/png",
            "X-Revision": bytes.authority.revision!,
          },
        }),
      );
      image.src = URL.createObjectURL(bytes.bytes);
      image.classList.toggle("stale", bytes.authority.stale);
    } catch (failure) {
      if (failure instanceof Error && failure.message === "scrolled away") {
        started.delete(card);
        if (kept === undefined) frame.textContent = "Not drawn yet";
        return;
      }
      if (kept === undefined)
        frame.textContent =
          failure instanceof Error ? failure.message : String(failure);
    }
  }
  const seen = new IntersectionObserver(
    (observed) => {
      for (const item of observed) {
        if (!item.isIntersecting) {
          visible.delete(item.target);
          continue;
        }
        visible.add(item.target);
        const card = item.target as HTMLElement;
        if (started.has(card)) continue;
        started.add(card);
        const frame = card.querySelector<HTMLElement>(".frame")!;
        const image = document.createElement("img");
        image.alt = "";
        frame.replaceChildren(image);
        void paint(card, image, frame, card.dataset.key!, card.dataset.thumbnail!);
      }
    },
    { rootMargin: "0px" },
  );
  return {
    /** Draw this card's picture when it comes into view. */
    watch: (card: HTMLElement): void => seen.observe(card),

    /** Forget every pending card, before a list is redrawn. */
    clear: (): void => {
      seen.disconnect();
      visible.clear();
      started.clear();
    },
  };
}
