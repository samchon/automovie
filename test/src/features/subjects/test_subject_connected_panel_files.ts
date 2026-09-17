import { TestValidator } from "@nestia/e2e";

import { connectedPanelFixture } from "../internal/connectedPanelFixture";

/**
 * File and text admission never replaces the last valid face on refusal.
 *
 * Scenarios:
 * 1. Valid file/text edits and downloads preserve exact numerical state and bytes.
 * 2. Empty scalars, invalid ranges, malformed JSON and read failures retain state.
 * 3. Missing file selection is inert and the load button opens the picker.
 */
export const test_subject_connected_panel_files = async (): Promise<void> => {
  const f = connectedPanelFixture();
  await f.panel.ready;
  await f.file();
  const next = { ...f.document, name: "Loaded", shape: { width: -0.5 } };
  await f.file(async () => JSON.stringify(next));
  TestValidator.equals("file committed", f.panel.snapshot()!.document, next);
  await f.click("face-save");
  await f.click("face-glb");
  TestValidator.equals(
    "saved numerical state",
    JSON.parse(f.downloads[0].bytes as string),
    next,
  );
  TestValidator.equals(
    "saved GLB bytes",
    f.downloads[1].bytes,
    new Uint8Array([1, 3, 5]),
  );
  await f.change("control-width", "");
  TestValidator.equals(
    "blank scalar refusal",
    f.element("face-status").dataset.state,
    "error",
  );
  await f.change("control-width", "2");
  TestValidator.equals(
    "range refusal keeps state",
    f.panel.snapshot()!.document,
    next,
  );
  const text = f.element<HTMLTextAreaElement>("document-json");
  text.value = "{";
  await f.click("document-apply");
  TestValidator.equals(
    "JSON refusal keeps state",
    f.panel.snapshot()!.document,
    next,
  );
  await f.file(async () => {
    throw new Error("read error");
  });
  TestValidator.equals(
    "Error read cause",
    f.element("face-status").textContent,
    "read error",
  );
  text.value = JSON.stringify(f.document);
  await f.click("document-apply");
  TestValidator.equals(
    "text recovery",
    f.panel.snapshot()!.document,
    f.document,
  );
  let picks = 0;
  f.element("face-file").addEventListener("click", () => {
    ++picks;
  });
  await f.click("face-load");
  TestValidator.equals("native picker action", picks, 1);
  f.dom.window.close();
};
