import type { IAutoMovieHumanFaceBasisDocument } from "@automovie/human";
import { TestValidator } from "@nestia/e2e";

import {
  connectedPanelFixture,
  connectedPanelModel,
} from "../internal/connectedPanelFixture";
import { humanFaceBasisFixture } from "../internal/humanFaceBasisFixture";

/**
 * Delayed simple edits compose through one origin and obey cancellation.
 *
 * Scenarios:
 * 1. Refusing a later coordinate cancels an earlier pending value; it cannot revive on recovery.
 * 2. Two pending simple groups compose, and reversed completion retains the newest pair.
 * 3. A mode switch during evaluation exposes the latest draft for a subsequent fine edit.
 */
export const test_subject_connected_panel_simple_races =
  async (): Promise<void> => {
    const source = humanFaceBasisFixture();
    source.basis.channels.push({ ...source.basis.channels[0], id: "right" });
    const pending: {
      document: IAutoMovieHumanFaceBasisDocument;
      finish: () => void;
    }[] = [];
    let initial = true;
    const f = connectedPanelFixture({
      source,
      controlMap: {
        basis: source.basis.id,
        groups: [
          {
            id: "a",
            label: "First",
            description: "First independent shape",
            channels: ["width"],
          },
          {
            id: "b",
            label: "Second",
            description: "Second independent shape",
            channels: ["right"],
          },
        ],
      },
      build: async (document) => {
        if (initial) {
          initial = false;
          return connectedPanelModel(document);
        }
        await new Promise<boolean>((resolve) => {
          pending.push({ document, finish: () => resolve(true) });
        });
        return connectedPanelModel(document);
      },
    });
    await f.panel.ready;
    const first = f.change("simple-a", "0.4");
    await f.change("simple-b", "2");
    const recovery = f.change("simple-b", "0.3");
    TestValidator.equals(
      "cancelled group stays absent",
      pending[1].document.shape,
      { right: 0.3 },
    );
    pending[1].finish();
    await recovery;
    pending[0].finish();
    await first;
    TestValidator.equals(
      "late first cannot revive",
      f.panel.snapshot()!.document.shape,
      { right: 0.3 },
    );
    const next = f.change("simple-a", "0.2");
    const newest = f.change("simple-b", "0.5");
    TestValidator.equals("pending groups compose", pending[3].document.shape, {
      width: 0.2,
      right: 0.5,
    });
    pending[3].finish();
    await newest;
    pending[2].finish();
    await next;
    const simple = f.change("simple-a", "0.25");
    await f.change("control-level", "fine");
    TestValidator.equals(
      "mode displays pending value",
      f.element<HTMLInputElement>("control-width").value,
      "0.25",
    );
    const fine = f.change("control-right", "0.6");
    TestValidator.equals(
      "fine composes with pending simple",
      pending[5].document.shape,
      { width: 0.25, right: 0.6 },
    );
    pending[5].finish();
    await fine;
    pending[4].finish();
    await simple;
    TestValidator.equals(
      "final numerical state",
      f.panel.snapshot()!.document.shape,
      { width: 0.25, right: 0.6 },
    );
    f.dom.window.close();
  };
