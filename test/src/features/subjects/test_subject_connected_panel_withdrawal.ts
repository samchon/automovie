import { TestValidator } from "@nestia/e2e";

import {
  connectedPanelFixture,
  connectedPanelModel,
} from "../internal/connectedPanelFixture";
import { humanFaceBasisFixture } from "../internal/humanFaceBasisFixture";

/**
 * Withdrawing a pending edit restores its committed numerical origin for the
 * next interaction. Controlled promises model work that ignores cancellation.
 *
 * Scenarios:
 * 1. Contact checking and file reading restore visible committed coordinates after cancelling a pending edit.
 * 2. Subsequent simple and fine edits cannot revive cancelled values through their captured origins.
 * 3. Late builds and superseded file reads leave the new committed state intact.
 */
export const test_subject_connected_panel_withdrawal =
  async (): Promise<void> => {
    for (const [action, level] of [
      ["contacts", "fine"],
      ["file", "fine"],
      ["contacts", "simple"],
      ["file", "simple"],
    ] as const) {
      const source = humanFaceBasisFixture();
      source.basis.channels.push({ ...source.basis.channels[0], id: "right" });
      let calls = 0;
      let finishBuild!: () => void;
      let finishFile!: (text: string) => void;
      const f = connectedPanelFixture({
        source,
        controlMap: {
          basis: source.basis.id,
          groups: [
            {
              id: "a",
              label: "Width",
              description: "First shape group",
              channels: ["width"],
            },
            {
              id: "b",
              label: "Other width",
              description: "Second shape group",
              channels: ["right"],
            },
          ],
        },
        build: async (document) => {
          if (++calls === 2)
            await new Promise<boolean>((resolve) => {
              finishBuild = () => resolve(true);
            });
          return { ...connectedPanelModel(document), crossings: [] };
        },
      });
      await f.panel.ready;
      await f.change("control-level", level);
      const input = level === "simple" ? "simple-a" : "control-width";
      const pending = f.change(input, "0.5");
      TestValidator.equals("shape edit is still pending", calls, 2);
      let loading: ReturnType<typeof f.file> | undefined;
      if (action === "contacts") await f.click("face-contacts");
      else
        loading = f.file(
          () =>
            new Promise<string>((resolve) => {
              finishFile = resolve;
            }),
        );
      TestValidator.equals(
        "cancelled input displays the committed value",
        f.element<HTMLInputElement>(input).value,
        "0",
      );
      if (level === "fine") {
        await f.change("control-kind", "expression");
        await f.change("control-lift", "0.25");
      } else await f.change("simple-b", "0.25");
      const expected: Record<string, number> =
        level === "simple" ? { right: 0.25 } : {};
      TestValidator.equals(
        "cancelled shape cannot return through another edit",
        f.panel.snapshot()!.document.shape,
        expected,
      );
      TestValidator.equals(
        "new expression survives",
        f.panel.snapshot()!.document.expression,
        level === "fine" ? { lift: 0.25 } : {},
      );
      finishBuild();
      await pending;
      if (loading !== undefined) {
        finishFile("obsolete invalid JSON");
        await loading;
      }
      TestValidator.equals(
        "late completions keep current state",
        f.panel.snapshot()!.document.shape,
        expected,
      );
      TestValidator.equals(
        "late completions keep ready status",
        f.element("face-status").dataset.state,
        "ready",
      );
      f.dom.window.close();
    }
  };
