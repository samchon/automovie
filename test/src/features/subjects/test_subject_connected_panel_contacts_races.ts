import type { IAutoMovieModelCrossing } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

import {
  connectedPanelFixture,
  connectedPanelModel,
} from "../internal/connectedPanelFixture";

/**
 * A superseded baseline measurement cannot start a new preview request or
 * overwrite the current status. Promise completion is controlled in memory.
 *
 * Scenarios:
 * 1. A delayed baseline with a reading is disposed after an edit; it starts no posed measurement.
 * 2. A delayed baseline without a reading cannot replace the newer edit's status with an error.
 */
export const test_subject_connected_panel_contacts_races =
  async (): Promise<void> => {
    for (const reading of [[], null] as (IAutoMovieModelCrossing[] | null)[]) {
      let calls = 0;
      let finish!: () => void;
      const f = connectedPanelFixture({
        build: async (document) => {
          if (++calls === 2)
            await new Promise<boolean>((resolve) => {
              finish = () => resolve(true);
            });
          return { ...connectedPanelModel(document), crossings: reading };
        },
      });
      await f.panel.ready;
      const measurement = f.click("face-contacts");
      TestValidator.equals("baseline is pending", calls, 2);
      await f.change("control-width", "0.25");
      const status = f.element("face-status").textContent;
      const document = f.panel.snapshot()!.document;
      finish();
      await measurement;
      TestValidator.equals(
        "obsolete baseline starts no posed request",
        calls,
        3,
      );
      TestValidator.equals(
        "obsolete baseline preserves status",
        f.element("face-status").textContent,
        status,
      );
      TestValidator.equals(
        "new edit remains committed",
        f.panel.snapshot()!.document,
        document,
      );
      TestValidator.equals(
        "obsolete baseline model is disposed",
        f.disposed.length,
        1,
      );
      f.dom.window.close();
    }
  };
