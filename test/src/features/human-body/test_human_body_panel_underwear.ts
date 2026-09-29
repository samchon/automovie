import type { IAutoMovieHumanBodySimpleShape } from "@automovie/human";
import { mountConnectedBodyPanel } from "@automovie/playground/src/human/connectedBodyPanel";
import { TestValidator } from "@nestia/e2e";
import { JSDOM } from "jsdom";

import { humanBodyBasisFixture } from "../internal/humanBodyBasisFixture";

/**
 * The editor's garment choice is document state: its absence, both styles,
 * saved colour, failed builds and history all pass through the same builder.
 *
 * Scenarios:
 * 1. None and both styles reach the builder and the complete document field.
 * 2. A loaded custom colour survives a style change; removal omits the field.
 * 3. Undo and redo restore the selected style and its custom colour.
 * 4. A refused garment edit restores the last committed selection and model.
 */
export const test_human_body_panel_underwear = async (): Promise<void> => {
  const { basis, document: initial } = humanBodyBasisFixture();
  const dom = new JSDOM("<!doctype html><main id='app'></main>").window
    .document;
  const app = dom.querySelector<HTMLElement>("#app")!;
  const built: string[] = [];
  let refuseBra = false;
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
    poses: [],
    viewport: () => ({
      build: async (document) => {
        if (refuseBra && document.underwear?.style === "bra-and-briefs")
          throw new Error("The garment cannot be built.");
        built.push(document.underwear?.style ?? "none");
        return { parts: document.underwear === undefined ? 1 : 2 };
      },
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
      solveMeasurement: async (shape, _channel, targetMetres) => ({
        shape,
        actualMetres: targetMetres,
      }),
    },
    download: () => {},
  });
  await panel.ready;
  const picker = app.querySelector<HTMLSelectElement>("#body-underwear")!;
  const json = app.querySelector<HTMLTextAreaElement>("#document-json")!;
  const settle = async (): Promise<void> => {
    for (let i = 0; i < 4; i++) await Promise.resolve();
  };
  const select = async (value: string): Promise<void> => {
    picker.value = value;
    picker.dispatchEvent(new dom.defaultView!.Event("change"));
    await settle();
  };
  TestValidator.equals(
    "initially no underwear",
    [picker.value, built],
    ["", ["none"]],
  );
  await select("boxer-briefs");
  TestValidator.equals(
    "boxer choice builds and enters the document",
    [
      panel.snapshot()?.document.underwear,
      panel.snapshot()?.model.parts,
      built.at(-1),
    ],
    [{ style: "boxer-briefs" }, 2, "boxer-briefs"],
  );
  const color = { r: 0.2, g: 0.3, b: 0.4 };
  json.value = JSON.stringify({
    ...panel.snapshot()!.document,
    underwear: { style: "boxer-briefs", color },
  });
  app.querySelector<HTMLButtonElement>("#document-apply")!.click();
  await settle();
  await select("bra-and-briefs");
  TestValidator.equals(
    "style change retains an authored colour",
    panel.snapshot()?.document.underwear,
    { style: "bra-and-briefs", color },
  );
  TestValidator.predicate(
    "complete document shows the selected style",
    json.value.includes('"style": "bra-and-briefs"'),
  );
  await select("");
  TestValidator.equals(
    "none omits the garment and skin only is built",
    [
      panel.snapshot()?.document.underwear,
      panel.snapshot()?.model.parts,
      built.at(-1),
    ],
    [undefined, 1, "none"],
  );
  app.querySelector<HTMLButtonElement>("#body-undo")!.click();
  await settle();
  TestValidator.equals(
    "undo restores the coloured bra",
    [picker.value, panel.snapshot()?.document.underwear],
    ["bra-and-briefs", { style: "bra-and-briefs", color }],
  );
  app.querySelector<HTMLButtonElement>("#body-redo")!.click();
  await settle();
  TestValidator.equals(
    "redo removes the garment again",
    [picker.value, panel.snapshot()?.document.underwear],
    ["", undefined],
  );
  await select("boxer-briefs");
  refuseBra = true;
  await select("bra-and-briefs");
  TestValidator.equals(
    "a failed build restores the previous document and control",
    [
      picker.value,
      panel.snapshot()?.document.underwear,
      panel.snapshot()?.model.parts,
    ],
    ["boxer-briefs", { style: "boxer-briefs" }, 2],
  );
};
