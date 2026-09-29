import {
  admitHumanBodyBasisDocument,
  parseHumanBodyBasisDocument,
  serializeHumanBodyBasisDocument,
} from "@automovie/human";
import { renderBodyHumeralHeadControls } from "@automovie/playground/src/human/bodyHumeralHeadControls";
import { TestValidator } from "@nestia/e2e";
import { JSDOM } from "jsdom";

import { humanBodyBasisFixture } from "../internal/humanBodyBasisFixture";
import { throwsError } from "../internal/predicates";

/**
 * Articular dimensions remain named millimetre measurements in UI and replay.
 *
 * Scenarios:
 * 1. Independent left and right millimetre edits survive document replay;
 *    blank removes one override and finally both.
 * 2. A pose refresh preserves an unapplied input, while a refused edit
 *    restores the last committed radius.
 * 3. Zero, negative and nonfinite document values are refused.
 */
export const test_human_body_humeral_head_controls = (): void => {
  const { document: initial } = humanBodyBasisFixture();
  const dom = new JSDOM("<!doctype html><main id='controls'></main>").window.document;
  let current = initial;
  const refused: string[] = [];
  const controls = renderBodyHumeralHeadControls({
    dom,
    container: dom.querySelector<HTMLElement>("#controls")!,
    current: () => current,
    onChange: (next) => { current = next; },
    onRefuse: (error) => { refused.push(error.message); },
  });
  const left = dom.querySelector<HTMLInputElement>("#humeral-head-left")!;
  const right = dom.querySelector<HTMLInputElement>("#humeral-head-right")!;
  const buttons = [...dom.querySelectorAll<HTMLButtonElement>("button")];
  controls.refresh(current.humeralHeads);
  TestValidator.equals("no measurement starts blank", [left.value, right.value], ["", ""]);
  left.value = "24.5";
  buttons[0].click();
  TestValidator.equals("left observed radius enters document", current.humeralHeads, { leftRadiusMillimetres: 24.5 });
  controls.refresh(current.humeralHeads);
  right.value = "25";
  buttons[1].click();
  TestValidator.equals("right radius retains independent left", current.humeralHeads, { leftRadiusMillimetres: 24.5, rightRadiusMillimetres: 25 });
  controls.refresh(current.humeralHeads);
  left.value = "24.2";
  controls.refresh(current.humeralHeads);
  TestValidator.equals("pose-only refresh preserves unapplied number", left.value, "24.2");
  controls.refresh(current.humeralHeads, true);
  TestValidator.equals("failed edit resets to committed number", left.value, "24.5");
  left.value = "";
  buttons[0].click();
  TestValidator.equals("blank removes only left measurement", current.humeralHeads, { rightRadiusMillimetres: 25 });
  right.value = "";
  buttons[1].click();
  TestValidator.equals("both blank omit direct measurements", current.humeralHeads, undefined);
  left.value = "-1";
  buttons[0].click();
  TestValidator.predicate("invalid radius refuses without edit", refused.length === 1 && current.humeralHeads === undefined);
  current.humeralHeads = { rightRadiusMillimetres: 26 };
  TestValidator.equals("round trip measured radius", parseHumanBodyBasisDocument(serializeHumanBodyBasisDocument(current)).humeralHeads, current.humeralHeads);
  for (const radius of [0, -1, NaN, Infinity])
    TestValidator.predicate("invalid document radius refuses " + radius, throwsError(() => admitHumanBodyBasisDocument({ ...current, humeralHeads: { rightRadiusMillimetres: radius } })));
};
