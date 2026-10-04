import { createHumanBodyBasisBuilder, type IAutoMovieHumanBodyBasisDocument, type IAutoMovieHumanBodySimpleShape } from "@automovie/human";
import { mountConnectedBodyPanel } from "@automovie/playground/src/human/body/connectedBodyPanel";
import { TestValidator } from "@nestia/e2e";
import { JSDOM } from "jsdom";

import { humanBodyPelvisFixture } from "../internal/humanBodyPelvisFixture";

/**
 * The connected editor reports the current rig and retains the last valid
 * document/model when actual pelvic-relative admission refuses a combination.
 *
 * Scenarios:
 * 1. A sagittal edit reports its actual 40-degree pelvic-relative flexion while
 *    keeping the document's 50-degree input and -10 coordination increment.
 * 2. A pending combined refusal through the picker does not publish geometry
 *    or replace the last valid document; the next supported edit recovers.
 * 3. Undo, redo, save/reload and reset retain their existing transaction meaning.
 */
export const test_human_body_panel_pelvic_relative = async (): Promise<void> => {
  const { basis, document: initial } = humanBodyPelvisFixture();
  const evaluate = createHumanBodyBasisBuilder(basis);
  const dom = new JSDOM("<!doctype html><main></main>").window.document;
  const app = dom.querySelector<HTMLElement>("main")!;
  const simple: IAutoMovieHumanBodySimpleShape = { sex: 1, ageYears: 30, statureMetres: 1.75, massKilograms: 75, muscle: 0 };
  let saved = "";
  const errors: unknown[] = [];
  dom.defaultView!.addEventListener("error", (event) => { event.preventDefault(); errors.push(event.error); });
  const panel = mountConnectedBodyPanel(app, {
    basis, initial, poses: [],
    viewport: () => ({
      build: async (document: IAutoMovieHumanBodyBasisDocument) => { const result = evaluate(document); return { parts: result.model.parts.length, crossings: null }; },
      cancel: () => {}, publish: () => {}, dispose: () => {}, export: async () => new Uint8Array(),
      fitView: () => {}, cameraView: () => {}, setClay: () => {}, setShadows: () => {},
    }),
    seat: () => {},
    simple: { expand: async () => ({}), project: async () => simple, solveMeasurement: async (shape, _channel, targetMetres) => ({ shape, actualMetres: targetMetres }) },
    download: (_filename, bytes) => { saved = String(bytes); },
  });
  await panel.ready;
  const settle = async (): Promise<void> => { for (let i = 0; i < 12; i++) await Promise.resolve(); };
  const select = (id: string, value: string): void => { const element = app.querySelector<HTMLSelectElement>(`#${id}`)!; element.value = value; element.dispatchEvent(new dom.defaultView!.Event("change")); };
  const click = (id: string): void => { app.querySelector<HTMLButtonElement>(`#${id}`)!.click(); };
  const valid = { ...initial, pose: [{ bone: "leftUpperLeg" as const, flexion: 50, abduction: null, twist: null }] };
  TestValidator.equals("supported edit commits", await panel.change(valid), true);
  select("control-kind", "pose");
  select("pose-bone", "leftUpperLeg");
  TestValidator.equals("actual coordinate is separate", app.querySelector("#pose-leftUpperLeg-flexion-clinical")?.textContent, "resolved source-rig flexion 40.000000°");
  TestValidator.equals("authored input remains50", app.querySelector<HTMLInputElement>("#pose-leftUpperLeg-flexion")?.value, "50");
  const last = panel.snapshot()!;
  const invalid = panel.change({ ...valid, pose: [{ bone: "leftUpperLeg", flexion: 50, abduction: 45, twist: 45 }] });
  select("pose-bone", "spine");
  TestValidator.equals("pending actual-frame refusal withdraws", await invalid, false);
  TestValidator.equals("last valid document survives", panel.snapshot()!.document, last.document);
  TestValidator.equals("last valid model survives", panel.snapshot()!.model, last.model);
  TestValidator.equals("no unhandled DOM error", errors.length, 0);
  TestValidator.equals("supported recovery commits", await panel.change({ ...valid, pose: [{ ...valid.pose[0], flexion: 60 }] }), true);
  click("body-undo"); await settle();
  TestValidator.equals("undo restores authored pose", panel.snapshot()!.document, valid);
  click("body-redo"); await settle();
  const recovered = panel.snapshot()!.document;
  click("body-save");
  TestValidator.equals("save retains raw authored coordinates", JSON.parse(saved), recovered);
  app.querySelector<HTMLTextAreaElement>("#document-json")!.value = saved;
  click("document-apply"); await settle();
  TestValidator.equals("reload preserves authored coordinates", panel.snapshot()!.document, recovered);
  click("body-reset"); await settle();
  TestValidator.equals("reset restores initial document", panel.snapshot()!.document, initial);
};
