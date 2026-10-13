import type { IHumanViewerIndexEntry } from "./IHumanViewerIndexEntry";
import type { IHumanViewerRejectedInput } from "@automovie/viewer/human/inspection/IHumanViewerRejectedInput";
/**
 * The viewer's entry page for a person: every published face, every standard
 * body state and every hand-written input as a card that opens the navigable
 * viewer with one click. Thumbnails are the resident server's own small clay
 * front renders, requested one at a time and only for cards that scroll into
 * view, so browsing never floods the GPU queue other sessions share. A
 * thumbnail comes from the shared lazy loader, which caches it by revision.
 */
import type { HumanViewerCatalogue } from "@automovie/viewer/human/inspection/HumanViewerCatalogue";
import { createHumanViewerThumbnails } from "./createHumanViewerThumbnails";
import { describeHumanViewerDocuments } from "./describeHumanViewerDocuments";
import { filterHumanViewerIndex } from "./filterHumanViewerIndex";
import { openHumanViewerHref } from "@automovie/viewer/human/inspection/openHumanViewerHref";

const list: HTMLElement = document.querySelector<HTMLElement>("#list")!;
const search: HTMLInputElement = document.querySelector<HTMLInputElement>("#search")!;
const status: HTMLElement = document.querySelector<HTMLElement>("#status")!;
const empty: HTMLElement = document.querySelector<HTMLElement>("#empty")!;
const rejected: HTMLElement = document.querySelector<HTMLElement>("#rejected")!;
const buttons: HTMLButtonElement[] = [
  ...document.querySelectorAll<HTMLButtonElement>("[data-domain]"),
];
let domain: "all" | "face" | "body" | "person" = "all";
let revision: string = "";
let closed: boolean = false;
/** Documents with a local reference photograph, empty when there are none. */
let photographed: Set<string> = new Set<string>();

const thumbnails: { watch: (card: HTMLElement) => void; clear: () => void; } = createHumanViewerThumbnails({ revision: (): string => revision });

let entries: ReturnType<typeof describeHumanViewerDocuments> = [];
function draw(): void {
  if (closed) return;
  thumbnails.clear();
  const shown: IHumanViewerIndexEntry[] = filterHumanViewerIndex(entries, {
    text: search.value,
    domain,
  });
  list.replaceChildren();
  const sections: Map<string, IHumanViewerIndexEntry[]> = new Map<string, typeof shown>();
  for (const entry of shown)
    sections.set(entry.section, [
      ...(sections.get(entry.section) ?? []),
      entry,
    ]);
  for (const [name, members] of sections) {
    const section: HTMLElement = document.createElement("section");
    const heading: HTMLHeadingElement = document.createElement("h2");
    heading.textContent = `${name} (${members.length})`;
    const grid: HTMLDivElement = document.createElement("div");
    grid.className = "grid";
    for (const entry of members) {
      const href: { view: string; render: string; thumbnail: string; sheet: string; } = openHumanViewerHref(entry.id);
      const card: HTMLDivElement = document.createElement("div");
      card.className = "card";
      card.dataset.key = entry.id;
      card.dataset.thumbnail = href.thumbnail;
      const open: HTMLAnchorElement = document.createElement("a");
      open.href = href.view;
      open.title = entry.id;
      const frame: HTMLDivElement = document.createElement("div");
      frame.className = "frame";
      frame.textContent = "Not drawn yet";
      const label: HTMLSpanElement = document.createElement("span");
      label.className = "label";
      label.textContent = entry.label;
      open.append(frame, label);
      card.append(open);
      if (photographed.has(entry.id)) {
        const compare: HTMLAnchorElement = document.createElement("a");
        compare.className = "compare";
        compare.href = openHumanViewerHref(entry.id, { ref: "split" }).view;
        compare.textContent = "Compare with photo";
        card.append(compare);
      }
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
  const catalogue: HumanViewerCatalogue = (await (
    await fetch("/docs")
  ).json()) as HumanViewerCatalogue;
  if (closed) return;
  revision = catalogue.revision;
  entries = describeHumanViewerDocuments(catalogue);
  rejected.style.display = catalogue.rejected.length === 0 ? "none" : "block";
  rejected.textContent = catalogue.rejected
    .map((item: IHumanViewerRejectedInput): string => `${item.file}: ${item.reason}`)
    .join("\n");
  try {
    photographed = new Set(
      (
        (await (await fetch("/reference-index")).json()) as {
          documents: string[];
        }
      ).documents,
    );
  } catch {
    photographed = new Set();
  }
  if (!closed) draw();
}
search.addEventListener("input", draw);
for (const button of buttons)
  button.addEventListener("click", (): void => {
    domain = button.dataset.domain as typeof domain;
    for (const other of buttons)
      other.setAttribute("aria-pressed", String(other === button));
    draw();
  });
void load().catch((failure: unknown): void => {
  status.textContent =
    failure instanceof Error ? failure.message : String(failure);
});
addEventListener("pagehide", (event: PageTransitionEvent): void => {
  if (event.persisted) return;
  closed = true;
  thumbnails.clear();
});
