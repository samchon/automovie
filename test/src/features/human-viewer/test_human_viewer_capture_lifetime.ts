import { TestValidator } from "@nestia/e2e";

import { createHumanViewerCaptureLifetime } from "../../../scripts/human-viewer/createHumanViewerCaptureLifetime";
import { rejectsWith } from "../internal/rejectsWith";

/**
 * Browser transport loss releases capture ownership without an elapsed-time policy.
 *
 * Scenarios:
 * 1. Successful and failed operations settle independently on a live transport.
 * 2. Failure rejects an outstanding operation before its producer replies and
 *    rejects future work without calling that producer.
 * 3. Failure before the first operation microtask prevents dispatch entirely.
 */
export const test_human_viewer_capture_lifetime = async (): Promise<void> => {
  const live = createHumanViewerCaptureLifetime();
  TestValidator.equals("success", await live.run(() => Promise.resolve(7)), 7);
  TestValidator.predicate("ordinary rejection", await rejectsWith(
    () => live.run(() => Promise.reject(new Error("ordinary"))), "ordinary"));
  let finish: (value: number) => void = () => {};
  let rejected = false;
  const pending = live.run(() => new Promise<number>((resolve) => { finish = resolve; }));
  const observed = pending.catch(() => { rejected = true; });
  await Promise.resolve();
  live.fail(new Error("page crashed"));
  await Promise.resolve();
  await Promise.resolve();
  const beforeReply = rejected;
  finish(9);
  await observed;
  TestValidator.predicate("capture released before reply", beforeReply);
  let called = false;
  TestValidator.predicate("future request refuses", await rejectsWith(() => live.run(() => {
    called = true;
    return Promise.resolve(0);
  }), "page crashed"));
  TestValidator.predicate("failed transport not called", !called);
  const early = createHumanViewerCaptureLifetime();
  const beforeDispatch = early.run(() => { called = true; return Promise.resolve(0); });
  const earlyRefusal = rejectsWith(() => beforeDispatch, "disconnected");
  early.fail(new Error("disconnected"));
  TestValidator.predicate("pre-dispatch failure", await earlyRefusal);
  TestValidator.predicate("dispatch withdrawn", !called);
};
