/**
 * The viewer's entry page for a person: every published face, every standard
 * body state and every hand-written input as a card that opens the navigable
 * viewer with one click. Thumbnails are the resident server's own small clay
 * front renders, requested one at a time and only for cards that scroll into
 * view, so browsing never floods the GPU queue other sessions share. A
 * thumbnail is kept in the browser's cache under the source revision that drew
 * it; after a source change the older picture stays, dimmed, until the new
 * one arrives, and a card whose render is refused shows the reason.
 */
import type { HumanViewerCatalogue } from "./HumanViewerCatalogue";
import { describeHumanViewerDocuments } from "./describeHumanViewerDocuments";
import { filterHumanViewerIndex } from "./filterHumanViewerIndex";
import { openHumanViewerHref } from "./openHumanViewerHref";

const list = document.querySelector<HTMLElement>("#list")!;
const search = document.querySelector<HTMLInputElement>("#search")!;
const status = document.querySelector<HTMLElement>("#status")!;
const empty = document.querySelector<HTMLElement>("#empty")!;
const rejected = document.querySelector<HTMLElement>("#rejected")!;
const buttons = [
  ...document.querySelectorAll<HTMLButtonElement>("[data-domain]"),
];
let domain: "all" | "face" | "body" = "all";
let revision = "";

const cache = async (): Promise<Cache | null> => {
  try {
    return await caches.open("human-viewer-thumbnails");
  } catch {
    return null;
  }
};

// One thumbnail request runs at a time.
let chain: Promise<void> = Promise.resolve();
const once = <T,>(task: () => Promise<T>): Promise<T> => {
  const next = chain.then(task);
  chain = next.then(() => {}).catch(() => {});
  return next;
};

async function paint(
  image: HTMLImageElement,
  frame: HTMLElement,
  id: string,
  url: string,
): Promise<void> {
  const store = await cache();
  const key = "/thumbnail/" + encodeURIComponent(id);
  const kept = await store?.match(key);
  if (kept !== undefined) {
    image.src = URL.createObjectURL(await kept.clone().blob());
    if (kept.headers.get("X-Revision") === revision) return;
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
      key,
      new Response(bytes, {
        headers: { "Content-Type": "image/png", "X-Revision": revision },
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
      const card = item.target as HTMLAnchorElement;
      const frame = card.querySelector<HTMLElement>(".frame")!;
      const image = document.createElement("img");
      image.alt = "";
      frame.replaceChildren(image);
      void paint(image, frame, card.dataset.doc!, card.dataset.thumbnail!);
    }
  },
  { rootMargin: "240px" },
);

let entries: ReturnType<typeof describeHumanViewerDocuments> = [];
function draw(): void {
  seen.disconnect();
  const shown = filterHumanViewerIndex(entries, {
    text: search.value,
    domain,
  });
  list.replaceChildren();
  const sections = new Map<string, typeof shown>();
  for (const entry of shown)
    sections.set(entry.section, [...(sections.get(entry.section) ?? []), entry]);
  for (const [name, members] of sections) {
    const section = document.createElement("section");
    const heading = document.createElement("h2");
    heading.textContent = `${name} (${members.length})`;
    const grid = document.createElement("div");
    grid.className = "grid";
    for (const entry of members) {
      const href = openHumanViewerHref(entry.id);
      const card = document.createElement("a");
      card.className = "card";
      card.href = href.view;
      card.dataset.doc = entry.id;
      card.dataset.thumbnail = href.thumbnail;
      card.title = entry.id;
      const frame = document.createElement("div");
      frame.className = "frame";
      frame.textContent = "Not drawn yet";
      const label = document.createElement("span");
      label.className = "label";
      label.textContent = entry.label;
      card.append(frame, label);
      grid.append(card);
      seen.observe(card);
    }
    section.append(heading, grid);
    list.append(section);
  }
  empty.style.display = shown.length === 0 ? "block" : "none";
  status.textContent = `${shown.length} of ${entries.length} documents`;
}

async function load(): Promise<void> {
  const catalogue = (await (
    await fetch("/docs")
  ).json()) as HumanViewerCatalogue;
  revision = catalogue.revision;
  entries = describeHumanViewerDocuments(catalogue);
  rejected.style.display = catalogue.rejected.length === 0 ? "none" : "block";
  rejected.textContent = catalogue.rejected
    .map((item) => `${item.file}: ${item.reason}`)
    .join("\n");
  draw();
}
search.addEventListener("input", draw);
for (const button of buttons)
  button.addEventListener("click", () => {
    domain = button.dataset.domain as typeof domain;
    for (const other of buttons)
      other.setAttribute("aria-pressed", String(other === button));
    draw();
  });
void load().catch((failure: unknown) => {
  status.textContent = failure instanceof Error ? failure.message : String(failure);
});
