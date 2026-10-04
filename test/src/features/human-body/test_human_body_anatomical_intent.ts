import { createHumanBodyAnatomicalInspection } from "@automovie/human/body/anatomy/articulation/createHumanBodyAnatomicalInspection";
import type { IAutoMovieHumanBodyAnatomicalInspection } from "@automovie/human/body/anatomy/generated/IAutoMovieHumanBodyAnatomicalInspection";
import { serializeHumanBodyAnatomicalDocument } from "@automovie/human/body/document/serializeHumanBodyAnatomicalDocument";
import { mountBodyAnatomicalRequestPanel } from "@automovie/playground/src/human/body/mountBodyAnatomicalRequestPanel";
import { TestValidator } from "@nestia/e2e";

import { bodyAnatomicalInspectionFixture } from "../internal/bodyAnatomicalInspectionFixture";

/**
 * Controlled port lifetimes prove obsolete builds, file reads and exports have no publication authority.
 *
 * Scenarios:
 * 1. Out-of-order initial and subsequent builds publish only current intent and release obsolete prepared frames.
 * 2. Superseded file reads and exports cannot change the committed request or download stale output.
 */
export async function test_human_body_anatomical_intent(): Promise<void> {
  const { basis, document } = bodyAnatomicalInspectionFixture();
  const inspect = createHumanBodyAnatomicalInspection(basis);
  const nodes = new Map<string, {
    value: string; textContent: string; disabled: boolean; dataset: Record<string, string>;
    files?: { text: () => Promise<string> }[];
    onclick?: () => unknown; onchange?: () => unknown; click: () => void;
  }>();
  for (const id of ["request-json", "request-status", "request-save", "request-export", "request-undo", "request-redo", "request-apply", "request-load", "request-file", "request-fit", "request-clay"])
    nodes.set(id, { value: "", textContent: "", disabled: false, dataset: {}, click: () => {} });
  const node = (id: string) => nodes.get(id)!;
  const app = { querySelector: (selector: string) => node(selector.slice(1)), querySelectorAll: () => [] } as unknown as HTMLElement;
  type Model = { anatomicalRequest: IAutoMovieHumanBodyAnatomicalInspection; id: number };
  const builds: { model: Model; resolve: (model: Model) => void }[] = [];
  let exportDone: ((value: Uint8Array<ArrayBuffer>) => void) | undefined;
  const publications: number[] = [];
  const disposals: number[] = [];
  const downloads: string[] = [];
  const panel = mountBodyAnatomicalRequestPanel(app, {
    basis: basis.id,
    viewport: {
      build: (value) => new Promise<Model>((resolve) => {
        builds.push({ model: { anatomicalRequest: inspect(value), id: builds.length }, resolve });
      }),
      publish: (model) => { publications.push(model.id); },
      dispose: (model) => { disposals.push(model.id); },
      cancel: () => {},
      export: () => new Promise<Uint8Array<ArrayBuffer>>((resolve) => { exportDone = resolve; }),
      fitView: () => {}, cameraView: () => {}, setClay: () => {},
    },
    download: (name) => { downloads.push(name); },
  });
  const text = serializeHumanBodyAnatomicalDocument(document);
  const old = panel.apply(text);
  builds[0].resolve(builds[0].model);
  // The viewport result can be current when prepared, then lose authority
  // before the awaiting panel establishes its first transaction.
  await Promise.resolve();
  const current = panel.apply(text);
  builds[1].resolve(builds[1].model);
  TestValidator.equals("newest initial pair", await current, true);
  TestValidator.equals("older initial result withdrawn", await old, false);
  TestValidator.equals("stale initial frame disposed", disposals, [0]);
  const oldEdit = panel.apply(text);
  const currentEdit = panel.apply(text);
  builds[3].resolve(builds[3].model);
  await currentEdit;
  builds[2].resolve(builds[2].model);
  TestValidator.equals("older edit cannot replace pair", await oldEdit, false);
  TestValidator.equals("stale subsequent frame disposed", disposals, [0, 2]);
  TestValidator.equals("publication order follows intent", publications, [1, 3]);
  const exporting = node("request-export").onclick!();
  const later = panel.apply(text);
  builds[4].resolve(builds[4].model);
  await later;
  exportDone!(new Uint8Array([1]));
  await exporting;
  TestValidator.equals("obsolete export produces no file", downloads, []);
  let finishRead: ((value: string) => void) | undefined;
  node("request-file").files = [{ text: () => new Promise<string>((resolve) => { finishRead = resolve; }) }];
  const reading = node("request-file").onchange!();
  const replacing = panel.apply(text);
  builds[5].resolve(builds[5].model);
  await replacing;
  finishRead!("{");
  await reading;
  TestValidator.equals("obsolete file does not parse or overwrite draft", panel.snapshot()!.model.id, 5);
  TestValidator.predicate("current state remains qualified", node("request-status").dataset.state === "ready");
}
