import { TestValidator } from "@nestia/e2e";
import { JSDOM } from "jsdom";

import type { GalleryController } from "../../../../website/src/gallery/GalleryController";
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
 *
 * @evidence contracts/testing.md#behavioral-verification Calls the actual article reader, selection projection and gallery controller, observing secondary-opener identity, exterior/view ordering, active-document URL resolution and restored opener focus; choosing the primary link or retaining an unrelated focus owner fails.
 * @evidence contracts/testing.md#independent-expectations Authored markup supplies distinct primary/capture anchors and relative image paths, and the declared document base independently determines absolute URLs; separate controller facts observe requested focus rather than native browser focus or modal success.
 * @evidence contracts/testing.md#distinguishing-cases Covers an image-free secondary opener, inert-template image adoption, absent tour, empty document and close after opening; malformed markup and collection navigation have separate gallery units.
 * @evidence contracts/testing.md#execution-ownership The synchronous test_website_gallery_secondary_link entry owns resident JSDOM parsing and portable controller effects through an existing owned host fixture; it starts no browser and does not prove navigation, image decoding or native dialog behavior.
 */
export function test_website_gallery_secondary_link(): void {
  const dom: JSDOM = new JSDOM(
    `<article class="building"><a id="primary" href="tour/"><img src="shots/exterior.png" alt="Article preview"></a><a id="capture" data-gallery href="shots/exterior.png">Captures</a><h3>Place</h3><p class="era">Era</p><p class="building-description">Description</p><a class="source-link" href="https://example.org/source">Source</a><template class="building-views"><img src="shots/room.png" alt="Room" data-label="Room"></template></article>`,
    { url: "https://example.org/AutoMovie/" },
  );
  const observed: ReturnType<typeof GalleryUnit.readBuildings> =
    GalleryUnit.readBuildings(dom.window.document);
  TestValidator.predicate(
    "secondary marker owns opener",
    observed[0].opener === dom.window.document.querySelector("#capture") &&
      observed[0].opener !== dom.window.document.querySelector("#primary"),
  );
  TestValidator.equals(
    "capture contains no image",
    observed[0].opener.querySelector("img"),
    null,
  );
  TestValidator.equals(
    "article and inert template retain authored sources",
    observed[0].images.map(
      (image: HTMLImageElement): [string | null, string] => [
        image.getAttribute("src"),
        image.alt,
      ],
    ),
    [
      ["shots/exterior.png", "Article preview"],
      ["shots/room.png", "Room"],
    ],
  );
  const picture: HTMLDivElement = dom.window.document.createElement("div");
  dom.window.document.body.append(picture);
  picture.replaceChildren(
    ...observed[0].images.map(
      (image: HTMLImageElement): Node => image.cloneNode(true),
    ),
  );
  TestValidator.equals(
    "active document resolves adopted image URLs",
    Array.from(
      picture.querySelectorAll<HTMLImageElement>("img"),
      (image: HTMLImageElement): string => image.src,
    ),
    [
      "https://example.org/AutoMovie/shots/exterior.png",
      "https://example.org/AutoMovie/shots/room.png",
    ],
  );
  TestValidator.equals(
    "observed copy and destination",
    [
      observed[0].title,
      observed[0].era,
      observed[0].description,
      observed[0].source,
      observed[0].tour,
    ],
    ["Place", "Era", "Description", "https://example.org/source", null],
  );
  dom.window.document.body.replaceChildren();
  TestValidator.equals(
    "unrelated document is empty",
    GalleryUnit.readBuildings(dom.window.document),
    [],
  );
  const content: ReturnType<typeof createGalleryContent> =
    createGalleryContent().slice(0, 1);
  const { host, facts }: ReturnType<typeof createGalleryHostFacts> =
    createGalleryHostFacts();
  const controller: GalleryController<string> = new GalleryUnit.Controller(
    host,
    [3],
  );
  const capture: string = GalleryUnit.require(
    "secondary-capture-without-image",
    "[data-gallery]",
  );
  controller.open(
    0,
    capture,
    {
      button: 0,
      ctrlKey: false,
      metaKey: false,
      shiftKey: false,
      altKey: false,
    },
    (): void => {},
  );
  TestValidator.predicate("separate capture opens", facts.open);
  const selected: ReturnType<typeof GalleryUnit.selection> =
    GalleryUnit.selection(content, facts.building, facts.view);
  TestValidator.equals(
    "article preview supplies exterior",
    [selected.image.src, selected.image.alt, selected.caption],
    ["https://example.org/AutoMovie/shots/place-1.png", "Place 1", "Exterior"],
  );
  controller.close();
  TestValidator.equals(
    "capture remains original focus owner",
    facts.focused,
    "secondary-capture-without-image",
  );
  controller.dispose();
  dom.window.close();
}
