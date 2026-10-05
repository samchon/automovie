import {
  type IAutoMovieHumanBodyBasisDocument,
  type IAutoMovieHumanFaceBasisDocument,
  type IAutoMovieHumanPersonDocument,
  createHumanFaceEditor,
  measureHumanBodyBasisChannels,
  parseHumanPersonDocument,
  serializeHumanPersonDocument,
} from "@automovie/human";
import type { AutoMovieHumanoidBone } from "@automovie/interface";

import { renderBodyMeasuredControls } from "../body/bodyMeasuredControls";
import { bodyMeasuredGroups } from "../body/bodyMeasuredGroups";
import { renderBodyPosePresets } from "../body/bodyPosePresets";
import { createBodyIntentGate } from "../body/createBodyIntentGate";
import { mountBodyJointControls } from "../body/mountBodyJointControls";
import { mountConnectedFaceControls } from "../face/connectedControls";
import type { IConnectedPersonModel } from "./IConnectedPersonModel";
import type { IConnectedPersonPanelProps } from "./IConnectedPersonPanelProps";
import { connectedPersonPanelMarkup } from "./connectedPersonPanelMarkup";

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
 * channels without its driver channels, which the body owns; the body
 * controls offer the body view's channels within the domain the generation
 * can evaluate (no channel with an unavailable endpoint, and none beyond the
 * onset of an unavailable envelope corrective). Save writes the
 * committed document; Export GLB exports it and is discarded if the committed
 * model changed meanwhile. The panel evaluates nothing itself.
 *
 * @author Samchon
 */
export function mountConnectedPersonPanel<Model extends IConnectedPersonModel>(
  app: HTMLElement,
  props: IConnectedPersonPanelProps<Model>,
) {
  const dom = app.ownerDocument;
  // The body controls offer only the domain the generation can evaluate. A
  // channel whose own endpoint is unavailable is not offered; a channel whose
  // envelope corrective is unavailable is offered up to that corrective's
  // onset, beyond which the runtime refuses it by name (the document text can
  // still ask for it).
  const unavailable = new Set(props.body.unavailableTargets ?? []);
  const onset = (channel: string, side: "positive" | "negative"): number => {
    let limit = Infinity;
    for (const corrective of props.body.correctives ?? [])
      if (unavailable.has(corrective.target))
        for (const input of corrective.inputs)
          if ("channel" in input && input.channel === channel && input.side === side)
            limit = Math.min(limit, input.onset ?? 0);
    return limit;
  };
  const bodyControlsBasis = {
    ...props.body,
    channels: props.body.channels
      .filter((channel) => !unavailable.has(channel.positive) && (channel.negative === null || !unavailable.has(channel.negative)))
      .map((channel) => ({
        ...channel,
        maximum: Math.min(channel.maximum, onset(channel.id, "positive")),
        minimum: Math.max(channel.minimum, -onset(channel.id, "negative")),
      })),
  };
  const scales = new Map(
    measureHumanBodyBasisChannels(bodyControlsBasis, { measuredOnly: true }).map(
      (scale) => [scale.id, scale],
    ),
  );
  app.innerHTML = connectedPersonPanelMarkup(bodyMeasuredGroups(bodyControlsBasis.channels, scales));
  const element = <T extends HTMLElement>(id: string): T => app.querySelector<T>("#" + id)!;
  const bodySection = element("body-section");
  const faceSection = element("face-section");
  const viewport = props.viewport(element<HTMLCanvasElement>("person-canvas"));
  let editor: ReturnType<typeof createHumanFaceEditor<Model, IAutoMovieHumanPersonDocument>> | undefined;
  let draft = structuredClone(props.initial);
  const intents = createBodyIntentGate();
  const measurementDrafts = new Map<string, string>();
  let bone: AutoMovieHumanoidBone = "neck";
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
  const bodyControls = (): void => {
    const kind = bodySection.querySelector<HTMLSelectElement>("#control-kind")!.value;
    const query = bodySearch.value.toLowerCase().replace(/\s/g, "");
    const container = bodySection.querySelector<HTMLElement>("#basis-controls")!;
    container.replaceChildren();
    if (kind === "pose") {
      mountBodyJointControls({
        dom,
        container,
        basis: props.body,
        bone,
        query,
        current: () => draft.body,
        select: (selected) => { bone = selected; },
        redraw: bodyControls,
        change: (next) => { void change(withBody(next)); },
        refuse,
      });
      return;
    }
    renderBodyMeasuredControls({
      dom,
      container,
      basis: bodyControlsBasis,
      scales,
      kind,
      query,
      drafts: measurementDrafts,
      current: () => draft.body,
      reserve: withdraw,
      isCurrent: intents.isCurrent,
      solve: props.solveMeasurement,
      change: (next, ticket) => change(withBody(next), ticket),
      busy: (text) => status(text, "building"),
      report,
      refuse,
    });
  };
  const bodySearch = dom.createElement("input");
  bodySearch.type = "search";
  bodySearch.placeholder = "Find a body control: neck, waist, shoulder, knee…";
  bodySearch.setAttribute("aria-label", "Find a body control");
  bodySearch.style.width = "100%";
  bodySearch.oninput = bodyControls;
  bodySection.querySelector("#basis-controls")!.before(bodySearch);
  bodySection.querySelector<HTMLSelectElement>("#control-kind")!.onchange = bodyControls;
  // The face controls list the head view's own channels; the driver channels
  // carry the body's gains and are never edited from the face.
  const drivers = new Set(
    props.face.channels.filter((channel) => channel.id.startsWith("driver:")).map((channel) => channel.id),
  );
  const faceControls = mountConnectedFaceControls(faceSection, {
    basis: { ...props.face, channels: props.face.channels.filter((channel) => !drivers.has(channel.id)) },
    document: () => draft.face,
    change: async (face) => { await change(withFace(face)); },
    refuse,
  });
  const renderAll = (): void => {
    bodyControls();
    faceControls.refresh();
  };
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
  for (const preset of props.expressions) {
    const button = dom.createElement("button");
    button.textContent = preset.name;
    button.onclick = () =>
      void change(withFace({ ...structuredClone(draft.face), expression: structuredClone(preset.expression) }));
    element("expression-presets").append(button);
  }
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
