import type { IAutoMovieHumanBodySimpleShape } from "@automovie/human";
import { mountConnectedBodyPanel } from "@automovie/playground/src/human/connectedBodyPanel";
import { TestValidator } from "@nestia/e2e";
import { JSDOM } from "jsdom";

import { humanBodyShoulderFixture } from "../internal/humanBodyShoulderFixture";

/** The browser panel stores a total shoulder goal separately from Euler pose. */
export const test_human_body_panel_shoulders = async (): Promise<void> => {
  const { basis, document: initial } = humanBodyShoulderFixture();
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
  const panel = mountConnectedBodyPanel(app, {
    basis,
    initial,
    shapes: [],
    poses: [
      {
        name: "Overhead",
        shoulders: [
          {
            bone: "leftUpperArm",
            plane: 0,
            elevation: 180,
            axialRotation: 0,
          },
        ],
      },
    ],
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
    simple: { expand: async () => ({}), project: async () => simple },
    download: () => {},
  });
  await panel.ready;
  const kind = app.querySelector<HTMLSelectElement>("#control-kind")!;
  kind.value = "pose";
  kind.dispatchEvent(new dom.defaultView!.Event("change"));
  const elevation = app.querySelector<HTMLInputElement>(
    "#shoulder-leftUpperArm-elevation",
  )!;
  TestValidator.predicate(
    "upper arm presents TT rather than fixed-axis controls",
    elevation !== null &&
      app.querySelector("#pose-leftUpperArm-abduction") === null,
  );
  elevation.value = "120";
  elevation.dispatchEvent(new dom.defaultView!.Event("change"));
  await new Promise((resolve) => {
    setTimeout(resolve, 0);
  });
  TestValidator.equals(
    "clinical total elevation is stored outside ordinary pose",
    [
      panel.snapshot()?.document.shoulders?.[0]?.elevation,
      panel.snapshot()?.document.pose,
    ],
    [120, undefined],
  );
  TestValidator.predicate(
    "saved JSON names the shoulder goal",
    app
      .querySelector<HTMLTextAreaElement>("#document-json")!
      .value.includes('"shoulders"'),
  );
  const preset = [...app.querySelectorAll<HTMLButtonElement>("button")].find(
    (one) => one.textContent === "Overhead",
  )!;
  preset.click();
  await new Promise((resolve) => {
    setTimeout(resolve, 0);
  });
  TestValidator.equals(
    "pose preset replaces the total goal",
    panel.snapshot()?.document.shoulders?.[0]?.elevation,
    180,
  );
  app.querySelector<HTMLButtonElement>("#body-undo")!.click();
  await new Promise((resolve) => {
    setTimeout(resolve, 0);
  });
  TestValidator.equals(
    "undo restores prior authored total goal",
    panel.snapshot()?.document.shoulders?.[0]?.elevation,
    120,
  );
};
