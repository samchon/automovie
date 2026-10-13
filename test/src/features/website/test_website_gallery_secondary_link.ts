import { TestValidator } from "@nestia/e2e";
import { JSDOM } from "jsdom";

import { GalleryUnit } from "../internal/GalleryUnit";
import { createGalleryContent } from "../internal/createGalleryContent";
import { createGalleryHostFacts } from "../internal/createGalleryHostFacts";

/**
 * The supplied capture opener is independent of the article's exterior image.
 * The actual content reader observes unmodified DOM markup; native navigation
 * and dialog effects remain browser observations rather than replaced methods.
 *
 * Scenarios:
 * 1. Actual marked markup selects the secondary opener and article image, never the primary link.
 * 2. Authored image attributes retain their source paths; actual clones adopted by the active document resolve both URLs.
 * 3. A separate capture identifier needs no image data and remains focus owner after closure.
 */
export const test_website_gallery_secondary_link = (): void => {
  const dom = new JSDOM(`<article class="building"><a id="primary" href="tour/"><img src="shots/exterior.png" alt="Article preview"></a><a id="capture" data-gallery href="shots/exterior.png">Captures</a><h3>Place</h3><p class="era">Era</p><p class="building-description">Description</p><a class="source-link" href="https://example.org/source">Source</a><template class="building-views"><img src="shots/room.png" alt="Room" data-label="Room"></template></article>`, { url: "https://example.org/AutoMovie/" });
  const observed = GalleryUnit.readBuildings(dom.window.document);
  TestValidator.predicate("secondary marker owns opener", observed[0].opener === dom.window.document.querySelector("#capture") && observed[0].opener !== dom.window.document.querySelector("#primary"));
  TestValidator.equals("capture contains no image", observed[0].opener.querySelector("img"), null);
  TestValidator.equals("article and inert template retain authored sources", observed[0].images.map((image) => [image.getAttribute("src"), image.alt]), [["shots/exterior.png", "Article preview"], ["shots/room.png", "Room"]]);
  const picture = dom.window.document.createElement("div");
  dom.window.document.body.append(picture);
  picture.replaceChildren(...observed[0].images.map((image) => image.cloneNode(true)));
  TestValidator.equals("active document resolves adopted image URLs", Array.from(picture.querySelectorAll<HTMLImageElement>("img"), (image) => image.src), ["https://example.org/AutoMovie/shots/exterior.png", "https://example.org/AutoMovie/shots/room.png"]);
  TestValidator.equals("observed copy and destination", [observed[0].title, observed[0].era, observed[0].description, observed[0].source, observed[0].tour], ["Place", "Era", "Description", "https://example.org/source", null]);
  dom.window.document.body.replaceChildren();
  TestValidator.equals("unrelated document is empty", GalleryUnit.readBuildings(dom.window.document), []);
  const content = createGalleryContent().slice(0, 1);
  const { host, facts } = createGalleryHostFacts();
  const controller = new GalleryUnit.Controller(host, [3]);
  const capture = GalleryUnit.require("secondary-capture-without-image", "[data-gallery]");
  controller.open(0, capture, { button: 0, ctrlKey: false, metaKey: false, shiftKey: false, altKey: false }, () => {});
  TestValidator.predicate("separate capture opens", facts.open);
  const selected = GalleryUnit.selection(content, facts.building, facts.view);
  TestValidator.equals("article preview supplies exterior", [selected.image.src, selected.image.alt, selected.caption], ["https://example.org/AutoMovie/shots/place-1.png", "Place 1", "Exterior"]);
  controller.close();
  TestValidator.equals("capture remains original focus owner", facts.focused, "secondary-capture-without-image");
  controller.dispose();
  dom.window.close();
};
