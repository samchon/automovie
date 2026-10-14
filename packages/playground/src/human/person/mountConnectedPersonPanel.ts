import type {
  IAutoMovieHumanBodyBasisDocument,
  IAutoMovieHumanFaceBasisDocument,
  IAutoMovieHumanPersonDocument,
} from "@automovie/human";
import type { IAutoMovieHumanConstructionAdmission } from "@automovie/human/common/structures/IAutoMovieHumanConstructionAdmission";
import { createHumanFaceEditor } from "@automovie/human/face/editor/createHumanFaceEditor";
import { parseHumanPersonDocument } from "@automovie/human/human/document/parseHumanPersonDocument";
import { serializeHumanPersonDocument } from "@automovie/human/human/document/serializeHumanPersonDocument";
import { createAutoMovieResourceRetirement } from "@automovie/viewer";

import { bodyAnatomyReading } from "../body/bodyAnatomyReading";
import { bodyGroundReading } from "../body/bodyGroundReading";
import { createBodyIntentGate } from "../body/createBodyIntentGate";
import { renderBodyPosePresets } from "../body/renderBodyPosePresets";
import type { IConnectedPersonModel } from "./IConnectedPersonModel";
import type { IConnectedPersonPanelProps } from "./IConnectedPersonPanelProps";
import { connectedPersonPanelMarkup } from "./connectedPersonPanelMarkup";
import { createConnectedPersonHistoryBuild } from "./createConnectedPersonHistoryBuild";
import { createConnectedPersonSession } from "./createConnectedPersonSession";
import { describeConnectedPersonAdmission } from "./describeConnectedPersonAdmission";
import { describeConnectedPersonStatus } from "./describeConnectedPersonStatus";
import { exportConnectedPersonAsset } from "./exportConnectedPersonAsset";
import { mountConnectedPersonAdmissionReport } from "./mountConnectedPersonAdmissionReport";
import { mountConnectedPersonHistoryControls } from "./mountConnectedPersonHistoryControls";
import { mountConnectedPersonSections } from "./mountConnectedPersonSections";
import { renderConnectedPersonExpressionPresets } from "./renderConnectedPersonExpressionPresets";

/** The accepted-history editor used by this panel's complete person transactions. */
type PersonEditor<Model extends IConnectedPersonModel> = ReturnType<
  typeof createHumanFaceEditor<Model, IAutoMovieHumanPersonDocument>
>;

/**
 * Mount the connected person editor: one working person document, one viewport and one accepted history, with the body editor's measured, joint and pose controls editing the body subtree and the face editor's shape and expression controls editing the face subtree.
 *
 * Every edit from either subtree, document text or a loaded file constructs the whole working document. An accepted construction is committed to the one `createHumanFaceEditor` history, so undo, redo and reset traverse both subtrees; the first accepted document founds that history, whenever it arrives. A construction its owner refused is displayed as a draft with the whole report and stays editable, saved and encoded only as a draft; it never enters the history and the screen never calls it committed. A request that produces no model (a schema, range or registration refusal) changes nothing: the displayed person, the working document and the history stay, and the status says so.
 *
 * Accepted display publication and leaving a draft run synchronously inside the history owner's commit, so a newer intent cannot separate the displayed frame and draft state from their committed document/model pair. Discard rebuilds that current pair without adding an undo entry.
 *
 * The status line, admission report and button states come from session state and history (`describeConnectedPersonStatus`), and only the latest request may change that state (`createBodyIntentGate`). Save and Export act on the displayed person, not on unapplied document text. The face controls list the head view's channels without its driver channels, which the body owns. Body controls show unavailable endpoints disabled with the missing target named, and an envelope-limited channel's row states where its reach ends and why. The panel evaluates no geometry itself.
 *
 * True change completion includes either accepted publication or a labelled construction draft; false can follow supersession, closure, refusal or cleanup failure after an earlier publication. Initial ready observes the first transaction's settlement rather than independently proving an accepted model. Close withdraws intent and independently closes the viewport while awaiting initial settlement, then clears history/session/report references and mounted DOM.
 *
 * @evidence contracts/common.md#principled-implementation Shared current-intent construction publishes accepted frames into one atomic document/history transaction or preserves labelled construction drafts with their original admission, while no-model failures restore the actual displayed document.
 * @evidence contracts/common.md#clear-and-simple-design The panel owns working/accepted/draft presentation authority and connects existing section, history, numerical viewport and download owners without evaluating geometry itself.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Draft visibility and true completion are not accepted history, unapplied JSON is not saved/exported, stale frames are retired and cleanup failure does not invent a rolled-back display or successful native release.
 * @evidence contracts/common.md#meaningful-documentation The comment distinguishes accepted/draft/no-model transitions, shared intent, actual Boolean/ready meanings and owned closure/reference withdrawal.
 * @evidence contracts/performance.md#efficient-algorithms Edits/refreshes clone complete documents and serialize displayed data, status/report painting visits current notes/admission diagnostics, and the accepted editor copies its history references/documents as implemented; numerical construction and child rendering retain their actual costs rather than becoming constant UI operations.
 * @evidence contracts/performance.md#reuse-equivalent-work The exact accepted construction is handed once into the matching history edit instead of rebuilt, and unchanged serialized displayed text suppresses redundant section measurement refresh; other documents/source-qualified numerical requests remain distinct work.
 * @evidence contracts/performance.md#bound-retention-and-release-resources One panel holds working state, one current draft and accepted document history with no independent entry/byte cap; native/prepared-frame ownership stays viewport-owned and admissions use weak model keys. Close withdraws authority, awaits the owned viewport and initial task, then clears editor/session/report data and DOM; pending file/child tasks and externally retained handles remain their actual owners' lifetime obligations.
 *
 * @author Samchon
 */
export function mountConnectedPersonPanel<Model extends IConnectedPersonModel>(
  app: HTMLElement,
  props: IConnectedPersonPanelProps<Model>,
): {
  /** Settlement of the initial transaction, including refusal or supersession. */ ready: Promise<void>;

  /** Withdraw owned work and await viewport/reference/DOM retirement. */ close: () => Promise<void>;

  /** Accepted history snapshot, absent before acceptance and after close. */ snapshot: () =>
    | ReturnType<PersonEditor<Model>["snapshot"]>
    | undefined;

  /** Session state identifying pending work and displayed construction draft. */ session: () => ReturnType<
    ReturnType<typeof createConnectedPersonSession<Model>>["snapshot"]
  >;

  /** Parse and submit document text under a new intent; admission state remains panel-owned. */ load: (
    text: string,
  ) => Promise<void>;

  /** Publish the current accepted or labelled draft transaction; true is not alone accepted history. */ change: (
    document: IAutoMovieHumanPersonDocument,
  ) => Promise<boolean>;
} {
  const dom: Document = app.ownerDocument;
  app.innerHTML = connectedPersonPanelMarkup();
  const element: <T extends HTMLElement>(id: string) => T = <
    T extends HTMLElement,
  >(
    id: string,
  ): T => app.querySelector<T>("#" + id)!;
  const viewport: ReturnType<IConnectedPersonPanelProps<Model>["viewport"]> =
    props.viewport(element<HTMLCanvasElement>("person-canvas"));
  const source: IConnectedPersonPanelProps<Model>["body"]["anatomicalAssembly"] =
    props.body.anatomicalAssembly;
  const session: ReturnType<typeof createConnectedPersonSession<Model>> =
    createConnectedPersonSession<Model>();
  const intents: ReturnType<typeof createBodyIntentGate> =
    createBodyIntentGate();
  const admissions: WeakMap<Model, IAutoMovieHumanConstructionAdmission> =
    new WeakMap();
  const report: ReturnType<typeof mountConnectedPersonAdmissionReport> =
    mountConnectedPersonAdmissionReport({
      container: element("admission-report"),
      download: props.download,
    });
  let editor:
    | ReturnType<
        typeof createHumanFaceEditor<Model, IAutoMovieHumanPersonDocument>
      >
    | undefined;
  let closed: boolean = false;
  // the document the controls edit: the displayed person's, or the standard one before any is displayed
  let working: IAutoMovieHumanPersonDocument = structuredClone(props.initial);
  let framed: boolean = false;
  let measured: string | undefined;
  const reason: (error: unknown) => string = (error: unknown): string =>
    error instanceof Error ? error.message : String(error);
  // the history's builder: a model just constructed for this edit, or a fresh
  // construction that must still be accepted when a history entry is restored
  const historyBuild: ReturnType<
    typeof createConnectedPersonHistoryBuild<Model>
  > = createConnectedPersonHistoryBuild({
    viewport,
    admissions,
  });
  const settle: () => Promise<void> = async (): Promise<void> => {
    try {
      await viewport.settleRetirements();
    } catch (cause) {
      throw new Error(
        "Resource cleanup failed; the displayed person is retained: " +
          reason(cause),
        { cause },
      );
    }
  };
  const show: () => void = (): void => {
    const state: ReturnType<typeof session.snapshot> = session.snapshot();
    const committed: ReturnType<PersonEditor<Model>["snapshot"]> | undefined =
      editor?.snapshot();
    const view: ReturnType<typeof describeConnectedPersonStatus> =
      describeConnectedPersonStatus(
        state,
        committed === undefined
          ? null
          : { name: committed.document.name, parts: committed.model.parts },
      );
    element("person-status").textContent = view.text;
    element("person-status").dataset.state = view.state;
    const idle: boolean = state.pending === null;
    const displayed:
      | { document: IAutoMovieHumanPersonDocument; model: Model }
      | undefined = state.draft ?? committed;
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
  const withdraw: () => number = (): number => {
    editor?.cancel();
    viewport.cancel();
    return intents.reserve();
  };
  // redraw every control from the displayed person; the working document
  // returns to it after a refusal
  const refresh: () => void = (): void => {
    const displayed: IAutoMovieHumanPersonDocument =
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
    const text: string = element<HTMLTextAreaElement>("document-json").value;
    if (measured === text) return;
    measured = text;
    sections.refresh(displayed);
  };
  const refuse: (error: unknown) => void = (error: unknown): void => {
    withdraw();
    session.refuse(reason(error));
    refresh();
  };
  const busy: (text: string) => void = (text: string): void => {
    session.begin(text);
    show();
  };
  const note: (text: string) => void = (text: string): void => {
    session.note(text);
    show();
  };
  const change: (
    next: IAutoMovieHumanPersonDocument,
    ticket?: number,
  ) => Promise<boolean> = async (
    next: IAutoMovieHumanPersonDocument,
    ticket: number = withdraw(),
  ): Promise<boolean> => {
    if (closed) return false;
    if (!intents.isCurrent(ticket)) return false;
    working = structuredClone(next);
    busy("Building the latest person…");
    try {
      const result: Awaited<ReturnType<typeof viewport.construct>> =
        await viewport.construct(next);
      if (!intents.isCurrent(ticket)) {
        await createAutoMovieResourceRetirement([
          (): void => viewport.dispose(result.model),
          (): Promise<void> => settle(),
        ])();
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
          const initialEditor: PersonEditor<Model> = createHumanFaceEditor({
            document: next,
            model: result.model,
            build: historyBuild.build,
            dispose: (model: Model): void => viewport.dispose(model),
            publish: (model: Model): void => {
              viewport.publish(model);
              session.settle(null);
            },
          });
          viewport.publish(result.model);
          editor = initialEditor;
          session.settle(null);
        } else {
          historyBuild.handoff(result.model);
          const success: boolean = await editor.edit(next);
          if (!intents.isCurrent(ticket)) {
            await settle();
            return false;
          }
          if (!success) {
            const error: string | null = editor.snapshot().error;
            if (error !== null) session.refuse(error);
            else session.rest();
            refresh();
            await settle();
            return false;
          }
        }
      }
      if (!framed) viewport.fitView();
      framed = true;
      refresh();
      await settle();
      return true;
    } catch (error) {
      if (intents.isCurrent(ticket)) refuse(error);
      return false;
    }
  };
  const withBody: (
    body: IAutoMovieHumanBodyBasisDocument,
  ) => IAutoMovieHumanPersonDocument = (
    body: IAutoMovieHumanBodyBasisDocument,
  ): IAutoMovieHumanPersonDocument => ({
    ...structuredClone(working),
    body: structuredClone(body),
  });
  const withFace: (
    face: IAutoMovieHumanFaceBasisDocument,
  ) => IAutoMovieHumanPersonDocument = (
    face: IAutoMovieHumanFaceBasisDocument,
  ): IAutoMovieHumanPersonDocument => ({
    ...structuredClone(working),
    face: structuredClone(face),
  });
  const applyText: (text: string, ticket?: number) => Promise<void> = async (
    text: string,
    ticket: number = withdraw(),
  ): Promise<void> => {
    if (closed) throw new Error("The connected person panel is closed.");
    try {
      if (intents.isCurrent(ticket))
        await change(parseHumanPersonDocument(text, source), ticket);
    } catch (error) {
      if (intents.isCurrent(ticket)) refuse(error);
    }
  };
  const sections: ReturnType<typeof mountConnectedPersonSections<Model>> =
    mountConnectedPersonSections({
      app,
      panel: props,
      controls: {
        dom,
        current: (): IAutoMovieHumanPersonDocument => working,
        reserve: withdraw,
        isCurrent: intents.isCurrent,
        change: (
          next: IAutoMovieHumanPersonDocument,
          ticket?: number,
        ): Promise<boolean> => change(next, ticket),
        busy,
        report: note,
        refuse,
      },
      isDraft: (): boolean => session.snapshot().draft !== null,
      currentIntent: intents.currentTicket,
      draftChanged: (): void => {
        session.rest();
        session.note("Simple measurement draft changed; apply again.");
        show();
      },
    });
  for (const button of app.querySelectorAll<HTMLButtonElement>("[data-view]"))
    button.onclick = (): void =>
      viewport.cameraView(Number(button.dataset.view));
  element("fit-view").onclick = (): void => viewport.fitView();
  element<HTMLInputElement>("clay").onchange = (): void =>
    viewport.setClay(element<HTMLInputElement>("clay").checked);
  element<HTMLInputElement>("shadows").onchange = (): void =>
    viewport.setShadows(element<HTMLInputElement>("shadows").checked);
  mountConnectedPersonHistoryControls({
    app,
    history: (): PersonEditor<Model> | undefined => editor,
    session,
    withdraw,
    isCurrent: intents.isCurrent,
    busy,
    refresh,
    refuse,
    settleRetirements: settle,
  });
  renderBodyPosePresets({
    dom,
    container: element("pose-presets"),
    presets: props.poses,
    current: (): IAutoMovieHumanBodyBasisDocument => working.body,
    reserve: withdraw,
    isCurrent: intents.isCurrent,
    apply: (body: IAutoMovieHumanBodyBasisDocument, ticket: number): void =>
      void change(withBody(body), ticket),
    refuse,
    busy,
  });
  renderConnectedPersonExpressionPresets(
    dom,
    element("expression-presets"),
    props.expressions,
    (expression: IAutoMovieHumanFaceBasisDocument["expression"]): void =>
      void change(withFace({ ...structuredClone(working.face), expression })),
  );
  element<HTMLTextAreaElement>("document-json").oninput = (): void => {
    element("document-unapplied").textContent =
      "Unapplied text. Save and Export use the displayed person until this text is applied.";
  };
  element("document-apply").onclick = (): void => {
    const ticket: number = withdraw();
    void applyText(element<HTMLTextAreaElement>("document-json").value, ticket);
  };
  element("person-save").onclick = (): void => {
    const draft: ReturnType<typeof session.snapshot>["draft"] =
      session.snapshot().draft;
    const document: IAutoMovieHumanPersonDocument | undefined =
      draft?.document ?? editor?.snapshot().document;
    if (document === undefined) return;
    props.download(
      document.id + (draft === null ? ".json" : ".construction.json"),
      serializeHumanPersonDocument(document, source),
      "application/json",
    );
  };
  element("person-glb").onclick = async (): Promise<void> => {
    const draft: ReturnType<typeof session.snapshot>["draft"] =
      session.snapshot().draft;
    const committed: ReturnType<PersonEditor<Model>["snapshot"]> | undefined =
      editor?.snapshot();
    const ticket: number = intents.currentTicket();
    try {
      const line: string | null = await exportConnectedPersonAsset({
        viewport,
        draft,
        committed: committed?.document,
        unchanged: (): boolean =>
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
  element("person-anatomy").onclick = async (): Promise<void> => {
    const committed: ReturnType<PersonEditor<Model>["snapshot"]> | undefined =
      editor?.snapshot();
    if (committed === undefined) return;
    const ticket: number = withdraw();
    busy("Measuring skin contacts and humeral heads…");
    try {
      const posed: Model = await viewport.build(committed.document, true, true);
      const crossings: NonNullable<IConnectedPersonModel["crossings"]> | null =
        posed.crossings ?? null;
      const anatomy: string | null = bodyAnatomyReading(posed.anatomy ?? null);
      const ground: string | null = bodyGroundReading(posed.groundSupport);
      await createAutoMovieResourceRetirement([
        (): void => viewport.dispose(posed),
        (): Promise<void> => settle(),
      ])();
      if (!intents.isCurrent(ticket)) return;
      if (crossings === null)
        session.refuse("This build does not supply a crossing reading.");
      else {
        session.rest();
        session.note(
          crossings.length === 0
            ? "The posed body skin inspection reports no crossing pairs."
            : `The posed body skin inspection reports ${crossings.length} crossing pairs.`,
        );
      }
      for (const line of [anatomy, ground])
        if (line !== null) session.note(line);
      show();
    } catch (error) {
      if (intents.isCurrent(ticket)) refuse(error);
    }
  };
  element("person-load").onclick = (): void =>
    element<HTMLInputElement>("person-file").click();
  element<HTMLInputElement>("person-file").onchange =
    async (): Promise<void> => {
      const input: HTMLInputElement = element<HTMLInputElement>("person-file");
      const file: File | undefined = input.files?.[0];
      if (file === undefined) return;
      input.value = "";
      const ticket: number = withdraw();
      try {
        const text: string = await file.text();
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
  const ready: Promise<void> = change(props.initial, intents.reserve()).then(
    (): void => undefined,
  );
  const close: () => Promise<void> = createAutoMovieResourceRetirement([
    (): void => {
      closed = true;
      withdraw();
    },
    (): Promise<void> => viewport.close(),
    async (): Promise<void> => {
      await ready;
      editor = undefined;
      session.begin("");
      session.settle(null);
      report.show(null);
      app.replaceChildren();
    },
  ]);
  return {
    ready,
    close,
    snapshot: (): ReturnType<PersonEditor<Model>["snapshot"]> | undefined =>
      editor?.snapshot(),
    session: (): ReturnType<typeof session.snapshot> => session.snapshot(),
    load: (text: string): Promise<void> => applyText(text),
    change: (document: IAutoMovieHumanPersonDocument): Promise<boolean> =>
      change(document),
  };
}
