import { TestValidator } from "@nestia/e2e";

import { createHumanViewerGeneration } from "../../../scripts/human-viewer/createHumanViewerGeneration";
import type { HumanViewerHandle } from "../../../scripts/human-viewer/HumanViewerHandle";
import { parseHumanViewerAddress } from "../../../scripts/human-viewer/parseHumanViewerAddress";
import { rejectsWith } from "../internal/rejectsWith";

/**
 * Retiring a frame releases captures waiting for its numerical worker.
 *
 * Scenarios:
 * 1. Retirement rejects all pending shows, including the server's queue task;
 *    later old completion cannot authorize a frame, and new shows refuse.
 * 2. A successful, asynchronously failed or synchronously failed show settles
 *    independently while observation methods retain their original generation.
 * 3. A fresh generation works after the old one retires; retiring an idle
 *    generation is safe and does not alter another owner's handle.
 */
export const test_human_viewer_generation = async (): Promise<void> => {
  const address = parseHumanViewerAddress("doc=neutral");
  const pending: (() => void)[] = [];
  const viewer: HumanViewerHandle = {
    show: () => new Promise((resolve) => { pending.push(resolve); }),
    parts: () => ["head"], renderer: () => "hardware", revision: () => "old",
    builds: () => 2, buildMs: () => 3, address: () => address, png: () => "frame",
  };
  const old = createHumanViewerGeneration(viewer);
  const one = old.handle.show(address);
  const two = old.handle.show(address);
  const firstRefusal = rejectsWith(() => one, "source generation was replaced");
  const secondRefusal = rejectsWith(() => two, "source generation was replaced");
  const released: string[] = [];
  const observed = [one, two].map((show) => show.catch((error: unknown) => {
    released.push(String(error));
  }));
  old.retire();
  await Promise.resolve();
  const beforeDisposal = released.length;
  pending.forEach((resolve) => resolve());
  await Promise.all(observed);
  TestValidator.equals("retirement releases captures before producer disposal", beforeDisposal, 2);
  TestValidator.predicate("all old captures released", await firstRefusal && await secondRefusal);
  TestValidator.predicate("retired refuses new show", await rejectsWith(
    () => old.handle.show(address), "source generation was replaced"));
  TestValidator.equals("stable observation identity", [old.handle.parts(),
    old.handle.renderer(), old.handle.revision(), old.handle.builds(),
    old.handle.buildMs(), old.handle.png()],
    [["head"], "hardware", "old", 2, 3, "frame"]);
  TestValidator.predicate("caller address identity", old.handle.address() === address);
  const fresh = createHumanViewerGeneration({ ...viewer,
    revision: () => "new", show: () => Promise.resolve() });
  await fresh.handle.show(address);
  TestValidator.equals("fresh generation", fresh.handle.revision(), "new");
  fresh.retire();
  fresh.retire();
  const asyncFailure = createHumanViewerGeneration({ ...viewer,
    show: () => Promise.reject(new Error("worker failed")) });
  TestValidator.predicate("worker failure", await rejectsWith(
    () => asyncFailure.handle.show(address), "worker failed"));
  asyncFailure.retire();
  const syncFailure = createHumanViewerGeneration({ ...viewer,
    show: () => { throw new Error("transport failed"); } });
  TestValidator.predicate("transport failure", await rejectsWith(
    () => syncFailure.handle.show(address), "transport failed"));
  syncFailure.retire();
};
