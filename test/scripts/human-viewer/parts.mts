/**
 * The part gallery: each named part of the human as a card that opens the
 * viewer isolated on that part. The card's picture is the part alone in clay,
 * framed by the viewer. The meshes each document reports are read once
 * through `/parts`, and a bookmark whose mesh the document does not report is
 * dimmed and says so instead of drawing a blank picture, so a mesh renamed in
 * the model shows up here.
 */
import type { HumanViewerCatalogue } from "./HumanViewerCatalogue";
import type { IHumanViewerPartBookmark } from "./IHumanViewerPartBookmark";
import { createHumanViewerThumbnails } from "./createHumanViewerThumbnails";
import { humanViewerPartBookmarks } from "./humanViewerPartBookmarks";
import { openHumanViewerHref } from "./openHumanViewerHref";

const list = document.querySelector<HTMLElement>("#list")!;
const status = document.querySelector<HTMLElement>("#status")!;
let revision = "";
const thumbnails = createHumanViewerThumbnails({ revision: () => revision });

async function reported(doc: string): Promise<string[] | null> {
  try {
    const response = await fetch(
      "/parts?" + new URLSearchParams({ doc, size: "64" }),
    );
    if (!response.ok) return null;
    return ((await response.json()) as { name: string }[]).map(
      (part) => part.name,
    );
  } catch {
    return null;
  }
}

function card(
  bookmark: IHumanViewerPartBookmark,
  missing: string[],
): HTMLAnchorElement {
  const href = openHumanViewerHref(bookmark.doc, { parts: bookmark.meshes });
  const anchor = document.createElement("a");
  anchor.className = "card" + (missing.length === 0 ? "" : " missing");
  anchor.href = href.view;
  anchor.dataset.key = bookmark.id + "@" + bookmark.doc;
  anchor.dataset.thumbnail = href.thumbnail;
  anchor.title = bookmark.meshes.join(", ");
  const frame = document.createElement("div");
  frame.className = "frame";
  frame.textContent =
    missing.length === 0
      ? "Not drawn yet"
      : "Not in " + bookmark.doc + ": " + missing.join(", ");
  const label = document.createElement("span");
  label.className = "label";
  label.textContent = `${bookmark.label} (${bookmark.doc})`;
  anchor.append(frame, label);
  return anchor;
}

async function load(): Promise<void> {
  revision = ((await (await fetch("/docs")).json()) as HumanViewerCatalogue)
    .revision;
  const names = new Map<string, string[] | null>();
  for (const doc of new Set(humanViewerPartBookmarks.map((item) => item.doc))) {
    status.textContent = "Reading the meshes of " + doc;
    names.set(doc, await reported(doc));
  }
  const regions = new Map<string, IHumanViewerPartBookmark[]>();
  for (const item of humanViewerPartBookmarks)
    regions.set(item.region, [...(regions.get(item.region) ?? []), item]);
  list.replaceChildren();
  for (const [region, members] of regions) {
    const section = document.createElement("section");
    const heading = document.createElement("h2");
    heading.textContent = region;
    const grid = document.createElement("div");
    grid.className = "grid";
    for (const item of members) {
      const known = names.get(item.doc) ?? null;
      const missing =
        known === null
          ? []
          : item.meshes.filter((mesh) => !known.includes(mesh));
      const anchor = card(item, missing);
      grid.append(anchor);
      if (missing.length === 0) thumbnails.watch(anchor);
    }
    section.append(heading, grid);
    list.append(section);
  }
  const unread = [...names]
    .filter(([, value]) => value === null)
    .map(([doc]) => doc);
  status.textContent =
    unread.length === 0
      ? `${humanViewerPartBookmarks.length} parts`
      : "Could not read the meshes of " + unread.join(", ");
}
void load().catch((failure: unknown) => {
  status.textContent =
    failure instanceof Error ? failure.message : String(failure);
});
