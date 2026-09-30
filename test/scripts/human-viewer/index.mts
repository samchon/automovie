/**
 * The viewer's entry page for a person: every published face, every standard
 * body state and every hand-written input as a card that opens the navigable
 * viewer with one click. Thumbnails are the resident server's own small clay
 * front renders, requested one at a time and only for cards that scroll into
 * view, so browsing never floods the GPU queue other sessions share. A
 * thumbnail comes from the shared lazy loader, which caches it by revision.
 */
import type { HumanViewerCatalogue } from "./HumanViewerCatalogue";
import { createHumanViewerThumbnails } from "./createHumanViewerThumbnails";
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
let domain: "all" | "face" | "body" | "person" = "all";
let revision = "";

const thumbnails = createHumanViewerThumbnails({ revision: () => revision });

let entries: ReturnType<typeof describeHumanViewerDocuments> = [];
function draw(): void {
  thumbnails.clear();
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
      card.dataset.key = entry.id;
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
      thumbnails.watch(card);
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
