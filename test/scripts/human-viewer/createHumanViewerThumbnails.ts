/**
 * Lazy thumbnails for the viewer's gallery pages. A card is drawn only when it
 * scrolls near the viewport, and one request runs at a time, so browsing never
 * floods the GPU queue that other sessions share. A picture is kept in the
 * browser's cache under the source revision that drew it; after a source
 * change the older picture stays, dimmed, until the new one arrives, and a
 * card whose render is refused shows the server's reason. Nothing leaves the
 * browser: the cache holds only what the loopback server rendered.
 *
 * Each card is an element with a `.frame` child; `key` names its picture in
 * the cache and `url` is the `/render` request that draws it.
 */
export function createHumanViewerThumbnails(props: {
  /** The source revision the server reports now; a picture from another is stale. */
  revision: () => string;
}) {
  const cache = async (): Promise<Cache | null> => {
    try {
      return await caches.open("human-viewer-thumbnails");
    } catch {
      return null;
    }
  };
  let chain: Promise<void> = Promise.resolve();
  const once = <T>(task: () => Promise<T>): Promise<T> => {
    const next = chain.then(task);
    chain = next.then(() => {}).catch(() => {});
    return next;
  };
  async function paint(
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
        const response = await fetch(url);
        if (!response.ok)
          throw new Error(
            ((await response.json()) as { error?: string }).error ??
              response.statusText,
          );
        return response.blob();
      });
      await store?.put(
        name,
        new Response(bytes, {
          headers: {
            "Content-Type": "image/png",
            "X-Revision": props.revision(),
          },
        }),
      );
      image.src = URL.createObjectURL(bytes);
      image.classList.remove("stale");
    } catch (failure) {
      if (kept === undefined)
        frame.textContent =
          failure instanceof Error ? failure.message : String(failure);
    }
  }
  const seen = new IntersectionObserver(
    (observed) => {
      for (const item of observed) {
        if (!item.isIntersecting) continue;
        seen.unobserve(item.target);
        const card = item.target as HTMLElement;
        const frame = card.querySelector<HTMLElement>(".frame")!;
        const image = document.createElement("img");
        image.alt = "";
        frame.replaceChildren(image);
        void paint(image, frame, card.dataset.key!, card.dataset.thumbnail!);
      }
    },
    { rootMargin: "240px" },
  );
  return {
    /** Draw this card's picture when it comes into view. */
    watch: (card: HTMLElement): void => seen.observe(card),

    /** Forget every pending card, before a list is redrawn. */
    clear: (): void => seen.disconnect(),
  };
}
