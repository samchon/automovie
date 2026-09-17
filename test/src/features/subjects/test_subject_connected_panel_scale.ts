import { TestValidator } from "@nestia/e2e";

import { connectedPanelFixture } from "../internal/connectedPanelFixture";

/**
 * Every connected control states the metric effect of its own endpoints.
 *
 * A basis weight is dimensionless, so the editing screen owes the author the
 * distance one unit actually moves. The analytic basis makes that distance hand
 * checkable: over its seven vertices `wide` gives sqrt(0.5/7) m rms with a 0.5 m
 * peak, `narrow` sqrt(0.125/7) m with 0.25 m, and `raised` sqrt(1.25/7) m with
 * 1 m across both surfaces. Expected strings are those figures in millimetres,
 * not a copy of what the panel currently prints.
 *
 * Scenarios:
 * 1. A signed shape control prints both endpoint scales, separated.
 * 2. A nonnegative expression control prints only its positive endpoint.
 * 3. The note survives a control-group switch and a committed edit, since it describes the basis rather than the draft.
 */
export const test_subject_connected_panel_scale = async (): Promise<void> => {
  const f = connectedPanelFixture();
  await f.panel.ready;
  const shape = "+1 moves 267.26 mm rms, 500.00 mm peak on 2 vertices";
  TestValidator.equals(
    "signed shape control states both endpoints",
    f.element("scale-width").textContent,
    shape + " · -1 moves 133.63 mm rms, 250.00 mm peak on 2 vertices",
  );
  await f.change("control-kind", "expression");
  TestValidator.equals(
    "nonnegative control states one endpoint",
    f.element("scale-lift").textContent,
    "+1 moves 422.58 mm rms, 1000.00 mm peak on 2 vertices",
  );
  await f.change("control-lift", "0.5");
  TestValidator.equals(
    "an edit does not change the basis scale",
    f.element("scale-lift").textContent,
    "+1 moves 422.58 mm rms, 1000.00 mm peak on 2 vertices",
  );
  await f.change("control-kind", "shape");
  TestValidator.equals(
    "returning to shape restores its note",
    f.element("scale-width").textContent?.startsWith(shape),
    true,
  );
  f.dom.window.close();
};
