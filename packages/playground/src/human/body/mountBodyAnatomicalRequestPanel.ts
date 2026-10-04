import type { IAutoMovieHumanBodyAnatomicalInspection } from "@automovie/human/body/anatomy/generated/IAutoMovieHumanBodyAnatomicalInspection";
import { parseHumanBodyAnatomicalDocument } from "@automovie/human/body/document/parseHumanBodyAnatomicalDocument";
import { serializeHumanBodyAnatomicalDocument } from "@automovie/human/body/document/serializeHumanBodyAnatomicalDocument";
import type { IAutoMovieHumanBodyAnatomicalDocument } from "@automovie/human/body/structures/IAutoMovieHumanBodyAnatomicalDocument";
import { createHumanFaceEditor } from "@automovie/human/face/editor/createHumanFaceEditor";

import { createBodyIntentGate } from "./createBodyIntentGate";

/**
 * Edit one numerical request and publish its qualified candidate-only frame.
 * The first admitted build establishes the initial transaction; later failures
 * retain that document, frame and undo history. File reads reserve intent before
 * waiting, and explicit candidate export never becomes a whole-body save.
 *
 * @evidence requirements/actors/body-authoring/contract.md#actor-body-editor Provides numerical request IO and the existing generic history transaction around actual candidate previews.
 * @evidence specifications/asset-and-representation/body-authoring/contract.md#body-spec-editor Commits only current admitted request/frame pairs and preserves the last valid pair after refusal.
 * @evidence requirements/actors/body-authoring/contract.md#actor-body-export Names the static output as inspection candidates independently of the canonical numerical document.
 * @evidence specifications/asset-and-representation/body-authoring/contract.md#body-spec-export Uses explicit committed-document export and leaves GLB encoding to the worker.
 */
export function mountBodyAnatomicalRequestPanel<Model extends {
  anatomicalRequest?: IAutoMovieHumanBodyAnatomicalInspection;
}>(app: HTMLElement, props: {
  basis: string;
  viewport: {
    build: (document: IAutoMovieHumanBodyAnatomicalDocument) => Promise<Model>;
    publish: (model: Model) => void;
    dispose: (model: Model) => void;
    cancel: () => void;
    export: (document: IAutoMovieHumanBodyAnatomicalDocument) => Promise<Uint8Array<ArrayBuffer>>;
    fitView: () => void;
    cameraView: (degrees: number) => void;
    setClay: (enabled: boolean) => void;
  };
  download: (name: string, bytes: BlobPart, mime: string) => void;
}) {
  let editor: ReturnType<typeof createHumanFaceEditor<Model, IAutoMovieHumanBodyAnatomicalDocument>> | undefined;
  const intents = createBodyIntentGate();
  const element = <T extends HTMLElement>(id: string) => app.querySelector<T>("#" + id)!;
  const text = element<HTMLTextAreaElement>("request-json");
  const status = (message: string, state: string) => {
    element("request-status").textContent = message;
    element("request-status").dataset.state = state;
  };
  const withdraw = () => {
    editor?.cancel();
    props.viewport.cancel();
    return intents.reserve();
  };
  const refresh = (replaceText: boolean) => {
    const snapshot = editor?.snapshot();
    for (const id of ["request-save", "request-export"])
      element<HTMLButtonElement>(id).disabled = snapshot === undefined;
    element<HTMLButtonElement>("request-undo").disabled = !snapshot?.canUndo;
    element<HTMLButtonElement>("request-redo").disabled = !snapshot?.canRedo;
    if (snapshot === undefined) return;
    if (replaceText) text.value = serializeHumanBodyAnatomicalDocument(snapshot.document);
    if (snapshot.error !== null) {
      status(snapshot.error, "error");
      return;
    }
    const report = snapshot.model.anatomicalRequest!;
    status([
      "Target spheres only. Reference rig: " + report.reference.basis,
      "Requested skin and complete bones: unavailable (geometry not validated).",
      ...report.candidates.map((head) => `${head.part}: ${head.radiusMetres * 1000} mm target radius, reference-rig-only centre (${head.center.x}, ${head.center.y}, ${head.center.z}) m`),
    ].join("\n"), "ready");
  };
  const build = async (document: IAutoMovieHumanBodyAnatomicalDocument) => {
    const ticket = intents.currentTicket();
    const model = await props.viewport.build(document);
    // The history owner withdraws publication, but only this viewport adapter
    // can release a prepared frame that finished after a newer user intent.
    if (!intents.isCurrent(ticket)) {
      props.viewport.dispose(model);
      throw new Error("Superseded numerical inspection build.");
    }
    if (model.anatomicalRequest === undefined) {
      props.viewport.dispose(model);
      throw new Error("The worker supplied no numerical inspection qualification.");
    }
    return model;
  };
  const apply = async (value: string, ticket = withdraw()) => {
    try {
      const document = parseHumanBodyAnatomicalDocument(value);
      if (!intents.isCurrent(ticket)) return false;
      status("Building target-sphere candidates…", "building");
      if (editor === undefined) {
        const model = await build(document);
        if (!intents.isCurrent(ticket)) {
          props.viewport.dispose(model);
          return false;
        }
        editor = createHumanFaceEditor({ document, model, build });
        props.viewport.publish(model);
        props.viewport.fitView();
        refresh(true);
        return true;
      }
      const success = await editor.edit(document);
      if (!intents.isCurrent(ticket)) return false;
      if (success) props.viewport.publish(editor.snapshot().model);
      refresh(success);
      return success;
    } catch (error) {
      if (intents.isCurrent(ticket)) {
        refresh(false);
        status(error instanceof Error ? error.message : String(error), "error");
      }
      return false;
    }
  };
  element<HTMLButtonElement>("request-apply").onclick = () => apply(text.value);
  element<HTMLButtonElement>("request-save").onclick = () => {
    if (editor === undefined) return;
    const document = editor.snapshot().document;
    props.download(document.id + ".json", serializeHumanBodyAnatomicalDocument(document), "application/json");
  };
  element<HTMLButtonElement>("request-export").onclick = async () => {
    if (editor === undefined) return;
    const snapshot = editor.snapshot();
    const ticket = intents.currentTicket();
    try {
      const bytes = await props.viewport.export(snapshot.document);
      if (intents.isCurrent(ticket) && editor.snapshot().model === snapshot.model)
        props.download(snapshot.document.id + ".inspection-candidates.glb", bytes, "model/gltf-binary");
    } catch (error) {
      if (intents.isCurrent(ticket)) status(error instanceof Error ? error.message : String(error), "error");
    }
  };
  for (const direction of ["undo", "redo"] as const)
    element<HTMLButtonElement>("request-" + direction).onclick = async () => {
      if (editor === undefined) return;
      const ticket = withdraw();
      const success = await editor[direction]();
      if (intents.isCurrent(ticket)) {
        if (success) props.viewport.publish(editor.snapshot().model);
        refresh(success);
      }
    };
  const file = element<HTMLInputElement>("request-file");
  element("request-load").onclick = () => file.click();
  file.onchange = async () => {
    const selected = file.files?.[0];
    if (selected === undefined) return;
    const ticket = withdraw();
    try {
      const value = await selected.text();
      if (intents.isCurrent(ticket)) {
        text.value = value;
        await apply(value, ticket);
      }
    } catch (error) {
      if (intents.isCurrent(ticket)) status(error instanceof Error ? error.message : String(error), "error");
    }
    file.value = "";
  };
  for (const button of app.querySelectorAll<HTMLButtonElement>("[data-view]"))
    button.onclick = () => props.viewport.cameraView(Number(button.dataset.view));
  element("request-fit").onclick = props.viewport.fitView;
  element<HTMLInputElement>("request-clay").onchange = (event) => props.viewport.setClay((event.currentTarget as HTMLInputElement).checked);
  status("Load or enter a complete request. Reference basis: " + props.basis, "ready");
  refresh(false);
  return { apply, snapshot: () => editor?.snapshot() };
}
