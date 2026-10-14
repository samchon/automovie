import type { IAutoMovieModelCrossing } from "@automovie/engine";
import type { IAutoMovieHumanFaceBasisDocument } from "@automovie/human";
import { parseHumanFaceBasisDocument } from "@automovie/human/face/document/parseHumanFaceBasisDocument";
import { serializeHumanFaceBasisDocument } from "@automovie/human/face/document/serializeHumanFaceBasisDocument";
import { createHumanFaceEditor } from "@automovie/human/face/editor/createHumanFaceEditor";
import { createAutoMovieResourceRetirement } from "@automovie/viewer";

import type { IConnectedFacePanelModel } from "./IConnectedFacePanelModel";
import type { IConnectedFacePanelProps } from "./IConnectedFacePanelProps";
import type { IConnectedFaceViewport } from "./IConnectedFaceViewport";
import { mountConnectedFaceAppearance } from "./mountConnectedFaceAppearance";
import { mountConnectedFaceControls } from "./mountConnectedFaceControls";
import { describeConnectedFaceContacts } from "./describeConnectedFaceContacts";

/**
 * Mount editable endpoint controls around an injected numerical viewport. Weight ranges come from the admitted basis. Displaying a source control does not turn its artistic endpoint into a measured anatomical quantity. Draft composition, input/file revision ordering and history commands belong to this panel; numerical admission and frame resources remain with Human and the viewport. Retirement settles after synchronous publication, so cleanup refusal reports the admitted display without rollback. Void load/change completion includes reported refusal. Camera, clay and occlusion selection are view state, and selected occlusion applies at the next build or export. Close withdraws authority, awaits viewport retirement and initial settlement, then clears inspection and DOM state.
 *
 * @evidence contracts/common.md#principled-implementation Shared transactional editing joins admitted document and prepared frame, revision equality discards late input/file effects, and initial-reference crossing comparison keeps supplied numerical incidence distinct from anatomical validity. The numeric revision has no explicit precision-exhaustion guard.
 * @evidence contracts/common.md#clear-and-simple-design Control and appearance mounts compose candidates while the panel owns history/status and injected viewport operations own numerical preparation, publication, encoding and cleanup.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Source endpoint response is not clinical measurement, refused void transaction settlement is not acceptance, and cleanup failure cannot restore an older document over a newly published model.
 * @evidence contracts/common.md#meaningful-documentation The comment specifies admission and resource ownership, refusal-inclusive completion, view-only state, next-build occlusion, revision precision limitation and full close ordering.
 * @evidence contracts/performance.md#efficient-algorithms Control mounts compute basis endpoint scales once, refresh serializes d document values and redraws current controls, and contact requests perform actual initial/posed numerical builds; report traversal and worker geometry costs remain included rather than claiming cheap mesh-independent rebuilds.
 * @evidence contracts/performance.md#reuse-equivalent-work The supplied initial-reference crossing reading is reused within one basis mount, immutable control maps/scales stay mounted, and simple-coordinate origins reset on redraw so pending values lose authority after withdrawal; worker/frame reuse belongs to the viewport.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The panel retains DOM, draft, history and one reference crossing array with no local history cap; close withdraws pending publication, ends its acquired viewport, awaits initial work and clears editor, reference and DOM reachability.
 */
export function mountConnectedFacePanel<Model extends IConnectedFacePanelModel>(
  app: HTMLElement,
  props: IConnectedFacePanelProps<Model>,
): {
  /** Settles after the first admission or its panel-reported refusal. */
  ready: Promise<void>;

  /** Await pending viewport retirement and remove this panel's controls. */
  close: () => Promise<void>;

  /** Admitted editor state, absent before initialization and after close. */
  snapshot: () => ReturnType<ReturnType<typeof createHumanFaceEditor<Model, IAutoMovieHumanFaceBasisDocument>>["snapshot"]> | undefined;

  /** Parse and submit text; settlement can include reported refusal or closed-state withdrawal. */
  load: (text: string) => Promise<void>;
} {
  const dom: Document = app.ownerDocument;
  app.innerHTML = `
<style>
*{box-sizing:border-box}body{margin:0;background:#161c23;color:#e4eaf0;font:13px/1.5 system-ui}main{display:grid;grid-template-columns:minmax(300px,1fr) 410px;height:100vh}section{position:relative;min-width:0}canvas{width:100%;height:100%;display:block}aside{overflow:auto;padding:20px;background:#10161d}h1{font-size:20px;margin:0}h2{font-size:14px;margin:20px 0 8px}p,small{color:#a9b7c8}button,input,select,textarea{font:inherit;color:inherit;background:#202b37;border:1px solid #405063;border-radius:4px}button{padding:5px 8px;cursor:pointer}button:disabled{opacity:.4}a{color:#a7d1f0}.toolbar{display:flex;gap:6px;flex-wrap:wrap;margin:10px 0}.views{position:absolute;top:10px;left:10px;right:10px}fieldset{border:0;padding:0;margin:0}.row{margin:12px 0}.row label{display:block}.row div{display:flex;gap:10px}.row small{display:block;font-size:11px}.row input[type=range]{flex:1;min-width:0}.row input[type=number]{width:85px;padding:3px}textarea{width:100%;height:230px;font:11px monospace;padding:8px}select{width:100%;padding:6px}#face-status{white-space:pre-wrap;background:#1c2834;padding:10px;border-radius:5px;margin:12px 0}#face-status[data-state=error]{background:#422127;color:#ffd2d2}@media(max-width:780px){main{grid-template-columns:1fr;height:auto}section{height:60vh}}
</style>
<main><section><canvas id="face-canvas"></canvas><div class="toolbar views"><button data-view="0">Front</button><button data-view="45">Left ¾</button><button data-view="-45">Right ¾</button><button data-view="90">Left</button><button data-view="-90">Right</button><button data-view="180">Back</button><button id="fit-view">Fit</button><label><input id="clay" type="checkbox"> Clay</label><label><input id="shadows" type="checkbox" checked> Shadows</label><label><input id="occlusion" type="checkbox" checked> Occlusion</label></div></section>
<aside><h1>Face editor</h1><p>Numerical shape, expression, skin and hair</p><div id="face-status" role="status">Loading the numerical basis…</div>
<fieldset id="editing" disabled><div class="toolbar"><button id="face-undo">Undo</button><button id="face-redo">Redo</button><button id="face-reset">Reset</button></div><div class="toolbar"><button id="face-save">Save document</button><button id="face-load">Load document</button><button id="face-glb">Export GLB</button><button id="face-contacts">Check contacts</button><input id="face-file" type="file" accept=".json,application/json" hidden></div>
<h2>Expression presets</h2><div id="presets" class="toolbar"></div><h2>Controls</h2><select data-role="control-kind" aria-label="Control group"><option value="shape">Face shape</option><option value="expression">Expression</option></select><p data-role="control-help">0 is the source neutral. Weights interpolate authored endpoints; they are not physical measurements. Each control states how far one unit of its endpoints moves the surface.</p><div data-role="basis-controls"></div><details><summary>Complete document and appearance</summary><textarea id="document-json" aria-label="Complete document"></textarea><button id="document-apply">Apply document</button></details></fieldset></aside></main>`;
  const element: <T extends HTMLElement>(id: string) => T = <T extends HTMLElement>(id: string): T =>
    app.querySelector<T>("#" + id)!;
  const viewport: IConnectedFaceViewport<Model> = props.viewport(element<HTMLCanvasElement>("face-canvas"));
  let editor:
    | ReturnType<
        typeof createHumanFaceEditor<Model, IAutoMovieHumanFaceBasisDocument>
      >
    | undefined;
  let draft: IAutoMovieHumanFaceBasisDocument = structuredClone(props.initial);
  let revision: number = 0;
  let closed: boolean = false;
  const status: (text: string, state: string) => void = (text: string, state: string): void => {
    element("face-status").textContent = text;
    element("face-status").dataset.state = state;
  };
  const withdraw: () => number = (): number => {
    editor?.cancel();
    viewport.cancel();
    if (editor !== undefined) {
      draft = editor.snapshot().document;
      // Rebuild simple projections too: their captured pending group values
      // must lose authority along with the cancelled numerical draft.
      controls.refresh();
      appearance.refresh();
    }
    return ++revision;
  };
  const refuse: (error: unknown) => void = (error: unknown): void => {
    if (closed) return;
    withdraw();
    status(error instanceof Error ? error.message : String(error), "error");
  };
  const settle: () => Promise<void> = async (): Promise<void> => {
    try {
      await viewport.settleRetirements();
    } catch (cause) {
      throw new Error(
        "Resource cleanup failed; the displayed face is retained: " +
          (cause instanceof Error ? cause.message : String(cause)),
        { cause },
      );
    }
  };
  const refresh: () => void = (): void => {
    const state: ReturnType<NonNullable<typeof editor>["snapshot"]> = editor!.snapshot();
    draft = state.document;
    // The joint line reads what the builder posed: opening in degrees, the
    // mandible's translation against its sagittal budget, each gaze angle.
    const joints: Model["articulation"] = state.model.articulation;
    const articulated: string =
      joints === undefined || joints === null
        ? ""
        : `
Jaw ${joints.jaw.degrees.toFixed(1)}° open, ${(joints.jaw.translationMetres * 1000).toFixed(1)} of ${(joints.jaw.budgetMetres * 1000).toFixed(1)} mm condylar travel · ` +
          joints.eyes
            .map((eye: NonNullable<Model["articulation"]>["eyes"][number]): string => `${eye.id} ${eye.degrees.toFixed(1)}°`)
            .join(", ");
    // The contact line reads what the contact stage measured and did: both
    // apertures, the closure ratio, the tongue's passage and every push.
    const contact: Model["contact"] = state.model.contact;
    const contacted: string =
      contact === undefined || contact === null
        ? ""
        : `
Lips ${(contact.interlabialMetres * 1000).toFixed(1)} mm, incisors ${contact.interincisalMetres === null ? "measurement unavailable (representative absent)" : (contact.interincisalMetres * 1000).toFixed(1) + " mm apart"} · closure ×${contact.closureRatio.toFixed(2)}` +
          (contact.passage === null
            ? ""
            : ` · tongue ${(contact.passage.protrudingMetres * 1000).toFixed(1)} mm out, ${(contact.passage.thicknessMetres * 1000).toFixed(1)} mm thick`) +
          contact.resolved
            .filter((entry: NonNullable<Model["contact"]>["resolved"][number]): boolean => entry.vertices > 0)
            .map(
              (entry: NonNullable<Model["contact"]>["resolved"][number]): string =>
                ` · ${entry.surface}: ${entry.vertices} shared skin groups directly held out of the teeth (${(entry.maxDepthMetres * 1000).toFixed(2)} mm)`,
            )
            .join("");
    status(
      state.error ??
        `${state.document.name}
${state.model.parts} material regions · committed numerical state${articulated}${contacted}`,
      state.status,
    );
    element<HTMLButtonElement>("face-undo").disabled = !state.canUndo;
    element<HTMLButtonElement>("face-redo").disabled = !state.canRedo;
    element<HTMLTextAreaElement>("document-json").value =
      serializeHumanFaceBasisDocument(state.document);
    controls.refresh();
    appearance.refresh();
  };
  const change: (next: IAutoMovieHumanFaceBasisDocument) => Promise<void> = async (
    next: IAutoMovieHumanFaceBasisDocument,
  ): Promise<void> => {
    if (closed) return;
    const ticket: number = ++revision;
    draft = structuredClone(next);
    status("Building the latest face…", "building");
    try {
      await editor!.edit(next);
      if (ticket === revision) refresh();
      await settle();
    } catch (error) {
      if (ticket === revision) refuse(error);
    }
  };
  const applyText: (text: string) => Promise<void> = async (text: string): Promise<void> => {
    if (closed) return;
    try {
      await change(parseHumanFaceBasisDocument(text));
    } catch (error) {
      refuse(error);
    }
  };
  const controls: ReturnType<typeof mountConnectedFaceControls> = mountConnectedFaceControls(app, {
    basis: props.basis,
    map: props.controlMap,
    components: props.componentTree,
    document: (): IAutoMovieHumanFaceBasisDocument => draft,
    change,
    refuse,
  });
  const appearance: ReturnType<typeof mountConnectedFaceAppearance> = mountConnectedFaceAppearance(app, {
    basis: props.basis,
    document: (): IAutoMovieHumanFaceBasisDocument => draft,
    change,
    refuse,
  });
  for (const button of app.querySelectorAll<HTMLButtonElement>("[data-view]"))
    button.onclick = (): void => viewport.cameraView(Number(button.dataset.view));
  element("fit-view").onclick = viewport.fitView;
  element<HTMLInputElement>("clay").onchange = (): void =>
    viewport.setClay(element<HTMLInputElement>("clay").checked);
  element<HTMLInputElement>("shadows").onchange = (): void =>
    viewport.setShadows(element<HTMLInputElement>("shadows").checked);
  // Every build bakes the face's ambient occlusion while the box is checked;
  // a change applies from the next build.
  const occlusion: () => boolean = (): boolean => element<HTMLInputElement>("occlusion").checked;
  const build: (document: IAutoMovieHumanFaceBasisDocument, measure?: boolean) => Promise<Model> = (document: IAutoMovieHumanFaceBasisDocument, measure: boolean = false): Promise<Model> =>
    viewport.build(document, measure, occlusion());
  // Selecting a study is an ordinary validated transaction, so failed builds
  // retain the previous face and successful selection participates in history.
  const studies: HTMLSelectElement = dom.createElement("select");
  studies.id = "face-study";
  studies.setAttribute("aria-label", "Select a connected face study");
  const placeholder: HTMLOptionElement = dom.createElement("option");
  placeholder.value = "";
  placeholder.textContent = "Load an input study";
  studies.append(placeholder);
  for (const [index, study] of (props.studies ?? []).entries()) {
    const option: HTMLOptionElement = dom.createElement("option");
    option.value = String(index);
    option.textContent = study.name;
    studies.append(option);
  }
  studies.onchange = async (): Promise<void> => {
    const selected: string = studies.value;
    studies.value = "";
    if (selected === "") return;
    await change(props.studies![Number(selected)]);
  };
  element("editing").prepend(studies);
  for (const action of ["undo", "redo", "reset"] as const)
    element("face-" + action).onclick = async (): Promise<void> => {
      const ticket: number = withdraw();
      status("Restoring the selected face…", "building");
      try {
        await editor![action]();
        if (ticket === revision) refresh();
        await settle();
      } catch (error) {
        if (ticket === revision) refuse(error);
      }
    };
  for (const preset of props.presets) {
    const button: HTMLButtonElement = dom.createElement("button");
    button.textContent = preset.name;
    button.onclick = (): Promise<void> =>
      change({
        ...structuredClone(draft),
        expression: { ...preset.expression },
      });
    element("presets").append(button);
  }
  element("document-apply").onclick = (): Promise<void> =>
    applyText(element<HTMLTextAreaElement>("document-json").value);
  element("face-save").onclick = (): void => {
    const document: IAutoMovieHumanFaceBasisDocument = editor!.snapshot().document;
    props.download(
      document.id + ".json",
      serializeHumanFaceBasisDocument(document),
      "application/json",
    );
  };
  element("face-glb").onclick = async (): Promise<void> => {
    const state: ReturnType<NonNullable<typeof editor>["snapshot"]> = editor!.snapshot();
    const ticket: number = revision;
    const button: HTMLButtonElement = element<HTMLButtonElement>("face-glb");
    button.disabled = true;
    try {
      const bytes: Uint8Array<ArrayBuffer> = await viewport.export(state.document, occlusion());
      if (!closed) props.download(state.document.id + ".glb", bytes, "model/gltf-binary");
    } catch (error) {
      if (ticket === revision)
        status(error instanceof Error ? error.message : String(error), "error");
    } finally {
      button.disabled = false;
    }
  };
  // Crossing surfaces are compared with props.initial, which may be an authored
  // state rather than the source neutral. Counts can include internal tissues;
  // their differences measure triangle incidence, not depth or anatomical validity.
  // The reading costs seconds, so it runs on request instead of on every edit.
  let rest: IAutoMovieModelCrossing[] | undefined;
  element("face-contacts").onclick = async (): Promise<void> => {
    const ticket: number = withdraw();
    status("Measuring which surfaces cross…", "building");
    try {
      if (rest === undefined) {
        const neutral: Model = await build(props.initial, true);
        const reading: Model["crossings"] = neutral.crossings;
        await createAutoMovieResourceRetirement([
          (): void => viewport.dispose(neutral),
          (): Promise<void> => settle(),
        ])();
        if (ticket !== revision) return;
        if (reading === null || reading === undefined) {
          status("This build does not supply a crossing reading.", "error");
          return;
        }
        rest = reading;
      }
      const posed: Model = await build(editor!.snapshot().document, true);
      const reading: Model["crossings"] = posed.crossings;
      await createAutoMovieResourceRetirement([
        (): void => viewport.dispose(posed),
        (): Promise<void> => settle(),
      ])();
      if (ticket !== revision) return;
      status(
        reading === null || reading === undefined
          ? "This build does not supply a crossing reading."
          : describeConnectedFaceContacts(rest, reading),
        reading === null || reading === undefined ? "error" : "ready",
      );
    } catch (error) {
      if (ticket === revision) refuse(error);
    }
  };
  element("face-load").onclick = (): void =>
    element<HTMLInputElement>("face-file").click();
  element<HTMLInputElement>("face-file").onchange = async (): Promise<void> => {
    const input: HTMLInputElement = element<HTMLInputElement>("face-file");
    const file: File | undefined = input.files?.[0];
    if (file === undefined) return;
    input.value = "";
    const ticket: number = withdraw();
    try {
      const text: string = await file.text();
      if (ticket !== revision) return;
      await applyText(text);
    } catch (error) {
      if (ticket === revision) refuse(error);
    }
  };
  const ready: Promise<void> = (async (): Promise<void> => {
    const ticket: number = ++revision;
    try {
      const model: Model = await build(props.initial);
      if (ticket !== revision) {
        await createAutoMovieResourceRetirement([
          (): void => viewport.dispose(model),
          (): Promise<void> => settle(),
        ])();
        return;
      }
      editor = createHumanFaceEditor({
        document: props.initial,
        model,
        build,
        publish: viewport.publish,
        dispose: viewport.dispose,
      });
      viewport.publish(model);
      viewport.fitView();
      element<HTMLFieldSetElement>("editing").disabled = false;
      refresh();
      await settle();
    } catch (error) {
      if (ticket === revision) refuse(error);
    }
  })();
  const close: () => Promise<void> = createAutoMovieResourceRetirement([
    (): void => {
      closed = true;
      ++revision;
      editor?.cancel();
      viewport.cancel();
    },
    (): Promise<void> => viewport.close(),
    async (): Promise<void> => {
      await ready;
      rest = undefined;
      editor = undefined;
      app.replaceChildren();
    },
  ]);
  return { ready, close, snapshot: (): ReturnType<NonNullable<typeof editor>["snapshot"]> | undefined => editor?.snapshot(), load: applyText };
}
