import { parseHumanBodyBasisDocument } from "@automovie/human/body/document/parseHumanBodyBasisDocument";
import { serializeHumanBodyBasisDocument } from "@automovie/human/body/document/serializeHumanBodyBasisDocument";
import type { IAutoMovieHumanBodyBasisDocument } from "@automovie/human/body/structures/IAutoMovieHumanBodyBasisDocument";
import { createHumanFaceEditor } from "@automovie/human/face/editor/createHumanFaceEditor";
import { createAutoMovieResourceRetirement } from "@automovie/viewer";

import type { IBodyAnatomicalRequestModel } from "./IBodyAnatomicalRequestModel";
import type { IBodyAnatomicalRequestPanelProps } from "./IBodyAnatomicalRequestPanelProps";
import { createBodyIntentGate } from "./createBodyIntentGate";

/**
 * Edit one numerical request and publish its qualified candidate-only frame. The first admitted build establishes the initial transaction; later failures retain that document, frame and undo history. File reads reserve intent before waiting, and explicit candidate export never becomes a whole-body save. Closing withdraws intent and removes controls; the page retains ownership of the borrowed viewport and must close it separately. The admitted worker protocol supplies matching candidate qualification, which this panel checks before first publication.
 *
 * @evidence contracts/common.md#principled-implementation Monotonic intents retire late file and build replies, candidate qualification checks source identity and unique report kind, and the shared transactional editor preserves last-valid document and frame on refusal.
 * @evidence contracts/common.md#clear-and-simple-design The panel owns request text, history commands and candidate reports while the injected viewport owns construction, publication, export and retired GPU resources.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Candidate-only exports remain named as inspection or exterior candidates, unvalidated anatomy stays unavailable, and missing unique source qualification refuses rather than becoming a whole-body frame.
 * @evidence contracts/common.md#meaningful-documentation The comment identifies initial versus later admission, stale file reads, candidate-only export, qualification premise and borrowed-viewport close ownership.
 * @evidence contracts/performance.md#efficient-algorithms Qualification serializes exterior requested and submitted documents in O(d) time and storage, reports scan m fulfilled metrics or candidates, and model construction dominates through the injected builder; report and document traversal are needed to bind presentation to admitted inputs.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The panel owns effectful history and request publication rather than a numerical cache; the shared editor and viewport own frame retention and reuse.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The panel retains DOM handlers and editor history until close, which withdraws intent and clears DOM and editor reachability; pending numerical and GPU tasks remain borrowed-viewport resources requiring the page's separate close.
 */
export function mountBodyAnatomicalRequestPanel<
  Model extends IBodyAnatomicalRequestModel,
>(app: HTMLElement, props: IBodyAnatomicalRequestPanelProps<Model>): {
  /** Submit text under a fresh intent, or a caller-reserved one; false means refused, closed or superseded. */
  apply: (value: string, ticket?: number) => Promise<boolean>;
  /** Current admitted editor state, or undefined before admission and after close. */
  snapshot: () => ReturnType<ReturnType<typeof createHumanFaceEditor<Model, IAutoMovieHumanBodyBasisDocument>>["snapshot"]> | undefined;
  /** Withdraw intent and remove controls; the owning page separately closes the borrowed viewport. */
  close: () => void;
} {
  let closed: boolean = false;
  let editor:
    | ReturnType<
        typeof createHumanFaceEditor<Model, IAutoMovieHumanBodyBasisDocument>
      >
    | undefined;
  const intents: ReturnType<typeof createBodyIntentGate> = createBodyIntentGate();
  const element: <T extends HTMLElement>(id: string) => T = <T extends HTMLElement>(id: string): T =>
    app.querySelector<T>("#" + id)!;
  const text: HTMLTextAreaElement = element<HTMLTextAreaElement>("request-json");
  const status: (message: string, state: string) => void = (message: string, state: string): void => {
    element("request-status").textContent = message;
    element("request-status").dataset.state = state;
  };
  const withdraw: () => number = (): number => {
    editor?.cancel();
    props.viewport.cancel();
    return intents.reserve();
  };
  const refresh: (replaceText: boolean) => void = (replaceText: boolean): void => {
    const snapshot: ReturnType<NonNullable<typeof editor>["snapshot"]> | undefined = editor?.snapshot();
    for (const id of ["request-save", "request-export"])
      element<HTMLButtonElement>(id).disabled = snapshot === undefined;
    element<HTMLButtonElement>("request-undo").disabled = !snapshot?.canUndo;
    element<HTMLButtonElement>("request-redo").disabled = !snapshot?.canRedo;
    if (snapshot === undefined) return;
    if (replaceText)
      text.value = serializeHumanBodyBasisDocument(
        snapshot.document,
        props.source,
      );
    if (snapshot.error !== null) {
      status(snapshot.error, "error");
      return;
    }
    const exterior: Model["exteriorCandidate"] = snapshot.model.exteriorCandidate;
    if (exterior !== undefined) {
      status(
        [
          "Source-conditioned exterior candidate. Reference: " +
            exterior.reference.basis,
          "Bare source-rest protocols; clinical skin and internal anatomy remain unavailable.",
          ...exterior.fulfilled.map(
            (metric: NonNullable<Model["exteriorCandidate"]>["fulfilled"][number]): string =>
              `${metric.path}: target ${metric.targetMetres} m; final Float32 ${metric.float32Metres} m; residual ${(metric.residualMetres * 1000).toFixed(3)} mm. ${metric.protocol}`,
          ),
          "Anatomical parts unavailable: " +
            Object.values(exterior.anatomy.parts).filter(
              (part: NonNullable<IBodyAnatomicalRequestModel["exteriorCandidate"]>["anatomy"]["parts"][keyof NonNullable<IBodyAnatomicalRequestModel["exteriorCandidate"]>["anatomy"]["parts"]]): boolean => part.status === "unavailable",
            ).length +
            ".",
        ].join("\n"),
        "ready",
      );
      return;
    }
    const report: Model["anatomicalRequest"] = snapshot.model.anatomicalRequest;
    if (report === undefined) {
      status(
        "Actual source anatomical parts. Numerical targets retain their source authoring conditions; clinical and acquisition validity remain unavailable.",
        "ready",
      );
      return;
    }
    status(
      [
        "Target spheres only. Reference rig: " + report.reference.basis,
        "Requested skin and complete bones: unavailable (geometry not validated).",
        ...report.candidates.map(
          (head: NonNullable<Model["anatomicalRequest"]>["candidates"][number]): string =>
            `${head.part}: ${head.radiusMetres * 1000} mm target radius, reference-rig-only centre (${head.center.x}, ${head.center.y}, ${head.center.z}) m`,
        ),
      ].join("\n"),
      "ready",
    );
  };
  const build: (document: IAutoMovieHumanBodyBasisDocument) => Promise<Model> = async (document: IAutoMovieHumanBodyBasisDocument): Promise<Model> => {
    const ticket: number = intents.currentTicket();
    const model: Model = await props.viewport.build(document);
    // The history owner withdraws publication, but only this viewport adapter
    // can release a prepared frame that finished after a newer user intent.
    if (!intents.isCurrent(ticket)) {
      return createAutoMovieResourceRetirement(
        [(): void => props.viewport.dispose(model), (): Promise<void> => props.viewport.settleRetirements()],
        { error: new Error("Superseded numerical inspection build.") },
      )();
    }
    const articular: Model["anatomicalRequest"] = model.anatomicalRequest;
    const exterior: Model["exteriorCandidate"] = model.exteriorCandidate;
    try {
      // exactly one report, bound to this document and source
      const qualified: boolean =
        exterior !== undefined
          ? articular === undefined &&
            exterior.reference.basis === document.basis &&
            serializeHumanBodyBasisDocument(
              exterior.requested,
              props.source,
            ) === serializeHumanBodyBasisDocument(document, props.source)
          : articular !== undefined &&
            articular.reference.basis === document.basis;
      if (!qualified)
        throw new Error(
          "The worker supplied no matching unique numerical candidate qualification.",
        );
    } catch (error) {
      return createAutoMovieResourceRetirement(
        [(): void => props.viewport.dispose(model), (): Promise<void> => props.viewport.settleRetirements()], { error },
      )();
    }
    return model;
  };
  const settle: () => Promise<void> = async (): Promise<void> => {
    try {
      await props.viewport.settleRetirements();
    } catch (cause) {
      throw new Error(
        "Resource cleanup failed; the displayed inspection is retained: " +
          (cause instanceof Error ? cause.message : String(cause)),
        { cause },
      );
    }
  };
  const apply: (value: string, ticket?: number) => Promise<boolean> = async (value: string, ticket: number = withdraw()): Promise<boolean> => {
    if (closed) return false;
    try {
      const document: IAutoMovieHumanBodyBasisDocument = parseHumanBodyBasisDocument(value, props.source);
      if (!intents.isCurrent(ticket)) return false;
      status("Building the anatomy inspection…", "building");
      if (editor === undefined) {
        const model: Model = await build(document);
        if (!intents.isCurrent(ticket)) {
          await createAutoMovieResourceRetirement([
            (): void => props.viewport.dispose(model),
            (): Promise<void> => settle(),
          ])();
          return false;
        }
        editor = createHumanFaceEditor({
          document, model, build,
          publish: props.viewport.publish,
          dispose: props.viewport.dispose,
        });
        props.viewport.publish(model);
        props.viewport.fitView();
        refresh(true);
        await settle();
        return true;
      }
      const success: boolean = await editor.edit(document);
      if (intents.isCurrent(ticket)) refresh(success);
      await settle();
      if (!intents.isCurrent(ticket)) return false;
      return success;
    } catch (error) {
      if (intents.isCurrent(ticket)) {
        refresh(false);
        status(error instanceof Error ? error.message : String(error), "error");
      }
      return false;
    }
  };
  element<HTMLButtonElement>("request-apply").onclick = async (): Promise<void> => { await apply(text.value); };
  element<HTMLButtonElement>("request-save").onclick = (): void => {
    if (editor === undefined) return;
    const document: IAutoMovieHumanBodyBasisDocument = editor.snapshot().document;
    props.download(
      document.id + ".json",
      serializeHumanBodyBasisDocument(document, props.source),
      "application/json",
    );
  };
  element<HTMLButtonElement>("request-export").onclick = async (): Promise<void> => {
    if (editor === undefined) return;
    const snapshot: ReturnType<NonNullable<typeof editor>["snapshot"]> = editor.snapshot();
    const ticket: number = intents.currentTicket();
    try {
      const bytes: Uint8Array<ArrayBuffer> = await props.viewport.export(snapshot.document);
      if (
        intents.isCurrent(ticket) &&
        editor.snapshot().model === snapshot.model
      )
        props.download(
          snapshot.document.id +
            (snapshot.model.exteriorCandidate === undefined
              ? ".inspection-candidates.glb"
              : ".exterior-candidate.glb"),
          bytes,
          "model/gltf-binary",
        );
    } catch (error) {
      if (intents.isCurrent(ticket))
        status(error instanceof Error ? error.message : String(error), "error");
    }
  };
  for (const direction of ["undo", "redo"] as const)
    element<HTMLButtonElement>("request-" + direction).onclick = async (): Promise<void> => {
      if (editor === undefined) return;
      const ticket: number = withdraw();
      try {
        const success: boolean = await editor[direction]();
        if (intents.isCurrent(ticket)) refresh(success);
        await settle();
      } catch (error) {
        if (intents.isCurrent(ticket))
          status(error instanceof Error ? error.message : String(error), "error");
      }
    };
  const file: HTMLInputElement = element<HTMLInputElement>("request-file");
  element("request-load").onclick = (): void => file.click();
  file.onchange = async (): Promise<void> => {
    const selected: File | undefined = file.files?.[0];
    if (selected === undefined) return;
    const ticket: number = withdraw();
    try {
      const value: string = await selected.text();
      if (intents.isCurrent(ticket)) {
        text.value = value;
        await apply(value, ticket);
      }
    } catch (error) {
      if (intents.isCurrent(ticket))
        status(error instanceof Error ? error.message : String(error), "error");
    }
    file.value = "";
  };
  for (const button of app.querySelectorAll<HTMLButtonElement>("[data-view]"))
    button.onclick = (): void =>
      props.viewport.cameraView(Number(button.dataset.view));
  element("request-fit").onclick = props.viewport.fitView;
  element<HTMLInputElement>("request-clay").onchange = (event: Event): void =>
    props.viewport.setClay((event.currentTarget as HTMLInputElement).checked);
  status(
    "Load or enter a complete request. Reference basis: " + props.basis,
    "ready",
  );
  refresh(false);
  const close: () => void = (): void => {
    if (closed) return;
    closed = true;
    withdraw();
    editor = undefined;
    app.replaceChildren();
  };
  return { apply, snapshot: (): ReturnType<NonNullable<typeof editor>["snapshot"]> | undefined => editor?.snapshot(), close };
}
