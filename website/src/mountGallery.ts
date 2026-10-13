/**
 * Enhance the collection's secondary capture links with a native modal gallery. collection.ts supplies its document; this module reads each article once, then owns the selected building/view and all dialog mutations. Captures, copy and destination links remain authored in index.html, the single data owner. Showing a building resets its view to the exterior. View navigation wraps within that building; building navigation wraps within the collection.
 *
 * Rendering replaces the image before binding its failure handler, so an old image's late error cannot replace a newer view. Native dialog owns Escape, focus containment and background inertness. Closing restores the original opener's focus. Close/teardown synchronously release the document lock; delayed native close events cannot affect a newly opened gallery. The disposer also removes dynamic image/view listeners. Browsers without showModal keep the original image-link behavior.
 */
import { GalleryController } from "./gallery/GalleryController";
import { GalleryImageLifecycle } from "./gallery/GalleryImageLifecycle";
import { deriveGallerySelection } from "./gallery/deriveGallerySelection";
import { requireGalleryValue } from "./gallery/requireGalleryValue";
import { readGalleryBuildings } from "./gallery/readGalleryBuildings";

/** Required authored markup is a precondition; fail before attaching events. */
const required: <T extends Element>(root: ParentNode, selector: string) => T = <T extends Element>(root: ParentNode, selector: string): T => {
  return requireGalleryValue(root.querySelector<T>(selector), selector);
};

/** Read content first, then attach the enhancement as one disposable unit. */
export const mountGallery: (document: Document) => (() => void) = (document: Document): (() => void) => {
  const dialog: HTMLDialogElement = required<HTMLDialogElement>(document, "#gallery");
  if (typeof dialog.showModal !== "function") return () : void => {};
  const title: HTMLElement = required<HTMLElement>(dialog, "#gallery-title");
  const era: HTMLElement = required<HTMLElement>(dialog, "#gallery-era");
  const description: HTMLElement = required<HTMLElement>(dialog, "#gallery-description");
  const picture: HTMLElement = required<HTMLElement>(dialog, "#gallery-picture");
  const caption: HTMLElement = required<HTMLElement>(dialog, "#gallery-caption");
  const views: HTMLElement = required<HTMLElement>(dialog, "#gallery-views");
  const original: HTMLAnchorElement = required<HTMLAnchorElement>(dialog, "#gallery-original");
  const source: HTMLAnchorElement = required<HTMLAnchorElement>(dialog, "#gallery-source");
  const tour: HTMLAnchorElement = required<HTMLAnchorElement>(dialog, "#gallery-tour");
  const count: HTMLElement = required<HTMLElement>(dialog, "#gallery-count");
  const close: HTMLButtonElement = required<HTMLButtonElement>(dialog, "#gallery-close");
  const previous: HTMLButtonElement = required<HTMLButtonElement>(dialog, "#gallery-previous");
  const next: HTMLButtonElement = required<HTMLButtonElement>(dialog, "#gallery-next");
  const buildings: { opener: HTMLAnchorElement; title: string; era: string; description: string; source: string; tour: HTMLAnchorElement | null; images: HTMLImageElement[]; }[] = readGalleryBuildings(document);
  const imageLifecycle: GalleryImageLifecycle = new GalleryImageLifecycle();
  const content: { title: string; era: string; description: string; source: string; tour: string | null; images: { src: string; alt: string; label: string | undefined; }[]; }[] = buildings.map((building: { opener: HTMLAnchorElement; title: string; era: string; description: string; source: string; tour: HTMLAnchorElement | null; images: HTMLImageElement[]; }) : { title: string; era: string; description: string; source: string; tour: string | null; images: { src: string; alt: string; label: string | undefined; }[]; } => ({
    title: building.title, era: building.era, description: building.description,
    source: building.source, tour: building.tour?.href ?? null,
    images: building.images.map((image: HTMLImageElement) : { src: string; alt: string; label: string | undefined; } => ({ src: image.src, alt: image.alt, label: image.dataset.label })),
  }));
  let unbindViews: (() => void)[] = [];
  const removeListeners: (() => void)[] = [];
  const listen: (node: EventTarget, type: string, callback: (event: Event) => void) => void = (
    node: EventTarget,
    type: string,
    callback: (event: Event) => void,
  ): void => {
    node.addEventListener(type, callback);
    removeListeners.push(() : void => node.removeEventListener(type, callback));
  };

  const showView: (buildingIndex: number, index: number) => void = (buildingIndex: number, index: number): void => {
    const image: HTMLImageElement = buildings[buildingIndex].images[index];
    imageLifecycle.replace((whenCurrent: (effect: () => void) => void) : () => void => {
      const copy: HTMLImageElement = image.cloneNode(true) as HTMLImageElement;
      copy.loading = "eager";
      copy.removeAttribute("fetchpriority");
      picture.replaceChildren(copy);
      const failImage: () => void = (): void => {
        whenCurrent(() : void => {
          const message: HTMLParagraphElement = document.createElement("p");
          message.className = "gallery-error";
          message.textContent = "This image could not load. Use “Open full image” to try it directly.";
          copy.replaceWith(message);
        });
      };
      copy.addEventListener("error", failImage, { once: true });
      return () : void => copy.removeEventListener("error", failImage);
    });
    const selection: { title: string | null; era: string | null; description: string | null; source: string; tour: string | null; count: string; image: { src: string; alt: string; label: string | undefined; }; caption: string | undefined; pressed: boolean[]; } = deriveGallerySelection(content, buildingIndex, index);
    caption.textContent = selection.caption!;
    original.href = selection.image.src;
    Array.from(views.children).forEach((button: Element, position: number) : void => {
      button.setAttribute("aria-pressed", String(position === index));
    });
  };

  const showBuilding: (index: number) => void = (index: number): void => {
    unbindViews.forEach((remove: () => void) : void => remove());
    unbindViews = [];
    const building: { opener: HTMLAnchorElement; title: string; era: string; description: string; source: string; tour: HTMLAnchorElement | null; images: HTMLImageElement[]; } = buildings[index];
    const selection: { title: string | null; era: string | null; description: string | null; source: string; tour: string | null; count: string; image: { src: string; alt: string; label: string | undefined; }; caption: string | undefined; pressed: boolean[]; } = deriveGallerySelection(content, index, 0);
    title.textContent = selection.title;
    era.textContent = selection.era;
    description.textContent = selection.description;
    source.href = selection.source;
    tour.hidden = selection.tour === null;
    if (selection.tour === null) tour.removeAttribute("href");
    else tour.href = selection.tour;
    count.textContent = selection.count;
    views.replaceChildren(
      ...building.images.map((image: HTMLImageElement, position: number) : HTMLButtonElement => {
        const button: HTMLButtonElement = document.createElement("button");
        button.type = "button";
        button.textContent = position === 0 ? "Exterior" : image.dataset.label!;
        const select: () => void = (): void => controller.selectView(position);
        button.addEventListener("click", select);
        unbindViews.push(() : void => button.removeEventListener("click", select));
        return button;
      }),
    );
  };

  const controller: GalleryController<HTMLAnchorElement> = new GalleryController<HTMLAnchorElement>({
    supportsModal: true,
    isOpen: () : boolean => dialog.open,
    renderBuilding: showBuilding,
    renderView: showView,
    showModal: () : void => dialog.showModal(),
    closeModal: () : void => dialog.close(),
    setLocked: (locked: boolean) : boolean => document.documentElement.classList.toggle("gallery-open", locked),
    focus: (element: HTMLAnchorElement) : void => element.focus(),
    disposeContents: () : void => {
      imageLifecycle.dispose();
      unbindViews.forEach((remove: () => void) : void => remove());
      removeListeners.forEach((remove: () => void) : void => remove());
    },
  }, buildings.map((building: { opener: HTMLAnchorElement; title: string; era: string; description: string; source: string; tour: HTMLAnchorElement | null; images: HTMLImageElement[]; }) : number => building.images.length));

  buildings.forEach((building: { opener: HTMLAnchorElement; title: string; era: string; description: string; source: string; tour: HTMLAnchorElement | null; images: HTMLImageElement[]; }, index: number) : void =>
    listen(building.opener, "click", (event: Event) : void => {
      const click: MouseEvent = event as MouseEvent;
      controller.open(index, building.opener, click, () : void => event.preventDefault());
    }),
  );
  const finishClose: () => void = (): void => controller.closed();
  const closeGallery: () => void = (): void => controller.close();
  listen(close, "click", closeGallery);
  listen(dialog, "close", finishClose);
  listen(previous, "click", () : void => controller.moveBuilding(-1));
  listen(next, "click", () : void => controller.moveBuilding(1));
  listen(dialog, "keydown", (event: Event) : void => {
    const key: KeyboardEvent = event as KeyboardEvent;
    controller.key(key, () : void => event.preventDefault());
  });
  listen(dialog, "click", (event: Event) : void => {
    if (event.target !== dialog) return;
    const click: MouseEvent = event as MouseEvent;
    const bounds: DOMRect = dialog.getBoundingClientRect();
    controller.backdrop({ dialogTarget: true, x: click.clientX, y: click.clientY, bounds });
  });
  return () : void => {
    controller.dispose();
  };
};
