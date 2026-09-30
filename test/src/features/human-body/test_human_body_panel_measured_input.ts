import type { IAutoMovieHumanBodySimpleShape } from "@automovie/human";
import { mountConnectedBodyPanel } from "@automovie/playground/src/human/body/connectedBodyPanel";
import { TestValidator } from "@nestia/e2e";
import { JSDOM } from "jsdom";

import { humanBodyBasisFixture } from "../internal/humanBodyBasisFixture";
import { nclose } from "../internal/predicates";

/**
 * The detailed body panel offers physical measurement targets while leaving
 * an unmeasured vertex morph outside the authoring controls.
 *
 * Scenarios:
 * 1. On the analytic 2 m box, a new `macroHeight` rule appears as millimetres;
 *    `width`, which has no body measurement rule, has no sculpt slider.
 * 2. Blank input refuses without calling the worker or changing the document.
 * 3. A 2,250 mm target is sent as 2.25 m; the worker's measured solution is
 *    committed while every other channel stays unchanged.
 */
export const test_human_body_panel_measured_input = async (): Promise<void> => {
  const { basis, document: initial } = humanBodyBasisFixture();
  basis.channels.push({
    id: "macroHeight",
    kind: "shape",
    group: "macro",
    mirror: null,
    minimum: 0,
    maximum: 1,
    positive: "raised",
    negative: null,
  });
  const dom = new JSDOM("<!doctype html><main id='app'></main>").window
    .document;
  const app = dom.querySelector<HTMLElement>("#app")!;
  const simple: IAutoMovieHumanBodySimpleShape = {
    sex: 1,
    ageYears: 30,
    statureMetres: 1.75,
    massKilograms: 75,
    muscle: 0,
  };
  const calls: { channel: string; targetMetres: number }[] = [];
  const panel = mountConnectedBodyPanel(app, {
    basis,
    initial,
    poses: [],
    viewport: () => ({
      build: async () => ({ parts: 1, crossings: null, extras: {} }),
      cancel: () => {},
      publish: () => {},
      dispose: () => {},
      export: async () => new Uint8Array(),
      fitView: () => {},
      cameraView: () => {},
      setClay: () => {},
      setShadows: () => {},
    }),
    seat: () => {},
    simple: {
      expand: async () => ({}),
      project: async () => simple,
      solveMeasurement: async (shape, channel, targetMetres) => {
        calls.push({ channel, targetMetres });
        return {
          shape: { ...shape, macroHeight: 0.5 },
          actualMetres: 2.25,
        };
      },
    },
    download: () => {},
  });
  await panel.ready;
  const target = app.querySelector<HTMLInputElement>("#control-macroHeight")!;
  const apply = [...app.querySelectorAll<HTMLButtonElement>("button")].find(
    (one) => one.textContent === "Set measurement",
  )!;
  TestValidator.predicate(
    "only a measured detailed input is offered",
    target !== null && app.querySelector("#control-width") === null,
  );
  apply.click();
  TestValidator.equals("blank target stays uncommitted", calls.length, 0);
  target.value = "2250";
  apply.click();
  for (
    let attempt = 0;
    attempt < 8 &&
    !app
      .querySelector<HTMLDivElement>("#body-status")
      ?.textContent?.includes("2250.0 mm measured on the committed body");
    attempt++
  )
    await Promise.resolve();
  TestValidator.equals("one metric worker request", calls.length, 1);
  TestValidator.predicate(
    "millimetres become metres on the named rule",
    calls[0].channel === "macroHeight" && nclose(calls[0].targetMetres, 2.25),
  );
  TestValidator.predicate(
    "measured result commits without sculpting width",
    panel.snapshot()?.document.shape.macroHeight === 0.5 &&
      panel.snapshot()?.document.shape.width === undefined,
  );
  TestValidator.predicate(
    "committed metric reading is visible",
    app
      .querySelector<HTMLDivElement>("#body-status")
      ?.textContent?.includes("2250.0 mm measured on the committed body") ===
      true,
  );
};
