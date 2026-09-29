import { mountTourUi } from "@automovie/website/tour-ui";
import { TestValidator } from "@nestia/e2e";

import { tourFixture } from "../internal/websiteTourFixture";

/**
 * View navigation uses source identities, restores the exterior and filters by room.
 * Scenarios:
 * 1. Buttons apply their stable ids and highlight their current authored view.
 * 2. Search narrows by case-insensitive name and reports an empty result.
 * 3. A mobile panel opens on request and disposal removes all callbacks.
 */
export const test_website_tour_navigation = (): void => {
  const f = tourFixture(),
    calls: string[] = [];
  const ui = mountTourUi(f.document, f.data, {
    collapsed: true,
    select: (id) => calls.push(id),
  });
  TestValidator.predicate(
    "mobile canvas stays open",
    f.element("#tour-panel").hidden === true,
  );
  f.element<HTMLButtonElement>("#panel-toggle").click();
  TestValidator.equals(
    "panel expanded",
    f.element("#panel-toggle").getAttribute("aria-expanded"),
    "true",
  );
  f.element<HTMLButtonElement>(".view-option:nth-child(2)").click();
  ui.highlight("room");
  TestValidator.equals(
    "stable room selection",
    [
      calls,
      f.element("#current-view").textContent,
      f.element(".view-option:nth-child(2)").getAttribute("aria-current"),
    ],
    [["room"], "Inside / Reading room", "true"],
  );
  const search = f.element<HTMLInputElement>("#view-search");
  search.value = "  READING ";
  search.dispatchEvent(new f.dom.window.Event("input"));
  TestValidator.predicate(
    "room filter",
    f.element(".view-option").hidden &&
      !f.element(".view-option:nth-child(2)").hidden,
  );
  search.value = "missing";
  search.dispatchEvent(new f.dom.window.Event("input"));
  TestValidator.predicate(
    "empty filter explained",
    f.element("#view-count").textContent!.includes("No matching"),
  );
  search.value = "";
  search.dispatchEvent(new f.dom.window.Event("input"));
  TestValidator.equals(
    "empty search restores views",
    f.element("#view-count").textContent,
    "2 authored views",
  );
  f.element<HTMLButtonElement>("#reset").click();
  TestValidator.equals("reset restores exterior", calls, ["room", "outside"]);
  const count = calls.length;
  ui.dispose();
  f.element<HTMLButtonElement>("#reset").click();
  TestValidator.equals("callbacks disposed", calls.length, count);
  TestValidator.equals(
    "view nodes removed",
    f.element("#view-list").children.length,
    0,
  );
  f.dom.window.close();
};
