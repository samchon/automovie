import {
  type IAutoMovieHumanBodyBasisDocument,
  type IAutoMovieHumanFaceBasisDocument,
  type IAutoMovieHumanPersonDocument,
  createHumanFaceEditor,
  parseHumanPersonDocument,
  serializeHumanPersonDocument,
} from "@automovie/human";

import { renderBodyPosePresets } from "../body/bodyPosePresets";
import { createBodyIntentGate } from "../body/createBodyIntentGate";
import { mountConnectedFaceControls } from "../face/connectedControls";
import type { IConnectedPersonModel } from "./IConnectedPersonModel";
import type { IConnectedPersonPanelProps } from "./IConnectedPersonPanelProps";
import { mountConnectedPersonMeasuredControls } from "./connectedPersonMeasuredControls";
import { mountConnectedPersonBodyControls } from "./mountConnectedPersonBodyControls";
import { connectedPersonPanelMarkup } from "./connectedPersonPanelMarkup";
import { renderConnectedPersonAliasedChannels } from "./renderConnectedPersonAliasedChannels";
import { renderConnectedPersonExpressionPresets } from "./renderConnectedPersonExpressionPresets";

/**
 * Mount the connected person editor: one person document, one transaction
 * history and one viewport, with the body editor's measured, joint and pose
 * controls editing the body subtree and the face editor's shape and
 * expression controls editing the face subtree.
 *
 * Every edit, from either subtree, from the document text or from a loaded
 * file, goes through one `createHumanFaceEditor` over the whole person
 * document, so undo, redo and reset traverse both subtrees in one history,
 * a refused build keeps the last valid person drawn and its document
 * committed, and only the latest request may publish (`createBodyIntentGate`
 * plus the editor's own generation). The face controls list the head view's
 * channels without its driver channels, which the body owns. The body
 * controls show every body view channel: one with an unavailable endpoint is
 * listed disabled with the missing target named, and an envelope-limited
 * channel's row states where its reach ends and why; a measured target past
 * the reach, or a document asking for a missing target, is refused by name
 * and the committed person stays. The standard document asks for none of
 * them. Save writes the
 * committed document; Export GLB exports it and is discarded if the committed
 * model changed meanwhile. The panel evaluates nothing itself.
 *
 * @evidence requirements/actors/body-authoring/contract.md#actor-body-editor Edits the person's body subtree with the body editor's measured, joint and pose controls.
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-editor Edits the person's face subtree with the face editor's shape and expression controls.
 * @evidence specifications/asset-and-representation/body-authoring/contract.md#body-spec-editor Runs body edits through one transaction history and worker, keeping the last valid person on a failure.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-editor Runs face edits through the same transaction owner so a refused edit keeps the last valid state.
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-editor-state Keeps the last valid person document and model when a face or body edit is refused or superseded.
 * @evidenceExclude requirements/actors/body-authoring/README.md#body-requirements The person panel is one editing screen; the body domain index also spans extraction, evaluation and review owned elsewhere.
 * @evidenceExclude requirements/actors/body-authoring/contract.md#actor-body-connected-basis The panel evaluates no body endpoint or corrective; the person builder in the worker does.
 * @evidenceExclude requirements/actors/body-authoring/contract.md#actor-body-joints The panel writes joint rows and articulates nothing; the person builder resolves and skins the pose.
 * @evidenceExclude requirements/actors/body-authoring/contract.md#actor-body-simple-shape The person editor offers no simple-tier inputs; the body editor owns that tier.
 * @evidenceExclude requirements/actors/body-authoring/contract.md#actor-body-underwear The person editor offers no underwear selection.
 * @evidenceExclude requirements/actors/body-authoring/contract.md#actor-body-export The person editor exports a whole-person file, not the body file this unit defines.
 * @evidenceExclude requirements/actors/facial-authoring/contract.md#actor-face-connected-basis The panel evaluates no face endpoint; the person builder replays the head view.
 * @evidenceExclude requirements/actors/facial-authoring/contract.md#actor-face-export The person editor exports a whole-person file, not the face file this unit defines.
 * @evidenceExclude specifications/asset-and-representation/body-authoring/README.md#body-specifications The person panel owns its editing screen boundary only.
 * @evidenceExclude specifications/asset-and-representation/body-authoring/contract.md#body-spec-basis The panel performs no body basis evaluation.
 * @evidenceExclude specifications/asset-and-representation/body-authoring/contract.md#body-spec-joints The panel performs no skinning or pose resolution.
 * @evidenceExclude specifications/asset-and-representation/body-authoring/contract.md#body-spec-simple-shape The person editor runs no simple-tier expansion or inversion.
 * @evidenceExclude specifications/asset-and-representation/body-authoring/contract.md#body-spec-underwear The person editor evaluates no underwear region.
 * @evidenceExclude specifications/asset-and-representation/body-authoring/contract.md#body-spec-export The person editor serializes no body file.
 * @evidenceExclude specifications/asset-and-representation/facial-authoring/contract.md#face-spec-connected-basis The panel compiles no face basis; the person generation does.
 * @evidenceExclude specifications/asset-and-representation/facial-authoring/contract.md#face-spec-connected-iris The person editor offers no iris pigment control.
 * @evidenceExclude specifications/asset-and-representation/facial-authoring/contract.md#face-spec-connected-fibre The person editor offers no fibre-card pigment or density control.
 * @evidenceExclude specifications/asset-and-representation/facial-authoring/contract.md#face-spec-connected-occlusion The person editor bakes no ambient occlusion.
 * @evidenceExclude specifications/asset-and-representation/facial-authoring/contract.md#face-spec-export The person editor serializes no face file.
 * @author Samchon
 */
export function mountConnectedPersonPanel<Model extends IConnectedPersonModel>(
  app: HTMLElement,
  props: IConnectedPersonPanelProps<Model>,
) {
  const dom = app.ownerDocument;
  app.innerHTML = connectedPersonPanelMarkup();
  const element = <T extends HTMLElement>(id: string): T => app.querySelector<T>("#" + id)!;
  const bodySection = element("body-section");
  const faceSection = element("face-section");
  const viewport = props.viewport(element<HTMLCanvasElement>("person-canvas"));
  let editor: ReturnType<typeof createHumanFaceEditor<Model, IAutoMovieHumanPersonDocument>> | undefined;
  let draft = structuredClone(props.initial);
  const intents = createBodyIntentGate();
  const status = (text: string, state: string): void => {
    element("person-status").textContent = text;
    element("person-status").dataset.state = state;
  };
  const report = (text: string): void => {
    element("person-status").textContent += String.fromCharCode(10) + text;
  };
  const withdraw = (): number => {
    editor?.cancel();
    viewport.cancel();
    return intents.reserve();
  };
  const refuse = (error: unknown): void => {
    withdraw();
    if (editor !== undefined) draft = editor.snapshot().document;
    status(error instanceof Error ? error.message : String(error), "error");
    renderAll();
  };
  const refresh = (): void => {
    const state = editor!.snapshot();
    draft = state.document;
    status(
      state.error ??
        `${state.document.name}\n${state.model.parts} material regions · committed person document`,
      state.status,
    );
    element<HTMLButtonElement>("person-undo").disabled = !state.canUndo;
    element<HTMLButtonElement>("person-redo").disabled = !state.canRedo;
    element<HTMLTextAreaElement>("document-json").value = serializeHumanPersonDocument(state.document);
    renderAll();
    if (measured !== state.document) {
      measured = state.document;
      personMeasurements.refresh();
    }
  };
  const change = async (
    next: IAutoMovieHumanPersonDocument,
    ticket: number = withdraw(),
  ): Promise<boolean> => {
    if (!intents.isCurrent(ticket)) return false;
    draft = structuredClone(next);
    status("Building the latest person…", "building");
    const success = await editor!.edit(next);
    if (!intents.isCurrent(ticket)) return false;
    if (success) viewport.publish(editor!.snapshot().model);
    refresh();
    return success;
  };
  const withBody = (body: IAutoMovieHumanBodyBasisDocument): IAutoMovieHumanPersonDocument => ({
    ...structuredClone(draft),
    body: structuredClone(body),
  });
  const withFace = (face: IAutoMovieHumanFaceBasisDocument): IAutoMovieHumanPersonDocument => ({
    ...structuredClone(draft),
    face: structuredClone(face),
  });
  const applyText = async (text: string, ticket = withdraw()): Promise<void> => {
    try {
      if (intents.isCurrent(ticket)) await change(parseHumanPersonDocument(text), ticket);
    } catch (error) {
      if (intents.isCurrent(ticket)) refuse(error);
    }
  };
  const personMeasurements = mountConnectedPersonMeasuredControls({
    dom,
    container: bodySection.querySelector<HTMLElement>('[data-role="person-measurements"]')!,
    current: () => draft,
    reserve: withdraw,
    isCurrent: intents.isCurrent,
    read: props.readPersonMeasurement,
    solve: props.solvePersonMeasurement,
    change: (next, ticket) => change(next, ticket),
    busy: (text) => status(text, "building"),
    report,
    refuse,
  });
  const bodyControls = mountConnectedPersonBodyControls({
    dom,
    section: bodySection,
    body: props.body,
    current: () => draft.body,
    reserve: withdraw,
    isCurrent: intents.isCurrent,
    solve: props.solveMeasurement,
    change: (next, ticket) => change(withBody(next), ticket),
    busy: (text) => status(text, "building"),
    report,
    refuse,
  });
  // The face controls list the head view's own channels. Driver channels carry
  // the body's gains and are never edited from the face. An aliased face
  // channel is defined once by its body channel: it is listed disabled with
  // that owner named, and a document stating it is refused by name.
  const drivers = new Set(
    props.face.channels.filter((channel) => channel.id.startsWith("driver:")).map((channel) => channel.id),
  );
  const aliased = new Set(props.aliases.map((alias) => alias.face));
  const faceControls = mountConnectedFaceControls(faceSection, {
    basis: {
      ...props.face,
      channels: props.face.channels.filter((channel) => !drivers.has(channel.id) && !aliased.has(channel.id)),
    },
    document: () => draft.face,
    change: async (face) => { await change(withFace(face)); },
    refuse,
  });
  renderConnectedPersonAliasedChannels(dom, faceSection, props.aliases);
  const renderAll = (): void => {
    bodyControls.render();
    faceControls.refresh();
  };
  // a committed person changes its measurements; a refusal does not
  let measured: IAutoMovieHumanPersonDocument | undefined;
  for (const button of app.querySelectorAll<HTMLButtonElement>("[data-view]"))
    button.onclick = () => viewport.cameraView(Number(button.dataset.view));
  element("fit-view").onclick = () => viewport.fitView();
  element<HTMLInputElement>("clay").onchange = () =>
    viewport.setClay(element<HTMLInputElement>("clay").checked);
  element<HTMLInputElement>("shadows").onchange = () =>
    viewport.setShadows(element<HTMLInputElement>("shadows").checked);
  for (const action of ["undo", "redo", "reset"] as const)
    element("person-" + action).onclick = async () => {
      const ticket = withdraw();
      status("Restoring the selected person…", "building");
      const success = await editor![action]();
      if (!intents.isCurrent(ticket)) return;
      if (success) viewport.publish(editor!.snapshot().model);
      refresh();
    };
  renderBodyPosePresets({
    dom,
    container: element("pose-presets"),
    presets: props.poses,
    current: () => draft.body,
    reserve: withdraw,
    isCurrent: intents.isCurrent,
    apply: (body, ticket) => void change(withBody(body), ticket),
    refuse,
    busy: (text) => status(text, "building"),
  });
  renderConnectedPersonExpressionPresets(dom, element("expression-presets"), props.expressions, (expression) =>
    void change(withFace({ ...structuredClone(draft.face), expression })),
  );
  element("document-apply").onclick = () => {
    const ticket = withdraw();
    void applyText(element<HTMLTextAreaElement>("document-json").value, ticket);
  };
  element("person-save").onclick = () => {
    const document = editor!.snapshot().document;
    props.download(document.id + ".json", serializeHumanPersonDocument(document), "application/json");
  };
  element("person-glb").onclick = async () => {
    const state = editor!.snapshot();
    const ticket = intents.currentTicket();
    try {
      const bytes = await viewport.export(state.document);
      if (intents.isCurrent(ticket) && editor!.snapshot().model === state.model)
        props.download(state.document.id + ".glb", bytes, "model/gltf-binary");
    } catch (error) {
      if (intents.isCurrent(ticket)) refuse(error);
    }
  };
  element("person-load").onclick = () => element<HTMLInputElement>("person-file").click();
  element<HTMLInputElement>("person-file").onchange = async () => {
    const input = element<HTMLInputElement>("person-file");
    const file = input.files?.[0];
    if (file === undefined) return;
    input.value = "";
    const ticket = withdraw();
    try {
      const text = await file.text();
      if (intents.isCurrent(ticket)) await applyText(text, ticket);
    } catch (error) {
      if (intents.isCurrent(ticket)) refuse(error);
    }
  };
  const ready = (async (): Promise<void> => {
    const ticket = intents.reserve();
    try {
      const model = await viewport.build(props.initial);
      if (!intents.isCurrent(ticket)) {
        viewport.dispose(model);
        return;
      }
      editor = createHumanFaceEditor({ document: props.initial, model, build: viewport.build });
      viewport.publish(model);
      viewport.fitView();
      element<HTMLFieldSetElement>("editing").disabled = false;
      refresh();
    } catch (error) {
      if (intents.isCurrent(ticket)) refuse(error);
    }
  })();
  return {
    ready,
    snapshot: () => editor?.snapshot(),
    change: (document: IAutoMovieHumanPersonDocument) => change(document),
  };
}
