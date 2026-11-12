import {
  type IAutoMovieInspectionHandle,
  applyAutoMovieInspection,
} from "@automovie/render";
import { TestValidator } from "@nestia/e2e";
import * as THREE from "three";

import { InspectionScene } from "../internal/InspectionScene";

/**
 * A mark whose anchor object the request hides, or whose anchor is invisible, is not drawn, while a mark whose own path is selected keeps its anchor's visibility out of `parts`.
 *
 * Scenarios:
 *
 * 1. A contact mark at `probe/contact` anchored to `hero` is drawn and selected when nothing is hidden.
 * 2. With `hide` naming `hero`, the mark is neither drawn nor selected, although its own path is not under `hero`.
 * 3. With `hide` naming a sibling quad instead, the mark is drawn again.
 * 4. With `hero` made invisible, the mark is not drawn.
 * 5. With `parts` naming only the mark's path, the mark is drawn although its anchor is not selected and is taken off every layer.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Applies the public inspection under five requests and anchor states and reads the line objects it added, `selected`, and the anchor's layer mask.
 * @evidence contracts/development/testing.md#independent-expectations The expected visibility follows from the documented selection rule: a mark is left out when its anchor is invisible or matched by `hide`, and `parts` decides by the mark's own path.
 * @evidence contracts/development/testing.md#distinguishing-cases Contrasts hiding the anchor against hiding a sibling, a visible anchor against an invisible one, and `hide` against `parts`. Following a moving anchor belongs to `test_inspection_mark_anchor`.
 * @evidence contracts/development/testing.md#execution-ownership This named portable unit builds its own scene and marks and starts no browser, server or GPU.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 5 numbered scenarios it runs, each sentence naming the input and the behavior it pins (first: A contact mark at probe/contact anchored to hero is drawn and selected when nothing is hidden).
 */
export function test_inspection_mark_anchor_hidden(): void {
  const hero: THREE.Mesh = InspectionScene.quad("hero");
  const stage: THREE.Scene = InspectionScene.scene(
    hero,
    InspectionScene.quad("prop", 4),
  );
  const marks = [
    InspectionScene.mark(
      "probe/contact",
      "contact",
      0x00c2a8,
      { type: "points", points: [0, 0, 0] },
      { anchor: "hero" },
    ),
  ];
  const drawn = (
    changes: Parameters<typeof InspectionScene.ask>[0],
  ): { drawn: number; selected: string[]; heroMask: number } => {
    const handle: IAutoMovieInspectionHandle = applyAutoMovieInspection({
      scene: stage,
      request: InspectionScene.ask({ marks: ["contact"], ...changes }),
      marks,
    });
    const out: { drawn: number; selected: string[]; heroMask: number } = {
      drawn: InspectionScene.dots(stage).length,
      selected: [...handle.selected],
      heroMask: hero.layers.mask,
    };
    handle.restore();
    return out;
  };

  // 1. Nothing hidden.
  TestValidator.equals("the mark is drawn", drawn({}), {
    drawn: 1,
    selected: ["hero", "prop", "probe/contact"],
    heroMask: 1,
  });

  // 2. The anchor hidden.
  TestValidator.equals(
    "hiding the anchor hides the mark",
    drawn({ hide: ["hero"] }),
    {
      drawn: 0,
      selected: ["prop"],
      heroMask: 0,
    },
  );

  // 3. A sibling hidden.
  TestValidator.equals(
    "hiding a sibling leaves the mark",
    drawn({ hide: ["prop"] }),
    {
      drawn: 1,
      selected: ["hero", "probe/contact"],
      heroMask: 1,
    },
  );

  // 4. An invisible anchor.
  hero.visible = false;
  TestValidator.equals(
    "an invisible anchor hides the mark",
    drawn({}).drawn,
    0,
  );
  hero.visible = true;

  // 5. Parts naming the mark alone.
  TestValidator.equals(
    "parts naming the mark draws it without its anchor",
    drawn({ parts: ["probe/contact"] }),
    { drawn: 1, selected: ["probe/contact"], heroMask: 0 },
  );
}
