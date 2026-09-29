import { mountTourUi } from "@automovie/website/tour-ui";
import { TestValidator } from "@nestia/e2e";

import { throwsError } from "../internal/predicates";
import { tourFixture } from "../internal/websiteTourFixture";

/**
 * View navigation exposes the shared flight instructions and requires its host controls.
 * Scenarios:
 * 1. The canvas describes keyboard flight and the desktop panel collapses.
 * 2. A missing search input refuses mounting before listeners are installed.
 */
export const test_website_tour_keyboard = (): void => {
  const f = tourFixture();
  const ui = mountTourUi(f.document, f.data, {
    collapsed: false,
    select: () => {},
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
    throwsError(() =>
      mountTourUi(f.document, f.data, {
        collapsed: false,
        select: () => {},
      }),
    ),
  );
  f.dom.window.close();
};
