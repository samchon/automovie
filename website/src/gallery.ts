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

/** Required authored markup is a precondition; fail before attaching events. */
const required = <T extends Element>(root: ParentNode, selector: string): T => {
  const element = root.querySelector<T>(selector);
  if (element === null) throw new Error(`Missing gallery element: ${selector}`);
  return element;
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
  const buildings = Array.from(
    document.querySelectorAll<HTMLElement>(".building"),
    (article) => {
      const opener = required<HTMLAnchorElement>(article, "[data-gallery]");
      const exterior = required<HTMLImageElement>(article, "img");
      const template = required<HTMLTemplateElement>(
        article,
        ".building-views",
      );
      return {
        opener,
        title: required<HTMLElement>(article, "h3").textContent,
        era: required<HTMLElement>(article, ".era").textContent,
        description: required<HTMLElement>(article, ".building-description")
          .textContent,
        source: required<HTMLAnchorElement>(article, ".source-link").href,
        tour: article.querySelector<HTMLAnchorElement>(".tour-link"),
        images: [
          exterior,
          ...template.content.querySelectorAll<HTMLImageElement>("img"),
        ],
      };
    },
  );
  if (buildings.length === 0) throw new Error("The gallery needs a building.");
  let buildingIndex = 0;
  let viewIndex = 0;
  let opener: HTMLAnchorElement | null = null;
  let unbindImage = (): void => {};
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

  const showView = (index: number): void => {
    unbindImage();
    viewIndex = index;
    const image = buildings[buildingIndex].images[index];
    const copy = image.cloneNode(true) as HTMLImageElement;
    copy.loading = "eager";
    copy.removeAttribute("fetchpriority");
    picture.replaceChildren(copy);
    const failImage = (): void => {
      const message = document.createElement("p");
      message.className = "gallery-error";
      message.textContent =
        "This image could not load. Use “Open full image” to try it directly.";
      copy.replaceWith(message);
    };
    copy.addEventListener("error", failImage, { once: true });
    unbindImage = () => copy.removeEventListener("error", failImage);
    caption.textContent = index === 0 ? "Exterior" : image.dataset.label!;
    original.href = image.src;
    Array.from(views.children).forEach((button, position) => {
      button.setAttribute("aria-pressed", String(position === index));
    });
  };

  const showBuilding = (index: number): void => {
    unbindViews.forEach((remove) => remove());
    unbindViews = [];
    buildingIndex = index;
    const building = buildings[index];
    title.textContent = building.title;
    era.textContent = building.era;
    description.textContent = building.description;
    source.href = building.source;
    tour.hidden = building.tour === null;
    if (building.tour === null) tour.removeAttribute("href");
    else tour.href = building.tour.href;
    count.textContent = `${index + 1} / ${buildings.length}`;
    views.replaceChildren(
      ...building.images.map((image, position) => {
        const button = document.createElement("button");
        button.type = "button";
        button.textContent = position === 0 ? "Exterior" : image.dataset.label!;
        const select = (): void => showView(position);
        button.addEventListener("click", select);
        unbindViews.push(() => button.removeEventListener("click", select));
        return button;
      }),
    );
    showView(0);
  };

  buildings.forEach((building, index) =>
    listen(building.opener, "click", (event) => {
      const click = event as MouseEvent;
      if (
        click.button !== 0 ||
        click.ctrlKey ||
        click.metaKey ||
        click.shiftKey ||
        click.altKey
      )
        return;
      event.preventDefault();
      opener = building.opener;
      showBuilding(index);
      dialog.showModal();
      document.documentElement.classList.add("gallery-open");
    }),
  );
  const finishClose = (): void => {
    if (dialog.open) return;
    document.documentElement.classList.remove("gallery-open");
    opener?.focus();
  };
  const closeGallery = (): void => {
    dialog.close();
    finishClose();
  };
  listen(close, "click", closeGallery);
  listen(dialog, "close", finishClose);
  listen(previous, "click", () =>
    showBuilding((buildingIndex + buildings.length - 1) % buildings.length),
  );
  listen(next, "click", () =>
    showBuilding((buildingIndex + 1) % buildings.length),
  );
  listen(dialog, "keydown", (event) => {
    const key = event as KeyboardEvent;
    if (key.key !== "ArrowLeft" && key.key !== "ArrowRight") return;
    if (key.ctrlKey || key.metaKey || key.altKey || key.shiftKey) return;
    event.preventDefault();
    const length = buildings[buildingIndex].images.length;
    showView(
      (viewIndex + length + (key.key === "ArrowRight" ? 1 : -1)) % length,
    );
  });
  listen(dialog, "click", (event) => {
    if (event.target !== dialog) return;
    const click = event as MouseEvent;
    const bounds = dialog.getBoundingClientRect();
    if (
      click.clientX < bounds.left ||
      click.clientX > bounds.right ||
      click.clientY < bounds.top ||
      click.clientY > bounds.bottom
    )
      closeGallery();
  });
  return () => {
    closeGallery();
    unbindImage();
    unbindViews.forEach((remove) => remove());
    removeListeners.forEach((remove) => remove());
  };
};
