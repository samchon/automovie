import { createHumanBodyAnatomicalInspection } from "@automovie/human/body/anatomy/articulation/createHumanBodyAnatomicalInspection";
import { serializeHumanBodyAnatomicalDocument } from "@automovie/human/body/document/serializeHumanBodyAnatomicalDocument";
import { mountBodyAnatomicalRequestPanel } from "@automovie/playground/src/human/body/mountBodyAnatomicalRequestPanel";
import { TestValidator } from "@nestia/e2e";
import { runInNewContext } from "node:vm";

import { bodyAnatomicalInspectionFixture } from "../internal/bodyAnatomicalInspectionFixture";
import { nclose } from "../internal/predicates";

/**
 * Owned DOM/viewport ports exercise IO intent and history without a browser, filesystem or patched global.
 *
 * Scenarios:
 * 1. Initial qualification, local refusal and recovery retain the last valid request/frame pair and replay undo/redo.
 * 2. Save/load, candidate export, IO failures and presentation controls preserve their separate responsibilities.
 */
export async function test_human_body_anatomical_panel(): Promise<void> {
  const { basis, document } = bodyAnatomicalInspectionFixture();
  if (document.tier !== "detailed") throw new Error("fixture tier");
  const inspect = createHumanBodyAnatomicalInspection(basis);
  type Element = {
    value: string;
    textContent: string;
    disabled: boolean;
    checked: boolean;
    dataset: Record<string, string>;
    files?: { text: () => Promise<string> }[];
    onclick?: () => unknown;
    onchange?: (event?: unknown) => unknown;
    click: () => void;
  };
  const elements = new Map<string, Element>();
  for (const id of ["request-json", "request-status", "request-apply", "request-save", "request-export", "request-undo", "request-redo", "request-load", "request-file", "request-fit", "request-clay", "view"])
    elements.set(id, { value: "", textContent: "", disabled: false, checked: false, dataset: {}, click: () => {} });
  const get = (id: string) => elements.get(id)!;
  const app = {
    querySelector: (selector: string) => get(selector.slice(1)),
    querySelectorAll: () => [get("view")],
  } as unknown as HTMLElement;
  const published: number[] = [];
  const disposed: number[] = [];
  const downloads: { name: string; bytes: BlobPart }[] = [];
  let revision = 0;
  let mode: "normal" | "missing" | "reject" = "normal";
  let exportFailure = false;
  let fitted = 0;
  let camera = 0;
  let clay = false;
  let loaded = 0;
  get("request-file").click = () => { loaded++; };
  // A real Error from another realm does not satisfy this realm's instanceof.
  const externalError: Error = runInNewContext("new Error('transport refused')");
  const panel = mountBodyAnatomicalRequestPanel(app, {
    basis: basis.id,
    viewport: {
      build: async (value) => {
        if (mode === "reject") throw externalError;
        return { revision: ++revision, anatomicalRequest: mode === "missing" ? undefined : inspect(value) };
      },
      publish: (model) => { published.push(model.revision); },
      dispose: (model) => { disposed.push(model.revision); },
      cancel: () => {},
      export: async () => {
        if (exportFailure) throw new Error("export refused");
        return new Uint8Array([1, 2, 3]);
      },
      fitView: () => { fitted++; },
      cameraView: (degrees) => { camera = degrees; },
      setClay: (enabled) => { clay = enabled; },
    },
    download: (name, bytes) => { downloads.push({ name, bytes }); },
  });
  TestValidator.equals("no invented initial person", panel.snapshot(), undefined);
  await get("request-save").onclick!();
  await get("request-export").onclick!();
  await get("request-undo").onclick!();
  TestValidator.equals("no save/export before first pair", downloads, []);
  TestValidator.equals("malformed initial request", await panel.apply("{"), false);
  mode = "missing";
  TestValidator.equals("missing qualification cannot commit", await panel.apply(serializeHumanBodyAnatomicalDocument(document)), false);
  TestValidator.equals("unqualified prepared frame disposed", disposed, [1]);
  mode = "normal";
  TestValidator.equals("first real pair", await panel.apply(serializeHumanBodyAnatomicalDocument(document)), true);
  TestValidator.equals("initial fit once", fitted, 1);
  const original = panel.snapshot()!.model;
  const observed = { ...document, targets: { ...document.targets,
    leftUpperLimb: { upperArm: { humerus: { sphereFittedHeadRadius: { kind: "observed" as const, millimetres: 24, modality: "ct" as const, acquisitionPosture: "supine" as const } } } },
  } };
  TestValidator.equals("observed refusal", await panel.apply(serializeHumanBodyAnatomicalDocument(observed)), false);
  TestValidator.equals("last valid frame retained", panel.snapshot()!.model, original);
  const recovery = { ...document, targets: { ...document.targets,
    leftUpperLimb: { upperArm: { humerus: { sphereFittedHeadRadius: { kind: "target" as const, millimetres: 23 } } } },
  } };
  TestValidator.equals("recovery", await panel.apply(serializeHumanBodyAnatomicalDocument(recovery)), true);
  await get("request-undo").onclick!();
  TestValidator.predicate("undo replays 24 mm", nclose(panel.snapshot()!.model.anatomicalRequest!.candidates[0].radiusMetres, .024));
  await get("request-redo").onclick!();
  TestValidator.predicate("redo replays 23 mm", nclose(panel.snapshot()!.model.anatomicalRequest!.candidates[0].radiusMetres, .023));
  await get("request-save").onclick!();
  TestValidator.equals("save exact current request", downloads[0].bytes, serializeHumanBodyAnatomicalDocument(recovery));
  await get("request-export").onclick!();
  TestValidator.equals("asset explicitly names candidates", downloads[1].name, document.id + ".inspection-candidates.glb");
  exportFailure = true;
  await get("request-export").onclick!();
  TestValidator.equals("export refusal visible", get("request-status").textContent, "export refused");
  mode = "reject";
  TestValidator.equals("foreign-realm Error refused locally", await panel.apply(serializeHumanBodyAnatomicalDocument(document)), false);
  TestValidator.equals("transport message", get("request-status").textContent, "Error: transport refused");
  mode = "normal";
  get("request-file").files = undefined;
  get("request-load").onclick!();
  TestValidator.equals("load invokes the native file chooser", loaded, 1);
  await get("request-file").onchange!();
  get("request-file").files = [{ text: async () => { throw new Error("file refused"); } }];
  await get("request-file").onchange!();
  TestValidator.equals("file IO refusal", get("request-status").textContent, "file refused");
  get("request-file").files = [{ text: async () => serializeHumanBodyAnatomicalDocument(document) }];
  await get("request-file").onchange!();
  TestValidator.equals("file load consumes canonical request", panel.snapshot()!.document, document);
  get("request-json").value = serializeHumanBodyAnatomicalDocument(recovery);
  await get("request-apply").onclick!();
  get("view").dataset.view = "90";
  get("view").onclick!();
  get("request-fit").onclick!();
  get("request-clay").checked = true;
  get("request-clay").onchange!({ currentTarget: get("request-clay") });
  TestValidator.equals("presentation is independent", [camera, clay, fitted], [90, true, 2]);
  TestValidator.predicate("actual publications occurred", published.length >= 5);
}
