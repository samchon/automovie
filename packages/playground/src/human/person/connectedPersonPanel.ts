import type {
  IAutoMovieHumanBodyBasisDocument,
  IAutoMovieHumanFaceBasisDocument,
  IAutoMovieHumanPersonDocument,
} from "@automovie/human";
import type { IAutoMovieHumanConstructionAdmission } from "@automovie/human/common/structures/IAutoMovieHumanConstructionAdmission";
import { createHumanFaceEditor } from "@automovie/human/face/editor/createHumanFaceEditor";
import { parseHumanPersonDocument } from "@automovie/human/human/document/parseHumanPersonDocument";
import { serializeHumanPersonDocument } from "@automovie/human/human/document/serializeHumanPersonDocument";

import { bodyAnatomyReading } from "../body/bodyAnatomyReading";
import { bodyGroundReading } from "../body/bodyGroundReading";
import { renderBodyPosePresets } from "../body/bodyPosePresets";
import { createBodyIntentGate } from "../body/createBodyIntentGate";
import type { IConnectedPersonModel } from "./IConnectedPersonModel";
import type { IConnectedPersonPanelProps } from "./IConnectedPersonPanelProps";
import { connectedPersonPanelMarkup } from "./connectedPersonPanelMarkup";
import { createConnectedPersonSession } from "./createConnectedPersonSession";
import { describeConnectedPersonAdmission } from "./describeConnectedPersonAdmission";
import { describeConnectedPersonStatus } from "./describeConnectedPersonStatus";
import { exportConnectedPersonAsset } from "./exportConnectedPersonAsset";
import { mountConnectedPersonAdmissionReport } from "./mountConnectedPersonAdmissionReport";
import { mountConnectedPersonSections } from "./mountConnectedPersonSections";
import { renderConnectedPersonExpressionPresets } from "./renderConnectedPersonExpressionPresets";

/**
 * Mount the connected person editor: one working person document, one
 * viewport and one accepted history, with the body editor's measured, joint
 * and pose controls editing the body subtree and the face editor's shape and
 * expression controls editing the face subtree.
 *
 * Every edit, from either subtree, from the document text or from a loaded
 * file, is one construction of the whole working document, which always
 * answers with a model and its owner's admission report. An accepted
 * construction is committed to the one `createHumanFaceEditor` history, so
 * undo, redo and reset traverse both subtrees; the first accepted document
 * founds that history, whenever it arrives. A construction its owner refused
 * is displayed as a draft with the whole report and stays editable, saved and
 * encoded only as a draft; it never enters the history and the screen never
 * calls it committed. A request that produces no model (a schema, range or
 * registration refusal) changes nothing: the displayed person, the working
 * document and the history stay, and the status says so.
 *
 * Accepted display publication and leaving a draft run synchronously inside
 * the history owner's commit, so a newer intent cannot separate the displayed
 * frame and draft state from their committed document/model pair. Discard
 * rebuilds that current pair without adding an undo entry.
 *
 * The status line, the admission report and every button state are drawn
 * from the session state and the history (`describeConnectedPersonStatus`),
 * never written directly, and only the latest request may change that state
 * (`createBodyIntentGate`). Save and Export act on the displayed person, not
 * on unapplied document text. The face controls list the head view's
 * channels without its driver channels, which the body owns. The body
 * controls show every body view channel: one with an unavailable endpoint is
 * listed disabled with the missing target named, and an envelope-limited
 * channel's row states where its reach ends and why. The panel evaluates
 * nothing itself.
 *
 * @evidence requirements/actors/body-authoring/contract.md#actor-body-editor Edits the person's body subtree with the body editor's measured, joint and pose controls.
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-editor Edits the person's face subtree with the face editor's shape and expression controls.
 * @evidence specifications/asset-and-representation/body-authoring/contract.md#body-spec-editor Joins accepted body edits and history restoration to synchronous viewport/draft publication in the same transaction, retaining the previous pair on build or publication refusal.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-editor Uses the same generation-checked face transaction and synchronous viewport/draft publication for edit and restore, without a later publication await gap.
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-editor-state Rebuilds the current accepted document/model pair when discarding a draft without adding history, and lets only the current successful transaction replace the displayed accepted state.
 * @evidenceExclude requirements/actors/body-authoring/README.md#body-requirements The person panel is one editing screen; the body domain index also spans extraction, evaluation and review owned elsewhere.
 * @evidenceExclude requirements/actors/body-authoring/contract.md#actor-body-connected-basis The panel evaluates no body endpoint or corrective; the person builder in the worker does.
 * @evidenceExclude requirements/actors/body-authoring/contract.md#actor-body-joints The panel writes joint rows and articulates nothing; the person builder resolves and skins the pose.
 * @evidence requirements/actors/body-authoring/contract.md#actor-body-simple-shape Routes simple values read on the current person's rest skin through the same shape transaction, keeping its current pose.
 * @evidenceExclude requirements/actors/body-authoring/contract.md#actor-body-underwear The person editor offers no underwear selection.
 * @evidenceExclude requirements/actors/body-authoring/contract.md#actor-body-export The person editor exports a whole-person file, not the body file this unit defines.
 * @evidenceExclude requirements/actors/facial-authoring/contract.md#actor-face-connected-basis The panel evaluates no face endpoint; the person builder replays the head view.
 * @evidenceExclude requirements/actors/facial-authoring/contract.md#actor-face-export The person editor exports a whole-person file, not the face file this unit defines.
 * @evidenceExclude specifications/asset-and-representation/body-authoring/README.md#body-specifications The person panel owns its editing screen boundary only.
 * @evidenceExclude specifications/asset-and-representation/body-authoring/contract.md#body-spec-basis The panel performs no body basis evaluation.
 * @evidenceExclude specifications/asset-and-representation/body-authoring/contract.md#body-spec-joints The panel performs no skinning or pose resolution.
 * @evidence specifications/asset-and-representation/body-authoring/contract.md#body-spec-simple-shape Sends projection and expansion to the resident measurement worker with the complete current-person document and retains refusals.
 * @evidenceExclude specifications/asset-and-representation/body-authoring/contract.md#body-spec-underwear The person editor evaluates no underwear region.
 * @evidenceExclude specifications/asset-and-representation/body-authoring/contract.md#body-spec-export The person editor serializes no body file.
 * @evidenceExclude specifications/asset-and-representation/facial-authoring/contract.md#face-spec-connected-basis The panel compiles no face basis; the person generation does.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-connected-iris Reuses per-eye linear pigment controls through the whole-person transaction and keeps iris omission as the source texture.
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
  const element = <T extends HTMLElement>(id: string): T =>
    app.querySelector<T>("#" + id)!;
  const viewport = props.viewport(element<HTMLCanvasElement>("person-canvas"));
  const source = props.body.anatomicalAssembly;
  const session = createConnectedPersonSession<Model>();
  const intents = createBodyIntentGate();
  const admissions = new WeakMap<Model, IAutoMovieHumanConstructionAdmission>();
  const report = mountConnectedPersonAdmissionReport({
    container: element("admission-report"),
    download: props.download,
  });
  let editor:
    | ReturnType<
        typeof createHumanFaceEditor<Model, IAutoMovieHumanPersonDocument>
      >
    | undefined;
  // the document the controls edit: the displayed person's, or the standard one before any is displayed
  let working = structuredClone(props.initial);
  let handoff: Model | undefined;
  let framed = false;
  let measured: string | undefined;
  const reason = (error: unknown): string =>
    error instanceof Error ? error.message : String(error);
  // the history's builder: a model just constructed for this edit, or a fresh
  // construction that must still be accepted when a history entry is restored
  const accept = async (
    document: IAutoMovieHumanPersonDocument,
  ): Promise<Model> => {
    const prepared = handoff;
    handoff = undefined;
    if (prepared !== undefined) return prepared;
    const result = await viewport.construct(document);
    if (!result.admission.accepted) {
      viewport.dispose(result.model);
      throw new Error(
        "This history entry is no longer accepted: " +
          result.admission.failures
            .map((failure) => failure.owner + ": " + failure.cause)
            .join("; "),
      );
    }
    admissions.set(result.model, result.admission);
    return result.model;
  };
  const show = (): void => {
    const state = session.snapshot();
    const committed = editor?.snapshot();
    const view = describeConnectedPersonStatus(
      state,
      committed === undefined
        ? null
        : { name: committed.document.name, parts: committed.model.parts },
    );
    element("person-status").textContent = view.text;
    element("person-status").dataset.state = view.state;
    const idle = state.pending === null;
    const displayed = state.draft ?? committed;
    element<HTMLButtonElement>("person-undo").disabled =
      committed === undefined || !committed.canUndo;
    element<HTMLButtonElement>("person-redo").disabled =
      committed === undefined || !committed.canRedo;
    element<HTMLButtonElement>("person-reset").disabled =
      committed === undefined;
    element<HTMLButtonElement>("person-discard").disabled =
      committed === undefined || state.draft === null;
    element<HTMLButtonElement>("person-save").disabled =
      displayed === undefined;
    element<HTMLButtonElement>("person-glb").disabled =
      displayed === undefined || !idle;
    element<HTMLButtonElement>("person-glb").textContent =
      state.draft === null
        ? "Export GLB"
        : "Export draft GLB with admission report";
    // the contact and humeral-head reading is taken on the admitted preview
    element<HTMLButtonElement>("person-anatomy").disabled =
      committed === undefined || state.draft !== null;
    report.show(
      describeConnectedPersonAdmission(
        state.draft === null ? "accepted" : "construction draft",
        displayed?.document,
        displayed?.model.parts,
        displayed === undefined
          ? undefined
          : (state.draft?.admission ?? admissions.get(displayed.model)),
      ),
    );
  };
  const withdraw = (): number => {
    editor?.cancel();
    viewport.cancel();
    return intents.reserve();
  };
  // redraw every control from the displayed person; the working document
  // returns to it after a refusal
  const refresh = (): void => {
    const displayed =
      session.snapshot().draft?.document ??
      editor?.snapshot().document ??
      props.initial;
    working = structuredClone(displayed);
    element<HTMLTextAreaElement>("document-json").value =
      serializeHumanPersonDocument(displayed, source);
    element("document-unapplied").textContent = "";
    show();
    sections.render();
    // a displayed person changes its measurements; a refusal does not
    const text = element<HTMLTextAreaElement>("document-json").value;
    if (measured === text) return;
    measured = text;
    sections.refresh(displayed);
  };
  const refuse = (error: unknown): void => {
    withdraw();
    session.refuse(reason(error));
    refresh();
  };
  const busy = (text: string): void => {
    session.begin(text);
    show();
  };
  const note = (text: string): void => {
    session.note(text);
    show();
  };
  const change = async (
    next: IAutoMovieHumanPersonDocument,
    ticket: number = withdraw(),
  ): Promise<boolean> => {
    if (!intents.isCurrent(ticket)) return false;
    working = structuredClone(next);
    busy("Building the latest person…");
    try {
      const result = await viewport.construct(next);
      if (!intents.isCurrent(ticket)) {
        viewport.dispose(result.model);
        return false;
      }
      admissions.set(result.model, result.admission);
      if (!result.admission.accepted) {
        viewport.publish(result.model);
        session.settle({
          document: structuredClone(next),
          model: result.model,
          admission: result.admission,
        });
      } else {
        if (editor === undefined) {
          const initialEditor = createHumanFaceEditor({
            document: next,
            model: result.model,
            build: accept,
            dispose: (model) => viewport.dispose(model),
            publish: (model) => {
              viewport.publish(model);
              session.settle(null);
            },
          });
          viewport.publish(result.model);
          editor = initialEditor;
          session.settle(null);
        } else {
          handoff = result.model;
          const success = await editor.edit(next);
          if (!intents.isCurrent(ticket)) return false;
          if (!success) {
            const error = editor.snapshot().error;
            if (error !== null) session.refuse(error);
            else session.rest();
            refresh();
            return false;
          }
        }
      }
      if (!framed) viewport.fitView();
      framed = true;
      refresh();
      return true;
    } catch (error) {
      if (intents.isCurrent(ticket)) refuse(error);
      return false;
    }
  };
  const withBody = (
    body: IAutoMovieHumanBodyBasisDocument,
  ): IAutoMovieHumanPersonDocument => ({
    ...structuredClone(working),
    body: structuredClone(body),
  });
  const withFace = (
    face: IAutoMovieHumanFaceBasisDocument,
  ): IAutoMovieHumanPersonDocument => ({
    ...structuredClone(working),
    face: structuredClone(face),
  });
  const applyText = async (
    text: string,
    ticket = withdraw(),
  ): Promise<void> => {
    try {
      if (intents.isCurrent(ticket))
        await change(parseHumanPersonDocument(text, source), ticket);
    } catch (error) {
      if (intents.isCurrent(ticket)) refuse(error);
    }
  };
  const sections = mountConnectedPersonSections({
    app,
    panel: props,
    controls: {
      dom,
      current: () => working,
      reserve: withdraw,
      isCurrent: intents.isCurrent,
      change: (next: IAutoMovieHumanPersonDocument, ticket?: number) =>
        change(next, ticket),
      busy,
      report: note,
      refuse,
    },
    isDraft: () => session.snapshot().draft !== null,
    currentIntent: intents.currentTicket,
    draftChanged: () => {
      session.rest();
      session.note("Simple measurement draft changed; apply again.");
      show();
    },
  });
  for (const button of app.querySelectorAll<HTMLButtonElement>("[data-view]"))
    button.onclick = () => viewport.cameraView(Number(button.dataset.view));
  element("fit-view").onclick = () => viewport.fitView();
  element<HTMLInputElement>("clay").onchange = () =>
    viewport.setClay(element<HTMLInputElement>("clay").checked);
  element<HTMLInputElement>("shadows").onchange = () =>
    viewport.setShadows(element<HTMLInputElement>("shadows").checked);
  for (const action of ["undo", "redo", "reset"] as const)
    element("person-" + action).onclick = async () => {
      const history = editor;
      if (history === undefined) return;
      const ticket = withdraw();
      busy("Restoring the selected person…");
      const success = await history[action]();
      if (!intents.isCurrent(ticket)) return;
      const restored = history.snapshot();
      if (!success) {
        if (restored.error !== null) session.refuse(restored.error);
        else session.rest();
      }
      refresh();
    };
  // Leaving a draft rebuilds the committed document/model pair without an
  // undo entry, because the draft replaced its resident frame.
  element("person-discard").onclick = async () => {
    const history = editor;
    if (history === undefined || session.snapshot().draft === null) return;
    const ticket = withdraw();
    busy("Returning to the accepted person…");
    try {
      const success = await history.restore();
      if (!intents.isCurrent(ticket)) return;
      const restored = history.snapshot();
      if (!success) {
        if (restored.error !== null) session.refuse(restored.error);
        else session.rest();
      }
      refresh();
    } catch (error) {
      if (intents.isCurrent(ticket)) refuse(error);
    }
  };
  renderBodyPosePresets({
    dom,
    container: element("pose-presets"),
    presets: props.poses,
    current: () => working.body,
    reserve: withdraw,
    isCurrent: intents.isCurrent,
    apply: (body, ticket) => void change(withBody(body), ticket),
    refuse,
    busy,
  });
  renderConnectedPersonExpressionPresets(
    dom,
    element("expression-presets"),
    props.expressions,
    (expression) =>
      void change(withFace({ ...structuredClone(working.face), expression })),
  );
  element<HTMLTextAreaElement>("document-json").oninput = () => {
    element("document-unapplied").textContent =
      "Unapplied text. Save and Export use the displayed person until this text is applied.";
  };
  element("document-apply").onclick = () => {
    const ticket = withdraw();
    void applyText(element<HTMLTextAreaElement>("document-json").value, ticket);
  };
  element("person-save").onclick = () => {
    const draft = session.snapshot().draft;
    const document = draft?.document ?? editor?.snapshot().document;
    if (document === undefined) return;
    props.download(
      document.id + (draft === null ? ".json" : ".construction.json"),
      serializeHumanPersonDocument(document, source),
      "application/json",
    );
  };
  element("person-glb").onclick = async () => {
    const draft = session.snapshot().draft;
    const committed = editor?.snapshot();
    const ticket = intents.currentTicket();
    try {
      const line = await exportConnectedPersonAsset({
        viewport,
        draft,
        committed: committed?.document,
        unchanged: () =>
          intents.isCurrent(ticket) &&
          (draft !== null
            ? session.snapshot().draft?.model === draft.model
            : editor?.snapshot().model === committed?.model),
        download: props.download,
      });
      if (line !== null && intents.isCurrent(ticket)) note(line);
    } catch (error) {
      if (intents.isCurrent(ticket)) refuse(error);
    }
  };
  // the same contact and humeral-head reading the body editor runs, on the
  // person's body build (`createConnectedPersonRuntime`)
  element("person-anatomy").onclick = async () => {
    const committed = editor?.snapshot();
    if (committed === undefined) return;
    const ticket = withdraw();
    busy("Measuring skin contacts and humeral heads…");
    try {
      const posed = await viewport.build(committed.document, true, true);
      const crossings = posed.crossings ?? null;
      const anatomy = bodyAnatomyReading(posed.anatomy ?? null);
      const ground = bodyGroundReading(posed.groundSupport);
      viewport.dispose(posed);
      if (!intents.isCurrent(ticket)) return;
      if (crossings === null)
        session.refuse("This build does not supply a crossing reading.");
      else {
        session.rest();
        session.note(
          crossings.length === 0
            ? "The posed body skin crosses nowhere."
            : `The posed body skin crosses in ${crossings.length} places.`,
        );
      }
      for (const line of [anatomy, ground])
        if (line !== null) session.note(line);
      show();
    } catch (error) {
      if (intents.isCurrent(ticket)) refuse(error);
    }
  };
  element("person-load").onclick = () =>
    element<HTMLInputElement>("person-file").click();
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
  // The controls edit the working document from the start. The first build
  // is an ordinary intent: a newer one supersedes it and founds the history
  // itself, so nothing waits on this one having finished.
  element<HTMLFieldSetElement>("editing").disabled = false;
  sections.render();
  const ready = change(props.initial, intents.reserve()).then(() => undefined);
  return {
    ready,
    snapshot: () => editor?.snapshot(),
    session: () => session.snapshot(),
    change: (document: IAutoMovieHumanPersonDocument) => change(document),
  };
}
