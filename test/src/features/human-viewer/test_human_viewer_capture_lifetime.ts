import { TestValidator } from "@nestia/e2e";

import { createHumanViewerCaptureLifetime } from "../../../scripts/human-viewer/createHumanViewerCaptureLifetime";
import { createHumanViewerQueue } from "../../../scripts/human-viewer/createHumanViewerQueue";
import { rejectsWith } from "../internal/rejectsWith";

/**
 * Physical settlement releases capture ownership without an elapsed-time policy.
 *
 * Scenarios:
 * 1. Successful and failed operations settle independently on a live transport.
 * 2. Failure rejects an outstanding operation before its producer replies and
 *    rejects future work without calling that producer.
 * 3. Failure before the first operation microtask prevents dispatch entirely.
 * 4. An uncertain transport rejection retains the queue until target destruction.
 * 5. A real reply settles withdrawn physical work with its named refusal.
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
  const uncertain = createHumanViewerCaptureLifetime();
  let transportReject: (error: Error) => void = () => {};
  let uncertainSettled = false;
  const unresolved = uncertain.run(() => new Promise((resolve, reject) => { void resolve; transportReject = reject; }));
  const terminal = unresolved.catch(() => { uncertainSettled = true; });
  await Promise.resolve();
  uncertain.fail(new Error("transport lost"), false);
  transportReject(new Error("protocol detached"));
  for (let i = 0; i < 5; ++i) await Promise.resolve();
  TestValidator.predicate("disconnect retains physical ownership", !uncertainSettled);
  TestValidator.predicate("disconnect refuses new dispatch", await rejectsWith(
    () => uncertain.run(() => Promise.resolve(0)), "transport lost"));
  uncertain.fail(new Error("owned target destroyed"));
  await terminal;
  TestValidator.predicate("destroy settles outstanding operation", uncertainSettled);
  const completed = createHumanViewerCaptureLifetime();
  let reply: (value: number) => void = () => {};
  const completedReply = completed.run(() => new Promise<number>((resolve) => { reply = resolve; }));
  const completedRefusal = rejectsWith(() => completedReply, "transport uncertain");
  await Promise.resolve();
  completed.fail(new Error("transport uncertain"), false);
  reply(1);
  TestValidator.predicate("physical reply rejects withdrawn capture", await completedRefusal);
  const undispatched = createHumanViewerCaptureLifetime();
  const withdrawn = undispatched.run(() => Promise.resolve(0));
  const withdrawnRefusal = rejectsWith(() => withdrawn, "before dispatch");
  undispatched.fail(new Error("before dispatch"), false);
  TestValidator.predicate("no physical work to retain", await withdrawnRefusal);
  const queue = createHumanViewerQueue({ limit: 2, patience: 1, now: () => 0 });
  const queuedLifetime = createHumanViewerCaptureLifetime();
  let queuedReject: (error: Error) => void = () => {};
  const active = queue.run("owned renderer", () => queuedLifetime.run(() => new Promise((resolve, reject) => {
    void resolve;
    queuedReject = reject;
  })));
  const activeRefusal = rejectsWith(() => active, "renderer destroyed");
  let nextStarted = false;
  const next = queue.run("next", async () => { nextStarted = true; return 7; });
  await Promise.resolve();
  queuedLifetime.fail(new Error("transport uncertain"), false);
  queuedReject(new Error("protocol detached"));
  for (let i = 0; i < 5; ++i) await Promise.resolve();
  TestValidator.predicate("queue retains running physical operation", !nextStarted);
  queuedLifetime.fail(new Error("renderer destroyed"));
  TestValidator.predicate("queue receives named terminal rejection", await activeRefusal);
  TestValidator.equals("queue resumes after physical settlement", await next, 7);
};
