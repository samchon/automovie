/**
 * The part gallery: each named part of the human as a card that opens the
 * viewer isolated on that part. The card's picture is the part alone in clay,
 * framed by the viewer. The meshes each document reports are read once
 * through `/parts`, and a bookmark whose mesh the document does not report is
 * dimmed and says so instead of drawing a blank picture, so a mesh renamed in
 * the model shows up here.
 */
import type { HumanViewerCatalogue } from "@automovie/viewer/human/inspection/HumanViewerCatalogue";
import type { IHumanViewerPartBookmark } from "./IHumanViewerPartBookmark";
import { createHumanViewerThumbnails } from "./createHumanViewerThumbnails";
import { humanViewerPartBookmarks } from "./humanViewerPartBookmarks";
import { openHumanViewerHref } from "@automovie/viewer/human/inspection/openHumanViewerHref";

const list: HTMLElement = document.querySelector<HTMLElement>("#list")!;
const status: HTMLElement = document.querySelector<HTMLElement>("#status")!;
let revision: string = "";
let closed: boolean = false;
const thumbnails: { watch: (card: HTMLElement) => void; clear: () => void; } = createHumanViewerThumbnails({ revision: (): string => revision });

async function reported(doc: string): Promise<string[] | null> {
  if (closed) return null;
  try {
    const response: Response = await fetch(
      "/parts?" + new URLSearchParams({ doc, size: "64" }),
    );
    if (!response.ok) return null;
    return ((await response.json()) as { name: string }[]).map(
      (part: { name: string; }): string => part.name,
    );
  } catch {
    return null;
  }
}

function card(
  bookmark: IHumanViewerPartBookmark,
  missing: string[],
): HTMLAnchorElement {
  const href: { view: string; render: string; thumbnail: string; sheet: string; } = openHumanViewerHref(bookmark.doc, { parts: bookmark.meshes });
  const anchor: HTMLAnchorElement = document.createElement("a");
  anchor.className = "card" + (missing.length === 0 ? "" : " missing");
  anchor.href = href.view;
  anchor.dataset.key = bookmark.id + "@" + bookmark.doc;
  anchor.dataset.thumbnail = href.thumbnail;
  anchor.title = bookmark.meshes.join(", ");
  const frame: HTMLDivElement = document.createElement("div");
  frame.className = "frame";
  frame.textContent =
    missing.length === 0
      ? "Not drawn yet"
      : "Not in " + bookmark.doc + ": " + missing.join(", ");
  const label: HTMLSpanElement = document.createElement("span");
  label.className = "label";
  label.textContent = `${bookmark.label} (${bookmark.doc})`;
  anchor.append(frame, label);
  return anchor;
}

async function load(): Promise<void> {
  revision = ((await (await fetch("/docs")).json()) as HumanViewerCatalogue)
    .revision;
  const names: Map<string, string[] | null> = new Map<string, string[] | null>();
  for (const doc of new Set(humanViewerPartBookmarks.map((item: IHumanViewerPartBookmark): string => item.doc))) {
    if (closed) return;
    status.textContent = "Reading the meshes of " + doc;
    names.set(doc, await reported(doc));
  }
  if (closed) return;
  const regions: Map<string, IHumanViewerPartBookmark[]> = new Map<string, IHumanViewerPartBookmark[]>();
  for (const item of humanViewerPartBookmarks)
    regions.set(item.region, [...(regions.get(item.region) ?? []), item]);
  list.replaceChildren();
  for (const [region, members] of regions) {
    const section: HTMLElement = document.createElement("section");
    const heading: HTMLHeadingElement = document.createElement("h2");
    heading.textContent = region;
    const grid: HTMLDivElement = document.createElement("div");
    grid.className = "grid";
    for (const item of members) {
      const known: string[] | null = names.get(item.doc) ?? null;
      const missing: string[] =
        known === null
          ? []
          : item.meshes.filter((mesh: string): boolean => !known.includes(mesh));
      const anchor: HTMLAnchorElement = card(item, missing);
      grid.append(anchor);
      if (missing.length === 0) thumbnails.watch(anchor);
    }
    section.append(heading, grid);
    list.append(section);
  }
  const unread: string[] = [...names]
    .filter(([, value]: [string, string[] | null]): boolean => value === null)
    .map(([doc]: [string, string[] | null]): string => doc);
  status.textContent =
    unread.length === 0
      ? `${humanViewerPartBookmarks.length} parts`
      : "Could not read the meshes of " + unread.join(", ");
}
void load().catch((failure: unknown): void => {
  status.textContent =
    failure instanceof Error ? failure.message : String(failure);
});
addEventListener("pagehide", (event: PageTransitionEvent): void => {
  if (event.persisted) return;
  closed = true;
  thumbnails.clear();
});
