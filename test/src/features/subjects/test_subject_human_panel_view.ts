import { TestValidator } from "@nestia/e2e";

import { createHumanPanelFixture } from "../internal/createHumanPanelFixture";

/**
 * The panel routes view-only controls and committed file downloads without changing identity.
 *
 * Scenarios:
 * 1. An omitted appearance palette still exposes the version-default skin channels.
 * 2. Camera, fit, clay and shadow controls reach viewport ports without editing the document.
 */
export const test_subject_human_panel_view = async (): Promise<void> => {
  const f = createHumanPanelFixture();
  await f.panel.ready;
  const before = f.panel.snapshot()!.document;
  TestValidator.predicate(
    "default skin control exists",
    f.element("material-skin-r") !== null,
  );
  TestValidator.predicate(
    "source omission is explicit",
    f.element("source-note").textContent!.includes("No source provenance"),
  );
  const view = f.app.querySelector<HTMLButtonElement>('[data-view="45"]')!;
  view.onclick!.call(view, f.clickEvent());
  await f.click("fit-view");
  const clay = f.element<HTMLInputElement>("clay");
  clay.checked = true;
  clay.onchange!.call(clay, new f.dom.window.Event("change"));
  const shadows = f.element<HTMLInputElement>("shadows");
  TestValidator.equals("cast shadows initially visible", shadows.checked, true);
  shadows.checked = false;
  shadows.onchange!.call(shadows, new f.dom.window.Event("change"));
  shadows.checked = true;
  shadows.onchange!.call(shadows, new f.dom.window.Event("change"));
  TestValidator.equals("shadow isolation routed", f.shadows, [false, true]);
  clay.checked = false;
  clay.onchange!.call(clay, new f.dom.window.Event("change"));
  TestValidator.equals(
    "camera and clay routed",
    [f.views, f.clays, f.fits()],
    [[45], [true, false], 2],
  );
  TestValidator.equals(
    "view controls preserve document",
    f.panel.snapshot()!.document,
    before,
  );
  f.dom.window.close();
};
