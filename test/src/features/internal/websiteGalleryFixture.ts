/**
 * In-memory gallery markup for DOM behavior tests. Synthetic places and rooms
 * describe the interaction contract independently of the production catalog.
 * JSDOM supplies events and elements; only native modal/geometry boundaries
 * are supplied here because JSDOM has neither a top layer nor layout. No
 * source file, browser, network, timer or filesystem is used by this fixture.
 */
import { JSDOM } from "jsdom";

export const websiteGalleryFixture = (buildings = 3, rooms = 2) => {
  const dom = new JSDOM(
    `<!doctype html><html><body>
    ${Array.from(
      { length: buildings },
      (_, index) => `
      <article class="building">
        <a data-gallery href="shots/place-${index + 1}.png"><img src="shots/place-${index + 1}.png" alt="Place ${index + 1} exterior" width="800" height="500"></a>
        <h3>Place ${index + 1}</h3><p class="era">Era ${index + 1}</p>
        <p class="building-description">Description ${index + 1}</p>
        <a class="source-link" href="https://example.org/source/${index + 1}">Source</a>
        ${index === 1 ? '<a class="tour-link" href="manor/?view=exterior">Tour</a>' : ""}
        <template class="building-views">${Array.from({ length: rooms }, (_, room) => `<img src="shots/place-${index + 1}-room-${room + 1}.png" data-label="Room ${room + 1}" alt="Place ${index + 1} room ${room + 1}">`).join("")}</template>
      </article>`,
    ).join("")}
    <dialog id="gallery">
      <h2 id="gallery-title"></h2><p id="gallery-era"></p><p id="gallery-description"></p>
      <div id="gallery-picture"></div><p id="gallery-caption"></p><div id="gallery-views"></div>
      <a id="gallery-original"></a><a id="gallery-source"></a><a id="gallery-tour"></a><span id="gallery-count"></span>
      <button id="gallery-close">Close</button><button id="gallery-previous">Previous</button><button id="gallery-next">Next</button>
    </dialog>
  </body></html>`,
    { url: "https://example.org/AutoMovie/" },
  );
  const document = dom.window.document;
  const dialog = document.querySelector<HTMLDialogElement>("#gallery")!;
  dialog.showModal = () => {
    dialog.open = true;
  };
  dialog.close = () => {
    dialog.open = false;
    dialog.dispatchEvent(new dom.window.Event("close"));
  };
  dialog.getBoundingClientRect = () => new dom.window.DOMRect(20, 30, 400, 300);
  const element = <T extends HTMLElement>(selector: string): T =>
    document.querySelector<T>(selector)!;
  const openers = [
    ...document.querySelectorAll<HTMLAnchorElement>("[data-gallery]"),
  ];
  return { dom, document, dialog, element, openers };
};
