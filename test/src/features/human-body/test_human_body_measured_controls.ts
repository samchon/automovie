import type { IAutoMovieHumanBodyChannelScale } from "@automovie/human";
import { renderBodyMeasuredControls } from "@automovie/playground/src/human/bodyMeasuredControls";
import { TestValidator } from "@nestia/e2e";
import { JSDOM } from "jsdom";

import { humanBodyBasisFixture } from "../internal/humanBodyBasisFixture";

/**
 * The detailed body control requests a real measurement in millimetres and
 * never exposes an unmeasured morph as a vertex-displacement slider.
 *
 * Scenarios:
 * 1. Group/search select one measured breadth with its neutral/end readings;
 *    an unmeasured channel and an unmatched search offer no input.
 * 2. Blank input refuses; a 250 mm target is sent as 0.25 m and its solution
 *    edits the latest document, preserving a newer name and other channels.
 * 3. A numerical answer whose intent was superseded cannot commit.
 */
export const test_human_body_measured_controls = async (): Promise<void> => {
  const { basis, document: initial } = humanBodyBasisFixture();
  const dom = new JSDOM("<!doctype html><main id='app'></main>").window
    .document;
  const container = dom.querySelector<HTMLElement>("#app")!;
  const scales = new Map<string, IAutoMovieHumanBodyChannelScale>([
    [
      "width",
      {
        id: "width",
        group: "torso",
        positive: { displacement: 0.01, peak: 0.02, vertices: 8 },
        negative: { displacement: 0.005, peak: 0.01, vertices: 8 },
        measurement: {
          id: "measure-width",
          kind: "breadth",
          neutral: 0.2,
          positive: 0.3,
          negative: 0.15,
        },
      },
    ],
    [
      "tall",
      {
        id: "tall",
        group: "macro",
        positive: { displacement: 0.1, peak: 0.5, vertices: 4 },
        negative: null,
        measurement: null,
      },
    ],
  ]);
  let current = initial;
  let ticket = 0;
  let pending = false;
  const refused: unknown[] = [];
  const reports: string[] = [];
  const calls: { channel: string; target: number }[] = [];
  const render = (kind: string, query: string): void => {
    container.replaceChildren();
    renderBodyMeasuredControls({
      dom,
      container,
      basis,
      scales,
      kind,
      query,
      current: () => current,
      reserve: () => ++ticket,
      isCurrent: (value) => ticket === value,
      solve: async (shape, channel, targetMetres) => {
        calls.push({ channel, target: targetMetres });
        if (pending)
          return new Promise((resolve) => {
            release = () => resolve({
              shape: { ...shape, width: 0.9 },
              actualMetres: targetMetres,
            });
          });
        return {
          shape: { ...shape, width: 0.5 },
          actualMetres: targetMetres,
        };
      },
      change: async (document) => {
        current = document;
        return true;
      },
      busy: () => {},
      report: (text) => reports.push(text),
      refuse: (error) => refused.push(error),
    });
  };
  let release = () => {};
  render("torso", "wid");
  TestValidator.predicate(
    "measurement shown without sculpt statistics",
    container.querySelectorAll(".row").length === 1 &&
      container.querySelector("#control-width-slider") === null &&
      container.querySelector("#scale-width")?.textContent?.includes(
        "Neutral 200.0 mm",
      ) === true &&
      container.querySelector("#scale-width")?.textContent?.includes("vertices") === false,
  );
  const target = container.querySelector<HTMLInputElement>("#control-width")!;
  const apply = container.querySelector<HTMLButtonElement>("button")!;
  apply.click();
  TestValidator.equals("blank refuses without solving", [calls.length, refused.length], [0, 1]);
  current = { ...current, name: "A newer draft" };
  target.value = "250";
  apply.click();
  for (let attempt = 0; attempt < 5 && reports.length === 0; attempt++)
    await Promise.resolve();
  TestValidator.predicate(
    "millimetres solve on the latest draft",
    calls.length === 1 &&
      calls[0].channel === "width" &&
      calls[0].target === 0.25 &&
      current.name === "A newer draft" &&
      current.shape.width === 0.5 &&
      reports.some((text) => text.includes("250.0 mm measured")),
  );
  pending = true;
  target.value = "290";
  apply.click();
  ticket++;
  release();
  await Promise.resolve();
  TestValidator.equals("superseded measurement cannot edit", current.shape.width, 0.5);
  render("macro", "");
  TestValidator.equals("unmeasured macro is hidden", container.querySelectorAll(".row").length, 0);
  render("torso", "absent");
  TestValidator.equals("unmatched search is empty", container.querySelectorAll(".row").length, 0);
};
