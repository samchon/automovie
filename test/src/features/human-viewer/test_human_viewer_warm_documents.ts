import { TestValidator } from "@nestia/e2e";

import { warmHumanViewerDocuments } from "../../../scripts/human-viewer/warmHumanViewerDocuments";

/**
 * Background warm work yields between documents and respects generation changes.
 *
 * Scenarios:
 * 1. Cached documents need no capture; errors do not hide later missing items.
 * 2. Source revision changes or a replacement warm pass withdraw remaining work.
 * 3. An empty catalogue completes with zero counters and no current item.
 */
export const test_human_viewer_warm_documents = async (): Promise<void> => {
  const status = { revision: "", total: 0, done: 0, skipped: 0, current: null as string | null };
  const captured: string[] = [];
  const queued: string[] = [];
  const props = {
    revision: "first", documents: [{ id: "cached" }, { id: "bad" }, { id: "next" }],
    currentRevision: () => "first",
    cached: (id: string) => id === "cached",
    capture: async (id: string): Promise<void> => {
      captured.push(id);
      if (id === "bad") throw new Error("unavailable document");
    },
    queue: async (id: string, capture: () => Promise<void>): Promise<void> => {
      queued.push(id);
      await capture();
    }, status,
  };
  await warmHumanViewerDocuments(props);
  TestValidator.equals("only missing entries", queued, ["bad", "next"]);
  TestValidator.equals("captures", captured, ["bad", "next"]);
  TestValidator.equals("complete counts", status, {
    revision: "first", total: 3, done: 2, skipped: 1, current: null,
  });
  queued.length = 0;
  await warmHumanViewerDocuments({ ...props, currentRevision: () => "new-source" });
  TestValidator.equals("new source withdraws", queued, []);
  await warmHumanViewerDocuments({ ...props, queue: async (id, capture) => {
    queued.push(id);
    status.revision = "replacement";
    await capture();
  } });
  TestValidator.equals("new pass withdraws next item", queued, ["bad"]);
  TestValidator.equals("old failure does not increment replacement counters", status.skipped, 0);
  await warmHumanViewerDocuments({ ...props, documents: [] });
  TestValidator.equals("empty", status, {
    revision: "first", total: 0, done: 0, skipped: 0, current: null,
  });
};
