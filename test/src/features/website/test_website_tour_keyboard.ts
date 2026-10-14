import { mountTourUi } from "@automovie/website/tour-ui";
import { TestValidator } from "@nestia/e2e";

import { throwsError } from "../internal/predicates";
import { tourFixture } from "../internal/websiteTourFixture";

/**
 * View navigation exposes the shared flight instructions and requires its host controls.
 * Scenarios:
 * 1. The canvas describes keyboard flight and the desktop panel collapses.
 * 2. A missing search input refuses mounting with its required-control diagnostic.
 *
 * @evidence contracts/testing.md#behavioral-verification Mounts the tour navigator on resident DOM and observes flight accessibility instructions, panel collapse and a missing-search refusal; an inaccessible canvas, inert toggle or silently accepted missing control fails.
 * @evidence contracts/testing.md#independent-expectations The supplied canvas/panel/search controls define the host boundary, the public Shift instruction fixes the accessibility fragment, and removal of the search input independently establishes the required-control failure.
 * @evidence contracts/testing.md#distinguishing-cases Covers an initially expanded panel toggled closed and a subsequent mount without its required search input; view selection, search results and successful cleanup are observed in the navigation unit, while pre-return listener absence is not measured here.
 * @evidence contracts/testing.md#execution-ownership The synchronous test_website_tour_keyboard entry owns JSDOM mounting and actual button-event dispatch through existing fixtures, replacing no foreign methods and starting no browser; native accessibility presentation remains unobserved.
 */
export function test_website_tour_keyboard(): void {
  const f: ReturnType<typeof tourFixture> = tourFixture();
  const ui: ReturnType<typeof mountTourUi> = mountTourUi(f.document, f.data, {
    collapsed: false,
    select: (): void => {},
  });
  TestValidator.predicate(
    "canvas describes slow movement",
    f
      .element("#view")
      .getAttribute("aria-label")!
      .includes("Shift moves slowly"),
  );
  f.element<HTMLButtonElement>("#panel-toggle").click();
  TestValidator.predicate(
    "desktop panel collapses",
    f.element("#tour-panel").hidden === true,
  );
  ui.dispose();
  f.element("#view-search").remove();
  TestValidator.predicate(
    "required page boundary",
    throwsError(
      (): ReturnType<typeof mountTourUi> =>
        mountTourUi(f.document, f.data, {
          collapsed: false,
          select: (): void => {},
        }),
      "Missing tour control: #view-search",
    ),
  );
  f.dom.window.close();
}
