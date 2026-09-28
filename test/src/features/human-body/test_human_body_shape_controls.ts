import type { IAutoMovieHumanBodyChannelScale } from "@automovie/human";
import { renderBodyShapeControls } from "@automovie/playground/src/human/bodyShapeControls";
import { TestValidator } from "@nestia/e2e";
import { JSDOM } from "jsdom";

import { humanBodyBasisFixture } from "../internal/humanBodyBasisFixture";

/**
 * A shape row displays the supplied measured scale and edits the current
 * document, including its zero and invalid-entry boundaries.
 *
 * Scenarios:
 * 1. Group and search select the measured width, showing an unavailable end.
 * 2. Slider preview, nonzero edit, zero removal and blank refusal use the
 *    current document instead of a stale render-time snapshot.
 * 3. A nonnegative unmeasured channel shows geometric movement, while an
 *    unmatched search creates no row.
 */
export const test_human_body_shape_controls = (): void => {
  const { basis, document: initial } = humanBodyBasisFixture();
  const dom = new JSDOM("<!doctype html><main id='app'></main>").window
    .document;
  const container = dom.querySelector<HTMLElement>("#app")!;
  const scales = new Map<string, IAutoMovieHumanBodyChannelScale>([
    [
      "width",
      {
        id: "width",
        group: "torso",
        positive: { displacement: 0.01, peak: 0.02, vertices: 8 },
        negative: { displacement: 0.005, peak: 0.01, vertices: 8 },
        measurement: {
          id: "measure-width",
          kind: "breadth",
          neutral: 0.2,
          positive: 0.3,
          negative: null,
        },
      },
    ],
    [
      "tall",
      {
        id: "tall",
        group: "macro",
        positive: { displacement: 0.1, peak: 0.5, vertices: 4 },
        negative: null,
        measurement: null,
      },
    ],
    [
      "sideLeft",
      {
        id: "sideLeft",
        group: "arms",
        positive: { displacement: 0.01, peak: 0.02, vertices: 1 },
        negative: null,
        measurement: {
          id: "measure-side",
          kind: "distance",
          neutral: 0.1,
          positive: 0.2,
          negative: null,
        },
      },
    ],
  ]);
  let current = initial;
  const refused: unknown[] = [];
  const render = (kind: string, query: string): void => {
    container.replaceChildren();
    renderBodyShapeControls({
      dom,
      container,
      basis,
      scales,
      kind,
      query,
      current: () => current,
      change: (next) => {
        current = next;
      },
      refuse: (error) => refused.push(error),
    });
  };
  render("torso", "wid");
  TestValidator.predicate(
    "measured width with unavailable negative end",
    container.querySelectorAll(".row").length === 1 &&
      container.querySelector("#scale-width")?.textContent ===
        "breadth measure-width: neutral 200.0 mm · +1 → 300.0 mm · -1 → n/a",
  );
  scales.get("width")!.measurement!.negative = 0.15;
  render("torso", "wid");
  TestValidator.equals(
    "measured negative endpoint is shown",
    container.querySelector("#scale-width")?.textContent,
    "breadth measure-width: neutral 200.0 mm · +1 → 300.0 mm · -1 → 150.0 mm",
  );
  const number = container.querySelector<HTMLInputElement>("#control-width")!;
  const slider = container.querySelector<HTMLInputElement>(
    "#control-width-slider",
  )!;
  slider.value = "0.5";
  slider.dispatchEvent(new dom.defaultView!.Event("input"));
  TestValidator.equals("slider previews its value", number.value, "0.5");
  current = { ...current, name: "A newer draft" };
  slider.dispatchEvent(new dom.defaultView!.Event("change"));
  TestValidator.equals(
    "edit reads the latest document",
    [current.name, current.shape.width],
    ["A newer draft", 0.5],
  );
  number.value = "0";
  number.dispatchEvent(new dom.defaultView!.Event("change"));
  TestValidator.equals("zero removes the row", current.shape.width, undefined);
  number.value = "";
  number.dispatchEvent(new dom.defaultView!.Event("change"));
  TestValidator.equals("blank input refuses", refused, ["A numeric value is required."]);
  render("macro", "");
  TestValidator.predicate(
    "unmeasured positive-only channel describes its displacement",
    container.querySelector("#scale-tall")?.textContent ===
      "+1 moves 100.0 mm rms, 500.0 mm peak on 4 vertices",
  );
  render("arms", "sideleft");
  TestValidator.equals(
    "a positive-only measured channel omits the negative endpoint",
    container.querySelector("#scale-sideLeft")?.textContent,
    "distance measure-side: neutral 100.0 mm · +1 → 200.0 mm",
  );
  render("torso", "missing");
  TestValidator.equals("unmatched search has no row", container.children.length, 0);
};
