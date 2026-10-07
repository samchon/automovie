/**
 * Browser adapter for the connected body basis, sharing the face editor's
 * transaction and viewport owners. This panel owns only DOM inputs, draft
 * composition and file-read generations. `bodyMeasuredControls` accepts
 * measured targets; vertex displacement statistics are not input controls.
 * The package validates controls, forms and
 * skins the model and exports it; camera and clay state never enter the
 * document, and neither does the face shown beside the body.
 *
 * The body is a person generation's body view, which may declare unavailable
 * source targets. The panel reads what it can evaluate once through
 * `connectedBodyReach`: measurements, groups and controls use that
 * reach, a channel limited by an unavailable corrective states where its
 * reach ends and why, and a channel with an unavailable endpoint is listed
 * disabled with the target named. A request past the reach is refused by
 * name and the committed body stays.
 */
import type { IAutoMovieHumanBodyBasisDocument } from "@automovie/human";
import { HUMAN_BODY_SIMPLE_POSTURE } from "@automovie/human/body/constants/HUMAN_BODY_SIMPLE_POSTURE";
import { parseHumanBodyBasisDocument } from "@automovie/human/body/document/parseHumanBodyBasisDocument";
import { serializeHumanBodyBasisDocument } from "@automovie/human/body/document/serializeHumanBodyBasisDocument";
import { measureHumanBodyBasisChannels } from "@automovie/human/body/measure/measureHumanBodyBasisChannels";
import { humanBodySimplePosture } from "@automovie/human/body/simple/humanBodySimplePosture";
import { createHumanFaceEditor } from "@automovie/human/face/editor/createHumanFaceEditor";
import type { AutoMovieHumanoidBone } from "@automovie/interface";

import { connectedBodyReach } from "../common/connectedBodyReach";
import type { IConnectedBodyHumeralSlot } from "./IConnectedBodyHumeralSlot";
import type { IConnectedBodyPanelModel } from "./IConnectedBodyPanelModel";
import type { IConnectedBodyPanelProps } from "./IConnectedBodyPanelProps";
import { bodyAnatomyReading } from "./bodyAnatomyReading";
import { createBodyContactWatch } from "./bodyContactWatch";
import { bodyFemoralReading } from "./bodyFemoralReading";
import { bodyGroundReading } from "./bodyGroundReading";
import { renderBodyHumeralHeadControls } from "./bodyHumeralHeadControls";
import { bodyMeasuredGroups } from "./bodyMeasuredGroups";
import { renderBodyPosePresets } from "./bodyPosePresets";
import { renderBodySimpleControls } from "./bodySimpleControls";
import { connectedBodyPanelMarkup } from "./connectedBodyPanelMarkup";
import { createBodyIntentGate } from "./createBodyIntentGate";
import { mountBodyUnderwearSelect } from "./mountBodyUnderwearSelect";
import { renderConnectedBodyControls } from "./renderConnectedBodyControls";
import { setConnectedBodyPreparing } from "./setConnectedBodyPreparing";

/**
 * Mount the body's shape, measurement and pose controls around an injected
 * numerical viewport. Weight ranges, measurement rules, joint ranges and rest
 * angles all come from the admitted basis; the panel formats and binds them.
 *
 * @evidence requirements/actors/body-authoring/contract.md#actor-body-editor Provides grouped shape controls in millimetres where a rule exists, clinical joint controls, the simple tier, presets, history, file IO, contact check and orbit/clay/face display for one connected body.
 * @evidence requirements/actors/body-authoring/contract.md#actor-body-measurements Accepts a measured target in millimetres and shows its neutral and source endpoint readings while the worker solves the current body.
 * @evidence specifications/asset-and-representation/body-authoring/contract.md#body-spec-editor-view Binds scalar controls to numerical edits, states each control's envelope and measured effect, and keeps camera, clay and the companion face outside replay data.
 * @evidence specifications/asset-and-representation/body-authoring/contract.md#body-spec-editor Shares the face's transactional history and cancels stale file reads and builds by generation.
 * @evidenceExclude requirements/actors/body-authoring/README.md#body-requirements The panel is the editing screen alone; extraction, the package evaluator and the census review are other owners of this domain index.
 * @evidenceExclude requirements/actors/body-authoring/contract.md#actor-body-connected-basis The panel evaluates no basis endpoint or corrective row; the package builder in the worker does.
 * @evidenceExclude requirements/actors/body-authoring/contract.md#actor-body-joints The panel articulates no joint and applies no skin weight; it binds inputs to the document the builder evaluates.
 * @evidenceExclude requirements/actors/body-authoring/contract.md#actor-body-document The panel serializes and parses through the package's document functions and owns no admission rule.
 * @evidenceExclude specifications/asset-and-representation/body-authoring/README.md#body-specifications The panel owns the editing screen boundary only.
 * @evidenceExclude specifications/asset-and-representation/body-authoring/contract.md#body-spec-basis The panel performs no basis evaluation.
 * @evidenceExclude specifications/asset-and-representation/body-authoring/contract.md#body-spec-joints The panel performs no skinning or pose resolution.
 * @evidenceExclude specifications/asset-and-representation/body-authoring/contract.md#body-spec-measurements The panel displays precomputed endpoint readings through bodyMeasuredControls; the package owns the measurement rule, current-body reading and inverse.
 * @evidenceExclude specifications/asset-and-representation/body-authoring/contract.md#body-spec-document The panel calls the package's parse and serialize functions.
 * @evidenceExclude requirements/actors/body-authoring/contract.md#actor-body-underwear The panel selects the document's style, while the package builder owns the garment's anatomical cut and posed skin attachment.
 * @evidenceExclude specifications/asset-and-representation/body-authoring/contract.md#body-spec-underwear The panel evaluates no underwear region, clip or lift.
 */
export function mountConnectedBodyPanel<Model extends IConnectedBodyPanelModel>(
  app: HTMLElement,
  props: IConnectedBodyPanelProps<Model>,
) {
  const dom = app.ownerDocument;
  // Unavailable source targets are shown, never hidden (renderConnectedBodyControls).
  const reach = connectedBodyReach(props.basis);
  const scales = new Map(
    measureHumanBodyBasisChannels(reach.basis, { measuredOnly: true }).map(
      (scale) => [scale.id, scale],
    ),
  );
  const groups = bodyMeasuredGroups(reach.basis.channels, scales);
  app.innerHTML = connectedBodyPanelMarkup(groups);
  const element = <T extends HTMLElement>(id: string): T =>
    app.querySelector<T>("#" + id)!;
  const controlKind = app.querySelector<HTMLSelectElement>(
    '[data-role="control-kind"]',
  )!;
  const basisControls = app.querySelector<HTMLElement>(
    '[data-role="basis-controls"]',
  )!;
  const underwear = mountBodyUnderwearSelect(dom, element("editing"));
  const viewport = props.viewport(element<HTMLCanvasElement>("body-canvas"));
  let editor:
    | ReturnType<
        typeof createHumanFaceEditor<Model, IAutoMovieHumanBodyBasisDocument>
      >
    | undefined;
  const humeral: IConnectedBodyHumeralSlot = {};
  let draft = structuredClone(props.initial);
  const intents = createBodyIntentGate();
  // Typed measurement targets are UI drafts. A committed pose rebuilds rows
  // without converting an unfinished number into document geometry.
  const measurementDrafts = new Map<string, string>();
  let bone: AutoMovieHumanoidBone = "leftUpperArm";
  const status = (text: string, state: string): void => {
    element("body-status").textContent = text;
    element("body-status").dataset.state = state;
  };
  const withdraw = (): number => {
    editor?.cancel();
    viewport.cancel();
    return intents.reserve();
  };
  const refuse = (error: unknown): void => {
    withdraw();
    if (editor !== undefined) draft = editor.snapshot().document;
    humeral.controls?.refresh(draft.humeralHeads, true);
    status(error instanceof Error ? error.message : String(error), "error");
  };
  const contacts = createBodyContactWatch({
    build: viewport.build,
    dispose: viewport.dispose,
    isCurrent: intents.isCurrent,
    report: (text) => {
      element("body-status").textContent += String.fromCharCode(10) + text;
    },
  });
  const show = (model: Model): void => {
    viewport.publish(model);
    props.seat(
      element<HTMLInputElement>("face").checked ? model : null,
      editor?.snapshot().document ?? draft,
    );
  };
  const refresh = (): void => {
    const state = editor!.snapshot();
    draft = state.document;
    status(
      state.error ??
        `${state.document.name}\n${state.model.parts} material regions · ${(state.document.pose?.length ?? 0) + (state.document.shoulders?.length ?? 0)} posed joints · committed numerical state`,
      state.status,
    );
    element<HTMLButtonElement>("body-undo").disabled = !state.canUndo;
    element<HTMLButtonElement>("body-redo").disabled = !state.canRedo;
    element<HTMLTextAreaElement>("document-json").value =
      serializeHumanBodyBasisDocument(
        state.document,
        props.basis.anatomicalAssembly,
      );
    underwear.value = state.document.underwear?.style ?? "";
    humeral.controls?.refresh(state.document.humeralHeads);
    void simple.refresh({
      shape: state.document.shape,
      ...(state.document.anatomy === undefined
        ? {}
        : { anatomy: state.document.anatomy }),
    });
    renderControls();
  };
  const change = async (
    next: IAutoMovieHumanBodyBasisDocument,
    ticket: number = withdraw(),
  ): Promise<boolean> => {
    if (!intents.isCurrent(ticket)) return false;
    draft = structuredClone(next);
    status("Building the latest body…", "building");
    const success = await editor!.edit(next);
    if (!intents.isCurrent(ticket)) return false;
    if (success) show(editor!.snapshot().model);
    refresh();
    if (!success)
      humeral.controls?.refresh(editor!.snapshot().document.humeralHeads, true);
    if (success) void contacts.after(editor!.snapshot().document, ticket);
    return success;
  };
  const applyText = async (
    text: string,
    ticket = withdraw(),
  ): Promise<void> => {
    try {
      if (intents.isCurrent(ticket))
        await change(
          parseHumanBodyBasisDocument(text, props.basis.anatomicalAssembly),
          ticket,
        );
    } catch (error) {
      if (intents.isCurrent(ticket)) refuse(error);
    }
  };
  const renderControls = (): void =>
    renderConnectedBodyControls({
      dom,
      container: basisControls,
      kind: () => controlKind.value,
      query: () =>
        element<HTMLInputElement>("body-control-search")
          .value.toLowerCase()
          .replace(/\s/g, ""),
      basis: props.basis,
      reach,
      scales,
      drafts: measurementDrafts,
      bone: () => bone,
      select: (selected) => {
        bone = selected;
      },
      current: () => draft,
      change,
      reserve: withdraw,
      isCurrent: intents.isCurrent,
      solve: props.simple.solveMeasurement,
      busy: (text) => status(text, "building"),
      report: (text) => {
        element("body-status").textContent += String.fromCharCode(10) + text;
      },
      refuse,
    });
  for (const button of app.querySelectorAll<HTMLButtonElement>("[data-view]"))
    button.onclick = () => viewport.cameraView(Number(button.dataset.view));
  element("fit-view").onclick = viewport.fitView;
  element<HTMLInputElement>("clay").onchange = () =>
    viewport.setClay(element<HTMLInputElement>("clay").checked);
  element<HTMLInputElement>("shadows").onchange = () =>
    viewport.setShadows(element<HTMLInputElement>("shadows").checked);
  element<HTMLInputElement>("face").onchange = () => {
    if (editor !== undefined) show(editor.snapshot().model);
  };
  underwear.onchange = () => {
    const next = structuredClone(draft);
    if (underwear.value === "") delete next.underwear;
    else
      next.underwear = {
        ...next.underwear,
        style: underwear.value as NonNullable<typeof next.underwear>["style"],
      };
    void change(next);
  };
  controlKind.onchange = renderControls;
  const search = dom.createElement("input");
  search.id = "body-control-search";
  search.type = "search";
  search.placeholder = "Find a control: waist, hip, shoulder, knee…";
  search.setAttribute("aria-label", "Find a body control");
  search.style.width = "100%";
  search.oninput = renderControls;
  basisControls.before(search);
  for (const action of ["undo", "redo", "reset"] as const)
    element("body-" + action).onclick = async () => {
      const ticket = withdraw();
      status("Restoring the selected body…", "building");
      const success = await editor![action]();
      if (!intents.isCurrent(ticket)) return;
      if (success) show(editor!.snapshot().model);
      refresh();
    };
  // the trunk's joints the age posture bends, which pose presets keep
  const standing: string[] = [
    ...HUMAN_BODY_SIMPLE_POSTURE.thoracic.map(([bone]) => bone),
    HUMAN_BODY_SIMPLE_POSTURE.compensation,
  ];
  const simple = renderBodySimpleControls({
    dom,
    container: element("simple-controls"),
    expand: props.simple.expand,
    project: props.simple.project,
    wholeSource: props.simple.wholeSource,
    current: () => ({
      shape: draft.shape,
      ...(draft.anatomy === undefined ? {} : { anatomy: draft.anatomy }),
    }),
    reserveIntent: withdraw,
    currentIntent: intents.currentTicket,
    isCurrentIntent: intents.isCurrent,
    // the simple body also stands in the posture its age implies: its rows
    // replace the standing joints' and keep every other joint's
    onApply: (shape, ticket, values) => {
      const posture = humanBodySimplePosture(props.basis, values);
      void change(
        {
          ...structuredClone(draft),
          shape,
          pose: [
            ...(draft.pose ?? []).filter((row) => !standing.includes(row.bone)),
            ...posture,
          ],
        },
        ticket,
      );
    },
    onRefuse: refuse,
    onBusy: (text) => status(text, "building"),
    onPreparing: (active) =>
      setConnectedBodyPreparing(
        dom,
        "the simple-tier reader (whole person with the standard head)",
        active,
      ),
    onDraftChanged: () =>
      status("Simple body draft changed; apply again.", "ready"),
  });
  humeral.controls = renderBodyHumeralHeadControls({
    dom,
    container: element("humeral-head-controls"),
    current: () => draft,
    onChange: (next) => void change(next),
    onRefuse: refuse,
  });
  renderBodyPosePresets({
    dom,
    container: element("pose-presets"),
    presets: props.poses,
    current: () => draft,
    standing,
    armsDown: viewport.armsDown,
    reserve: withdraw,
    isCurrent: intents.isCurrent,
    apply: (document, ticket) => void change(document, ticket),
    refuse,
    busy: (text) => status(text, "building"),
  });
  element("document-apply").onclick = () => {
    const ticket = withdraw();
    void applyText(element<HTMLTextAreaElement>("document-json").value, ticket);
  };
  element("body-save").onclick = () => {
    const document = editor!.snapshot().document;
    props.download(
      document.id + ".json",
      serializeHumanBodyBasisDocument(document, props.basis.anatomicalAssembly),
      "application/json",
    );
  };
  element("body-glb").onclick = async () => {
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
  // The basis neutral rest has no crossings; some combined shaped rests do.
  // The reading is absolute for the committed document: any entry is a
  // finding, and a segment named twice passes through itself.
  element("body-contacts").onclick = async () => {
    const ticket = withdraw();
    status("Measuring which skin segments cross…", "building");
    try {
      const posed = await viewport.build(
        editor!.snapshot().document,
        true,
        true,
      );
      const reading = posed.crossings;
      const anatomy = bodyAnatomyReading(posed.anatomy ?? null);
      const femoral = bodyFemoralReading(posed.femoralHeads);
      const ground = bodyGroundReading(posed.groundSupport);
      viewport.dispose(posed);
      if (!intents.isCurrent(ticket)) return;
      const text = contacts.describe(reading);
      status(
        [
          text ?? "This build does not supply a crossing reading.",
          anatomy,
          femoral,
          ground,
        ]
          .filter((line) => line !== null)
          .join("\n"),
        text === null ? "error" : "ready",
      );
    } catch (error) {
      if (intents.isCurrent(ticket)) refuse(error);
    }
  };
  element("body-load").onclick = () =>
    element<HTMLInputElement>("body-file").click();
  element<HTMLInputElement>("body-file").onchange = async () => {
    const input = element<HTMLInputElement>("body-file"),
      file = input.files?.[0];
    if (file === undefined) return;
    input.value = "";
    const ticket = withdraw();
    try {
      const text = await file.text();
      if (!intents.isCurrent(ticket)) return;
      await applyText(text, ticket);
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
      editor = createHumanFaceEditor({
        document: props.initial,
        model,
        build: viewport.build,
      });
      show(model);
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
    change: (document: IAutoMovieHumanBodyBasisDocument) => change(document),
  };
}
