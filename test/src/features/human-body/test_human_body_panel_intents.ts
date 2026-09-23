import type { IAutoMovieHumanBodySimpleShape } from "@automovie/human";
import { mountConnectedBodyPanel } from "@automovie/playground/src/human/connectedBodyPanel";
import { TestValidator } from "@nestia/e2e";
import { JSDOM } from "jsdom";

import { humanBodyBasisFixture } from "../internal/humanBodyBasisFixture";

const deferred = <T>() => {
  let resolvePromise!: (value: T) => void;
  let rejectPromise!: (error: Error) => void;
  const promise = new Promise<T>((resolve, reject) => {
    resolvePromise = resolve;
    rejectPromise = reject;
  });
  return { promise, resolve: resolvePromise, reject: rejectPromise };
};

/**
 * The panel reserves user intent before an asynchronous preset or export.
 * A newer edit keeps its committed document, displayed model and download
 * authority when an old answer returns. The pure gate and worker protocol
 * have their own tests; this checks the DOM-to-editor composition boundary.
 */
export const test_human_body_panel_intents = async (): Promise<void> => {
  const { basis, document: initial } = humanBodyBasisFixture();
  const dom = new JSDOM("<!doctype html><main id='app'></main>").window
    .document;
  const app = dom.querySelector<HTMLElement>("#app")!;
  const slow = deferred<Record<string, number>>();
  const failing = deferred<Record<string, number>>();
  const exportFirst = deferred<Uint8Array<ArrayBuffer>>();
  const exportSecond = deferred<Uint8Array<ArrayBuffer>>();
  const downloads: { filename: string; bytes: BlobPart }[] = [];
  let exports = 0;
  let builds = 0;
  let published = 0;
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
    shapes: [
      { name: "Slow", shape: () => slow.promise },
      { name: "Failing", shape: () => failing.promise },
      { name: "Male", shape: { macroGender: 1 } },
    ],
    poses: [],
    viewport: () => ({
      build: async () => ({ parts: ++builds, crossings: null, extras: {} }),
      cancel: () => {},
      publish: () => {
        published++;
      },
      dispose: () => {},
      export: () =>
        ++exports === 1 ? exportFirst.promise : exportSecond.promise,
      fitView: () => {},
      cameraView: () => {},
      setClay: () => {},
      setShadows: () => {},
    }),
    seat: () => {},
    simple: {
      expand: async () => ({}),
      project: async () => simple,
    },
    download: (filename, bytes) => {
      downloads.push({ filename, bytes });
    },
  });
  await panel.ready;
  const button = (name: string): HTMLButtonElement =>
    [...app.querySelectorAll<HTMLButtonElement>("button")].find(
      (one) => one.textContent === name,
    )!;
  button("Slow").click();
  button("Male").click();
  await Promise.resolve();
  TestValidator.equals(
    "newer preset commits first",
    panel.snapshot()?.document.shape.macroGender,
    1,
  );
  const committedParts = panel.snapshot()!.model.parts;
  slow.resolve({ macroGender: -1 });
  await Promise.resolve();
  TestValidator.equals(
    "late preset cannot replace document or model",
    [
      panel.snapshot()?.document.shape.macroGender,
      panel.snapshot()?.model.parts,
    ],
    [1, committedParts],
  );
  button("Failing").click();
  button("Male").click();
  await Promise.resolve();
  failing.reject(new Error("old solver failure"));
  await Promise.resolve();
  TestValidator.predicate(
    "late preset failure cannot replace newer status",
    panel.snapshot()?.document.shape.macroGender === 1 &&
      app.querySelector<HTMLDivElement>("#body-status")?.dataset.state ===
        "ready" &&
      !app
        .querySelector<HTMLDivElement>("#body-status")
        ?.textContent?.includes("old solver failure"),
  );
  button("Export GLB").click();
  button("Male").click();
  await Promise.resolve();
  exportFirst.resolve(new Uint8Array([1, 2, 3]));
  await Promise.resolve();
  TestValidator.equals("stale export does not download", downloads.length, 0);
  button("Export GLB").click();
  exportSecond.resolve(new Uint8Array([4, 5, 6]));
  await Promise.resolve();
  TestValidator.equals(
    "current export downloads the committed document",
    [downloads[0]?.filename, (downloads[0]?.bytes as Uint8Array)[0], published],
    [initial.id + ".glb", 4, 4],
  );
};
