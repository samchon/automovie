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
 * The body panel admits a millimetre target through the worker and reserves
 * user intent before the solve. The analytic box gains a measured height
 * channel using its already-authored top-face endpoint, so no expected body
 * geometry is copied into the test.
 *
 * Scenarios:
 * 1. A slow measured-height reply after a newer pose edit cannot replace the
 *    committed document, pose or displayed model.
 * 2. A refused old measurement after a newer pose edit cannot replace ready
 *    status with its obsolete error.
 * 3. An export superseded by a newer edit cannot download; the current export
 *    downloads the current document once.
 */
export const test_human_body_panel_measured_intents =
  async (): Promise<void> => {
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
    const slow = deferred<{
      shape: Record<string, number>;
      actualMetres: number;
    }>();
    const failing = deferred<{
      shape: Record<string, number>;
      actualMetres: number;
    }>();
    const exportFirst = deferred<Uint8Array<ArrayBuffer>>();
    const exportSecond = deferred<Uint8Array<ArrayBuffer>>();
    const downloads: { filename: string; bytes: BlobPart }[] = [];
    let solves = 0;
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
      poses: [
        {
          name: "Bent",
          pose: [{ bone: "spine", flexion: 10, abduction: 0, twist: 0 }],
        },
        { name: "Rest", pose: [] },
      ],
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
        solveMeasurement: () => (++solves === 1 ? slow.promise : failing.promise),
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
    const target = (): HTMLInputElement =>
      app.querySelector<HTMLInputElement>("#control-macroHeight")!;
    TestValidator.predicate("measured channel is offered", target() !== null);
    target().value = "2200";
    button("Set measurement").click();
    button("Bent").click();
    await Promise.resolve();
    const committedParts = panel.snapshot()!.model.parts;
    slow.resolve({ shape: { macroHeight: 1 }, actualMetres: 2.2 });
    await Promise.resolve();
    TestValidator.equals(
      "late measurement preserves newer pose and body",
      [
        panel.snapshot()?.document.shape.macroHeight ?? 0,
        panel.snapshot()?.document.pose?.[0]?.flexion,
        panel.snapshot()?.model.parts,
      ],
      [0, 10, committedParts],
    );
    // A committed pose rebuilds the rows. Enter the next measurement into
    // the live input so its worker promise is actually observed by the panel.
    target().value = "2300";
    button("Set measurement").click();
    TestValidator.equals("new measurement starts a second solve", solves, 2);
    button("Rest").click();
    await Promise.resolve();
    failing.reject(new Error("old measurement failure"));
    await Promise.resolve();
    TestValidator.predicate(
      "late measurement failure leaves newer ready state",
      (panel.snapshot()?.document.pose?.length ?? 0) === 0 &&
        app.querySelector<HTMLDivElement>("#body-status")?.dataset.state ===
          "ready" &&
        !app
          .querySelector<HTMLDivElement>("#body-status")
          ?.textContent?.includes("old measurement failure"),
    );
    button("Export GLB").click();
    button("Bent").click();
    await Promise.resolve();
    exportFirst.resolve(new Uint8Array([1, 2, 3]));
    await Promise.resolve();
    TestValidator.equals("stale export does not download", downloads.length, 0);
    button("Export GLB").click();
    exportSecond.resolve(new Uint8Array([4, 5, 6]));
    await Promise.resolve();
    TestValidator.equals(
      "current export downloads the body",
      [downloads[0]?.filename, (downloads[0]?.bytes as Uint8Array)[0], published],
      [initial.id + ".glb", 4, 4],
    );
  };
