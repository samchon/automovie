import { TestValidator } from "@nestia/e2e";

import { connectedPanelFixture } from "../internal/connectedPanelFixture";

/**
 * Export captures the committed document at the click, independently of editing.
 *
 * Scenarios:
 * 1. Editing continues while export waits; filename and bytes belong to its input.
 * 2. Error and non-Error export failures retain the document and enable retry.
 * 3. An obsolete failure does not replace the status of a newer committed edit.
 */
export const test_subject_connected_panel_export = async (): Promise<void> => {
  let complete!: (bytes: Uint8Array<ArrayBuffer>) => void;
  let fail!: (reason: unknown) => void;
  const captured: string[] = [];
  const f = connectedPanelFixture({
    export: (document) => {
      captured.push(JSON.stringify(document));
      return new Promise((resolve, reject) => {
        complete = resolve;
        fail = reject;
      });
    },
  });
  await f.panel.ready;
  const original = f.panel.snapshot()!.document;
  const pending = f.click("face-glb");
  TestValidator.equals(
    "export button pending",
    f.element<HTMLButtonElement>("face-glb").disabled,
    true,
  );
  await f.change("control-width", "0.5");
  complete(new Uint8Array([4, 2]));
  await pending;
  TestValidator.equals(
    "captured immutable input",
    JSON.parse(captured[0]),
    original,
  );
  TestValidator.equals(
    "captured filename",
    f.downloads[0].name,
    original.id + ".glb",
  );
  TestValidator.equals(
    "captured bytes",
    f.downloads[0].bytes,
    new Uint8Array([4, 2]),
  );
  for (const error of [new Error("encode failed"), "write failed"]) {
    const before = f.panel.snapshot()!.document;
    const rejected = f.click("face-glb");
    fail(error);
    await rejected;
    TestValidator.equals(
      "export leaves state",
      f.panel.snapshot()!.document,
      before,
    );
    TestValidator.equals(
      "retry enabled",
      f.element<HTMLButtonElement>("face-glb").disabled,
      false,
    );
    TestValidator.equals(
      "failure reported",
      f.element("face-status").textContent,
      error instanceof Error ? error.message : error,
    );
  }
  const stale = f.click("face-glb");
  await f.change("control-width", "-0.5");
  fail(new Error("obsolete failure"));
  await stale;
  TestValidator.equals(
    "newer status retained",
    f.element("face-status").dataset.state,
    "ready",
  );
  f.dom.window.close();
};
