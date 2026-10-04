import { TestValidator } from "@nestia/e2e";
import { EventEmitter } from "node:events";

import { observeHumanViewerRendererTarget } from "../../../scripts/human-viewer/observeHumanViewerRendererTarget";
import { rejectsWith } from "../internal/rejectsWith";

/**
 * Exact browser-root terminal events settle ownership; detach alone does not.
 * Registration failures dispose their probe/listeners. Connected disposal
 * detaches the observer, while disconnected disposal sends no dead command.
 */
export const test_human_viewer_renderer_target = async (): Promise<void> => {
  const exercise = async (broken: false | "probe" | "discovery" = false) => {
    const root = new EventEmitter();
    const page = new EventEmitter();
    const browser = new EventEmitter();
    let connected = true;
    let probeDetached = false;
    let rootDetached = false;
    const events: { cause: string; physical: boolean }[] = [];
    const options = {
      page: Object.assign(page, { context: () => ({ newCDPSession: async () => ({
        send: async () => {
          if (broken === "probe") throw new Error("probe failed");
          return { targetInfo: { targetId: "owned" } };
        },
        detach: async () => { probeDetached = true; },
      }) }) }),
      browser: Object.assign(browser, {
        isConnected: () => connected,
        newBrowserCDPSession: async () => Object.assign(root, {
          send: async () => { if (broken === "discovery") throw new Error("discovery failed"); },
          detach: async () => { rootDetached = true; },
        }),
      }),
      failed: (cause: string, physical: boolean) => { events.push({ cause, physical }); },
    } as unknown as Parameters<typeof observeHumanViewerRendererTarget>[0];
    if (broken) {
      TestValidator.predicate("registration failure", await rejectsWith(
        () => observeHumanViewerRendererTarget(options), broken + " failed"));
      TestValidator.predicate("failed observer detached", probeDetached && rootDetached === (broken === "discovery"));
      TestValidator.equals("failed listeners removed", root.eventNames().length, 0);
      return;
    }
    const stop = await observeHumanViewerRendererTarget(options);
    root.emit("Target.targetCrashed", { targetId: "other" });
    root.emit("Target.targetDestroyed", { targetId: "other" });
    root.emit("Target.detachedFromTarget", { targetId: "owned" });
    TestValidator.equals("unrelated and detach ignored", events.length, 0);
    root.emit("Target.targetCrashed", { targetId: "owned" });
    root.emit("Target.targetDestroyed", { targetId: "owned" });
    page.emit("crash");
    page.emit("close");
    TestValidator.predicate("terminal signals physical", events.length === 4 && events.every((e) => e.physical));
    await stop();
    TestValidator.predicate("connected observer detached", rootDetached && probeDetached);
    root.emit("Target.targetCrashed", { targetId: "owned" });
    TestValidator.equals("stopped observer silent", events.length, 4);
    rootDetached = false;
    const stopDisconnected = await observeHumanViewerRendererTarget(options);
    connected = false;
    browser.emit("disconnected");
    page.emit("close");
    TestValidator.predicate("transport and synthetic close not physical", events.slice(4).every((e) => !e.physical));
    await stopDisconnected();
    TestValidator.predicate("closed root needs no command", !rootDetached);
    TestValidator.equals("page listeners removed", page.eventNames().length, 0);
    TestValidator.equals("browser listeners removed", browser.eventNames().length, 0);
  };
  await exercise();
  await exercise("probe");
  await exercise("discovery");
};
