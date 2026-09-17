import { TestValidator } from "@nestia/e2e";

import {
  connectedPanelFixture,
  connectedPanelModel,
} from "../internal/connectedPanelFixture";

/**
 * An obsolete initial build owns neither publication nor an error message.
 * The injected file-read rejection withdraws initialization before it settles;
 * this models an already queued external input event during startup. Successful
 * stale resources are disposed, while stale failures leave the newer error.
 * No clock, browser, worker or filesystem participates in these orderings.
 */
export const test_subject_connected_panel_initial_races =
  async (): Promise<void> => {
    for (const failure of [false, true]) {
      let complete!: () => void;
      const waiting = new Promise<boolean>((resolve) => {
        complete = () => resolve(true);
      });
      const f = connectedPanelFixture({
        build: async (document) => {
          await waiting;
          if (failure) throw new Error("obsolete initialization");
          return connectedPanelModel(document);
        },
      });
      await f.file(async () => {
        throw new Error("newer file failure");
      });
      complete();
      await f.panel.ready;
      TestValidator.equals("no obsolete publication", f.published.length, 0);
      TestValidator.equals(
        "stale resource disposal",
        f.disposed.length,
        failure ? 0 : 1,
      );
      TestValidator.equals(
        "no obsolete document",
        f.panel.snapshot(),
        undefined,
      );
      TestValidator.equals(
        "newer error remains visible",
        f.element("face-status").textContent,
        "newer file failure",
      );
      f.dom.window.close();
    }
  };
