/**
 * Enhance the collection's secondary capture links with a native modal gallery.
 * collection.ts supplies its document; this module reads each article once,
 * then owns the selected building/view and all dialog mutations. Captures,
 * copy and destination links remain authored in index.html, the single data
 * owner. Showing a building resets its view to the exterior. View navigation
 * wraps within that building; building navigation wraps within the collection.
 *
 * Rendering replaces the image before binding its failure handler, so an old
 * image's late error cannot replace a newer view. Native dialog owns Escape,
 * focus containment and background inertness. Closing restores the original
 * opener's focus. Close/teardown synchronously release the document lock;
 * delayed native close events cannot affect a newly opened gallery. The
 * disposer also removes dynamic image/view listeners. Browsers without
 * showModal keep the original image-link behavior.
 */

import { GalleryController } from "./gallery/GalleryController";
import { GalleryImageLifecycle } from "./gallery/GalleryImageLifecycle";
import { deriveGallerySelection } from "./gallery/deriveGallerySelection";
import { requireGalleryValue } from "./gallery/requireGalleryValue";
import { readGalleryBuildings } from "./gallery/readGalleryBuildings";

/** Required authored markup is a precondition; fail before attaching events. */
const required = <T extends Element>(root: ParentNode, selector: string): T => {
  return requireGalleryValue(root.querySelector<T>(selector), selector);
};

/** Read content first, then attach the enhancement as one disposable unit. */
export const mountGallery = (document: Document): (() => void) => {
  const dialog = required<HTMLDialogElement>(document, "#gallery");
  if (typeof dialog.showModal !== "function") return () => {};
  const title = required<HTMLElement>(dialog, "#gallery-title");
  const era = required<HTMLElement>(dialog, "#gallery-era");
  const description = required<HTMLElement>(dialog, "#gallery-description");
  const picture = required<HTMLElement>(dialog, "#gallery-picture");
  const caption = required<HTMLElement>(dialog, "#gallery-caption");
  const views = required<HTMLElement>(dialog, "#gallery-views");
  const original = required<HTMLAnchorElement>(dialog, "#gallery-original");
  const source = required<HTMLAnchorElement>(dialog, "#gallery-source");
  const tour = required<HTMLAnchorElement>(dialog, "#gallery-tour");
  const count = required<HTMLElement>(dialog, "#gallery-count");
  const close = required<HTMLButtonElement>(dialog, "#gallery-close");
  const previous = required<HTMLButtonElement>(dialog, "#gallery-previous");
  const next = required<HTMLButtonElement>(dialog, "#gallery-next");
  const buildings = readGalleryBuildings(document);
  const imageLifecycle = new GalleryImageLifecycle();
  const content = buildings.map((building) => ({
    title: building.title, era: building.era, description: building.description,
    source: building.source, tour: building.tour?.href ?? null,
    images: building.images.map((image) => ({ src: image.src, alt: image.alt, label: image.dataset.label })),
  }));
  let unbindViews: (() => void)[] = [];
  const removeListeners: (() => void)[] = [];
  const listen = (
    node: EventTarget,
    type: string,
    callback: (event: Event) => void,
  ): void => {
    node.addEventListener(type, callback);
    removeListeners.push(() => node.removeEventListener(type, callback));
  };

  const showView = (buildingIndex: number, index: number): void => {
    const image = buildings[buildingIndex].images[index];
    imageLifecycle.replace((whenCurrent) => {
      const copy = image.cloneNode(true) as HTMLImageElement;
      copy.loading = "eager";
      copy.removeAttribute("fetchpriority");
      picture.replaceChildren(copy);
      const failImage = (): void => {
        whenCurrent(() => {
          const message = document.createElement("p");
          message.className = "gallery-error";
          message.textContent = "This image could not load. Use “Open full image” to try it directly.";
          copy.replaceWith(message);
        });
      };
      copy.addEventListener("error", failImage, { once: true });
      return () => copy.removeEventListener("error", failImage);
    });
    const selection = deriveGallerySelection(content, buildingIndex, index);
    caption.textContent = selection.caption!;
    original.href = selection.image.src;
    Array.from(views.children).forEach((button, position) => {
      button.setAttribute("aria-pressed", String(position === index));
    });
  };

  const showBuilding = (index: number): void => {
    unbindViews.forEach((remove) => remove());
    unbindViews = [];
    const building = buildings[index];
    const selection = deriveGallerySelection(content, index, 0);
    title.textContent = selection.title;
    era.textContent = selection.era;
    description.textContent = selection.description;
    source.href = selection.source;
    tour.hidden = selection.tour === null;
    if (selection.tour === null) tour.removeAttribute("href");
    else tour.href = selection.tour;
    count.textContent = selection.count;
    views.replaceChildren(
      ...building.images.map((image, position) => {
        const button = document.createElement("button");
        button.type = "button";
        button.textContent = position === 0 ? "Exterior" : image.dataset.label!;
        const select = (): void => controller.selectView(position);
        button.addEventListener("click", select);
        unbindViews.push(() => button.removeEventListener("click", select));
        return button;
      }),
    );
  };

  const controller = new GalleryController<HTMLAnchorElement>({
    supportsModal: true,
    isOpen: () => dialog.open,
    renderBuilding: showBuilding,
    renderView: showView,
    showModal: () => dialog.showModal(),
    closeModal: () => dialog.close(),
    setLocked: (locked) => document.documentElement.classList.toggle("gallery-open", locked),
    focus: (element) => element.focus(),
    disposeContents: () => {
      imageLifecycle.dispose();
      unbindViews.forEach((remove) => remove());
      removeListeners.forEach((remove) => remove());
    },
  }, buildings.map((building) => building.images.length));

  buildings.forEach((building, index) =>
    listen(building.opener, "click", (event) => {
      const click = event as MouseEvent;
      controller.open(index, building.opener, click, () => event.preventDefault());
    }),
  );
  const finishClose = (): void => controller.closed();
  const closeGallery = (): void => controller.close();
  listen(close, "click", closeGallery);
  listen(dialog, "close", finishClose);
  listen(previous, "click", () => controller.moveBuilding(-1));
  listen(next, "click", () => controller.moveBuilding(1));
  listen(dialog, "keydown", (event) => {
    const key = event as KeyboardEvent;
    controller.key(key, () => event.preventDefault());
  });
  listen(dialog, "click", (event) => {
    if (event.target !== dialog) return;
    const click = event as MouseEvent;
    const bounds = dialog.getBoundingClientRect();
    controller.backdrop({ dialogTarget: true, x: click.clientX, y: click.clientY, bounds });
  });
  return () => {
    controller.dispose();
  };
};
