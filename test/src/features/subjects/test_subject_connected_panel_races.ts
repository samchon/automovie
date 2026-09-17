import { TestValidator } from "@nestia/e2e";

import {
  connectedPanelFixture,
  connectedPanelModel,
} from "../internal/connectedPanelFixture";

/**
 * The newest user action owns publication while older IO may still finish.
 *
 * Scenarios:
 * 1. A newer edit withdraws a pending successful or failed file read.
 * 2. Out-of-order builds and history completions cannot replace the latest state.
 * 3. Initial build failure leaves editing disabled and no committed snapshot.
 */
export const test_subject_connected_panel_races = async (): Promise<void> => {
  const f = connectedPanelFixture();
  await f.panel.ready;
  for (const fail of [false, true]) {
    let complete!: (text: string) => void, failRead!: (cause: unknown) => void;
    const waiting = new Promise<string>((resolve, reject) => {
      complete = resolve;
      failRead = reject;
    });
    const loading = f.file(() => waiting);
    await f.change("control-width", "0.2");
    if (fail) failRead(new Error("obsolete read"));
    else complete(JSON.stringify({ ...f.document, name: "Obsolete" }));
    await loading;
    TestValidator.equals(
      "stale read cannot publish",
      f.panel.snapshot()!.document.shape,
      { width: 0.2 },
    );
    TestValidator.equals(
      "stale failure cannot report",
      f.element("face-status").dataset.state,
      "ready",
    );
  }
  f.dom.window.close();
  const pending: (() => void)[] = [];
  let requests = 0;
  const raced = connectedPanelFixture({
    build: async (document) => {
      if (++requests > 1)
        await new Promise<boolean>((resolve) => {
          pending.push(() => resolve(true));
        });
      return connectedPanelModel(document);
    },
  });
  await raced.panel.ready;
  const old = raced.change("control-width", "0.2");
  const latest = raced.change("control-width", "0.4");
  pending[1]();
  await latest;
  pending[0]();
  await old;
  TestValidator.equals(
    "latest build wins",
    raced.panel.snapshot()!.document.shape,
    { width: 0.4 },
  );
  const history = raced.click("face-undo");
  const edit = raced.change("control-width", "0.6");
  pending[3]();
  await edit;
  pending[2]();
  await history;
  TestValidator.equals(
    "stale history cannot publish",
    raced.panel.snapshot()!.document.shape,
    { width: 0.6 },
  );
  raced.dom.window.close();
  const failed = connectedPanelFixture({
    build: async () => {
      throw new Error("initial build");
    },
  });
  await failed.panel.ready;
  TestValidator.equals(
    "failed initial snapshot",
    failed.panel.snapshot(),
    undefined,
  );
  TestValidator.equals(
    "failed editing disabled",
    failed.element<HTMLFieldSetElement>("editing").disabled,
    true,
  );
  TestValidator.equals(
    "initial error visible",
    failed.element("face-status").textContent,
    "initial build",
  );
  failed.dom.window.close();
};
