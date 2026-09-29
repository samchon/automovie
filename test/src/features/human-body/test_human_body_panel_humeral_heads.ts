import type { IAutoMovieHumanBodySimpleShape } from "@automovie/human";
import { mountConnectedBodyPanel } from "@automovie/playground/src/human/body/connectedBodyPanel";
import { TestValidator } from "@nestia/e2e";
import { JSDOM } from "jsdom";

import { humanBodyBasisFixture } from "../internal/humanBodyBasisFixture";

/**
 * Scenarios:
 * 1. A direct articular measurement survives the editor transaction.
 * 2. Routine edits do not ask the worker for an internal read; the explicit
 *    contact button requests both skin and anatomy and displays the result.
 */
export const test_human_body_panel_humeral_heads = async (): Promise<void> => {
  const { basis, document: initial } = humanBodyBasisFixture();
  const dom = new JSDOM("<!doctype html><main id='app'></main>").window.document;
  const app = dom.querySelector<HTMLElement>("#app")!;
  const calls: { measure: boolean | undefined; anatomy: boolean | undefined }[] = [];
  const simple: IAutoMovieHumanBodySimpleShape = {
    sex: 0,
    ageYears: 30,
    statureMetres: 1.7,
    massKilograms: 70,
    muscle: 0,
  };
  const panel = mountConnectedBodyPanel(app, {
    basis,
    initial,
    poses: [],
    viewport: () => ({
      build: async (_document, measure?: boolean, anatomy?: boolean) => {
        calls.push({ measure, anatomy });
        return {
          parts: 1,
          crossings: measure ? [] : null,
          anatomy: anatomy ? { status: "unavailable" as const, reason: "ct-domain" as const } : null,
        };
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
      solveMeasurement: async (shape, _channel, targetMetres) => ({ shape, actualMetres: targetMetres }),
    },
    download: () => {},
  });
  await panel.ready;
  const left = app.querySelector<HTMLInputElement>("#humeral-head-left")!;
  left.value = "24";
  const set = [...app.querySelectorAll<HTMLButtonElement>("button")].find((button) => button.textContent === "Set radius")!;
  set.click();
  for (let i = 0; i < 5; i++) await Promise.resolve();
  TestValidator.equals("radius committed as anatomical millimetres", panel.snapshot()?.document.humeralHeads, { leftRadiusMillimetres: 24 });
  TestValidator.predicate("ordinary edit requests no anatomy read", calls.every((call) => call.anatomy !== true));
  app.querySelector<HTMLButtonElement>("#body-contacts")!.click();
  for (let i = 0; i < 5; i++) await Promise.resolve();
  TestValidator.equals("explicit check requests skin and anatomy", calls.at(-1), { measure: true, anatomy: true });
  TestValidator.predicate("status includes internal result", app.querySelector<HTMLElement>("#body-status")!.textContent!.includes("Humeral-head estimate unavailable"));
};
