/**
 * Browser adapter for a connected facial basis, sharing the ordinary face
 * editor's transaction and viewport owners. This panel owns only DOM inputs,
 * draft composition, file-read generations and the millimetre formatting of the
 * package's channel scale measurement. The package validates controls,
 * forms the model and exports it; camera/clay state never enters the document.
 * A failed or superseded edit retains the committed preview and downloads.
 */
import type { IAutoMovieModelCrossing } from "@automovie/engine";
import {
  type IAutoMovieHumanFaceBasis,
  type IAutoMovieHumanFaceBasisDocument,
  type IAutoMovieHumanFaceControlMap,
  createHumanFaceEditor,
  parseHumanFaceBasisDocument,
  serializeHumanFaceBasisDocument,
} from "@automovie/human";

import { mountConnectedFaceAppearance } from "./connectedAppearance";
import { mountConnectedFaceControls } from "./connectedControls";

/**
 * Mount editable endpoint controls around an injected numerical viewport.
 * Weight ranges come from the admitted basis. Displaying a source control does
 * not turn its artistic endpoint into a measured anatomical quantity.
 *
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-editor Provides shape/expression inputs, presets, history, file IO and orbit/clay controls for a connected facial prior.
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-editor-state Publishes and downloads only the latest committed document/model while refusing invalid or obsolete requests.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-editor-view Binds scalar controls to numerical edits, states each control's envelope and measured metric effect, and keeps camera and display state outside replay data.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-editor Shares transactional history and cancels stale file reads and builds by generation.
 */
export function mountConnectedFacePanel<
  Model extends {
    parts: number;
    crossings?: IAutoMovieModelCrossing[] | null;
  },
>(
  app: HTMLElement,
  props: {
    /** Admitted basis; the panel reads its channels and measures their scale. */
    basis: IAutoMovieHumanFaceBasis;
    initial: IAutoMovieHumanFaceBasisDocument;
    controlMap?: IAutoMovieHumanFaceControlMap;
    /** Application-owned studies; never embedded in the numerical package. */
    studies?: readonly IAutoMovieHumanFaceBasisDocument[];
    presets: { name: string; expression: Record<string, number> }[];
    viewport: (canvas: HTMLCanvasElement) => {
      build: (
        document: IAutoMovieHumanFaceBasisDocument,
        measure?: boolean,
      ) => Promise<Model>;
      cancel: () => void;
      export: (
        document: IAutoMovieHumanFaceBasisDocument,
      ) => Promise<Uint8Array<ArrayBuffer>>;
      publish: (model: Model) => void;
      dispose: (model: Model) => void;
      fitView: () => void;
      cameraView: (degrees: number) => void;
      setClay: (enabled: boolean) => void;
      setShadows: (enabled: boolean) => void;
    };
    download: (filename: string, bytes: BlobPart, mime: string) => void;
  },
) {
  const dom = app.ownerDocument;
  app.innerHTML = `
<style>
*{box-sizing:border-box}body{margin:0;background:#161c23;color:#e4eaf0;font:13px/1.5 system-ui}main{display:grid;grid-template-columns:minmax(300px,1fr) 410px;height:100vh}section{position:relative;min-width:0}canvas{width:100%;height:100%;display:block}aside{overflow:auto;padding:20px;background:#10161d}h1{font-size:20px;margin:0}h2{font-size:14px;margin:20px 0 8px}p,small{color:#a9b7c8}button,input,select,textarea{font:inherit;color:inherit;background:#202b37;border:1px solid #405063;border-radius:4px}button{padding:5px 8px;cursor:pointer}button:disabled{opacity:.4}a{color:#a7d1f0}.toolbar{display:flex;gap:6px;flex-wrap:wrap;margin:10px 0}.views{position:absolute;top:10px;left:10px;right:10px}fieldset{border:0;padding:0;margin:0}.row{margin:12px 0}.row label{display:block}.row div{display:flex;gap:10px}.row small{display:block;font-size:11px}.row input[type=range]{flex:1;min-width:0}.row input[type=number]{width:85px;padding:3px}textarea{width:100%;height:230px;font:11px monospace;padding:8px}select{width:100%;padding:6px}#face-status{white-space:pre-wrap;background:#1c2834;padding:10px;border-radius:5px;margin:12px 0}#face-status[data-state=error]{background:#422127;color:#ffd2d2}@media(max-width:780px){main{grid-template-columns:1fr;height:auto}section{height:60vh}}
</style>
<main><section><canvas id="face-canvas"></canvas><div class="toolbar views"><button data-view="0">Front</button><button data-view="45">Left ¾</button><button data-view="-45">Right ¾</button><button data-view="90">Left</button><button data-view="-90">Right</button><button data-view="180">Back</button><button id="fit-view">Fit</button><label><input id="clay" type="checkbox"> Clay</label><label><input id="shadows" type="checkbox" checked> Shadows</label></div></section>
<aside><h1>Connected face editor</h1><p>Shape and expression on one shared surface</p><a href="face.html">Open procedural face editor</a><div id="face-status" role="status">Loading the numerical basis…</div>
<fieldset id="editing" disabled><div class="toolbar"><button id="face-undo">Undo</button><button id="face-redo">Redo</button><button id="face-reset">Reset</button></div><div class="toolbar"><button id="face-save">Save document</button><button id="face-load">Load document</button><button id="face-glb">Export GLB</button><button id="face-contacts">Check contacts</button><input id="face-file" type="file" accept=".json,application/json" hidden></div>
<h2>Expression presets</h2><div id="presets" class="toolbar"></div><h2>Controls</h2><select id="control-kind" aria-label="Control group"><option value="shape">Face shape</option><option value="expression">Expression</option></select><p id="control-help">0 is the source neutral. Weights interpolate authored endpoints; they are not physical measurements. Each control states how far one unit of its endpoints moves the surface.</p><div id="basis-controls"></div><details><summary>Complete document and appearance</summary><textarea id="document-json" aria-label="Complete document"></textarea><button id="document-apply">Apply document</button></details></fieldset></aside></main>`;
  const element = <T extends HTMLElement>(id: string): T =>
    app.querySelector<T>("#" + id)!;
  const viewport = props.viewport(element<HTMLCanvasElement>("face-canvas"));
  let editor:
    | ReturnType<
        typeof createHumanFaceEditor<Model, IAutoMovieHumanFaceBasisDocument>
      >
    | undefined;
  let draft = structuredClone(props.initial);
  let revision = 0;
  const status = (text: string, state: string): void => {
    element("face-status").textContent = text;
    element("face-status").dataset.state = state;
  };
  const withdraw = (): number => {
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
  const refuse = (error: unknown): void => {
    withdraw();
    status(error instanceof Error ? error.message : String(error), "error");
  };
  const refresh = (): void => {
    const state = editor!.snapshot();
    draft = state.document;
    status(
      state.error ??
        `${state.document.name}\n${state.model.parts} material regions · committed numerical state`,
      state.status,
    );
    element<HTMLButtonElement>("face-undo").disabled = !state.canUndo;
    element<HTMLButtonElement>("face-redo").disabled = !state.canRedo;
    element<HTMLTextAreaElement>("document-json").value =
      serializeHumanFaceBasisDocument(state.document);
    controls.refresh();
    appearance.refresh();
  };
  const change = async (
    next: IAutoMovieHumanFaceBasisDocument,
  ): Promise<void> => {
    const ticket = ++revision;
    draft = structuredClone(next);
    status("Building the latest face…", "building");
    const success = await editor!.edit(next);
    if (ticket !== revision) return;
    if (success) viewport.publish(editor!.snapshot().model);
    refresh();
  };
  const applyText = async (text: string): Promise<void> => {
    try {
      await change(parseHumanFaceBasisDocument(text));
    } catch (error) {
      refuse(error);
    }
  };
  const controls = mountConnectedFaceControls(app, {
    basis: props.basis,
    map: props.controlMap,
    document: () => draft,
    change,
    refuse,
  });
  const appearance = mountConnectedFaceAppearance(app, {
    basis: props.basis,
    document: () => draft,
    change,
    refuse,
  });
  for (const button of app.querySelectorAll<HTMLButtonElement>("[data-view]"))
    button.onclick = () => viewport.cameraView(Number(button.dataset.view));
  element("fit-view").onclick = viewport.fitView;
  element<HTMLInputElement>("clay").onchange = () =>
    viewport.setClay(element<HTMLInputElement>("clay").checked);
  element<HTMLInputElement>("shadows").onchange = () =>
    viewport.setShadows(element<HTMLInputElement>("shadows").checked);
  // Selecting a study is an ordinary validated transaction, so failed builds
  // retain the previous face and successful selection participates in history.
  const studies = dom.createElement("select");
  studies.id = "face-study";
  studies.setAttribute("aria-label", "Select a connected face study");
  const placeholder = dom.createElement("option");
  placeholder.value = "";
  placeholder.textContent = "Load an input study";
  studies.append(placeholder);
  for (const [index, study] of (props.studies ?? []).entries()) {
    const option = dom.createElement("option");
    option.value = String(index);
    option.textContent = study.name;
    studies.append(option);
  }
  studies.onchange = async () => {
    const selected = studies.value;
    studies.value = "";
    if (selected === "") return;
    await change(props.studies![Number(selected)]);
  };
  element("editing").prepend(studies);
  for (const action of ["undo", "redo", "reset"] as const)
    element("face-" + action).onclick = async () => {
      const ticket = withdraw();
      status("Restoring the selected face…", "building");
      const success = await editor![action]();
      if (ticket !== revision) return;
      if (success) viewport.publish(editor!.snapshot().model);
      refresh();
    };
  for (const preset of props.presets) {
    const button = dom.createElement("button");
    button.textContent = preset.name;
    button.onclick = () =>
      change({
        ...structuredClone(draft),
        expression: { ...preset.expression },
      });
    element("presets").append(button);
  }
  element("document-apply").onclick = () =>
    applyText(element<HTMLTextAreaElement>("document-json").value);
  element("face-save").onclick = () => {
    const document = editor!.snapshot().document;
    props.download(
      document.id + ".json",
      serializeHumanFaceBasisDocument(document),
      "application/json",
    );
  };
  element("face-glb").onclick = async () => {
    const state = editor!.snapshot();
    const ticket = revision;
    const button = element<HTMLButtonElement>("face-glb");
    button.disabled = true;
    try {
      const bytes = await viewport.export(state.document);
      props.download(state.document.id + ".glb", bytes, "model/gltf-binary");
    } catch (error) {
      if (ticket === revision)
        status(error instanceof Error ? error.message : String(error), "error");
    } finally {
      button.disabled = false;
    }
  };
  // Crossing surfaces are read against the source neutral, not against zero.
  // These counts include internal tissues. Differences from the source neutral
  // measure triangle incidence, not penetration depth or anatomical validity.
  // The reading costs seconds, so it runs on request instead of on every edit.
  let rest: IAutoMovieModelCrossing[] | undefined;
  const label = (crossing: IAutoMovieModelCrossing): string =>
    `${crossing.part} x ${crossing.other}`;
  const describeContacts = (
    before: IAutoMovieModelCrossing[],
    after: IAutoMovieModelCrossing[],
  ): string => {
    const was = new Map(before.map((entry) => [label(entry), entry]));
    const fresh = after.filter((entry) => !was.has(label(entry)));
    const increased = after.filter((entry) => {
      const earlier = was.get(label(entry));
      return (
        earlier !== undefined &&
        entry.triangles + entry.otherTriangles >
          earlier.triangles + earlier.otherTriangles
      );
    });
    const line = (entry: IAutoMovieModelCrossing): string =>
      `${label(entry)} ${entry.triangles}/${entry.otherTriangles}`;
    const reference = `Source neutral: ${before.length} intersecting pairs. Counts do not measure penetration depth or anatomical validity.`;
    if (fresh.length === 0 && increased.length === 0)
      return `No new intersecting pairs or increased triangle counts relative to the source neutral. ${reference}`;
    return [
      fresh.length === 0
        ? null
        : `New intersecting pairs: ${fresh.map(line).join(", ")}`,
      increased.length === 0
        ? null
        : `Increased triangle counts: ${increased.map(line).join(", ")}`,
      reference,
    ]
      .filter((part) => part !== null)
      .join("\n");
  };
  element("face-contacts").onclick = async () => {
    const ticket = withdraw();
    status("Measuring which surfaces cross…", "building");
    try {
      if (rest === undefined) {
        const neutral = await viewport.build(props.initial, true);
        const reading = neutral.crossings;
        viewport.dispose(neutral);
        if (ticket !== revision) return;
        if (reading === null || reading === undefined) {
          status("This build does not supply a crossing reading.", "error");
          return;
        }
        rest = reading;
      }
      const posed = await viewport.build(editor!.snapshot().document, true);
      const reading = posed.crossings;
      viewport.dispose(posed);
      if (ticket !== revision) return;
      status(
        reading === null || reading === undefined
          ? "This build does not supply a crossing reading."
          : describeContacts(rest, reading),
        reading === null || reading === undefined ? "error" : "ready",
      );
    } catch (error) {
      if (ticket === revision) refuse(error);
    }
  };
  element("face-load").onclick = () =>
    element<HTMLInputElement>("face-file").click();
  element<HTMLInputElement>("face-file").onchange = async () => {
    const input = element<HTMLInputElement>("face-file"),
      file = input.files?.[0];
    if (file === undefined) return;
    input.value = "";
    const ticket = withdraw();
    try {
      const text = await file.text();
      if (ticket !== revision) return;
      await applyText(text);
    } catch (error) {
      if (ticket === revision) refuse(error);
    }
  };
  const ready = (async (): Promise<void> => {
    const ticket = ++revision;
    try {
      const model = await viewport.build(props.initial);
      if (ticket !== revision) {
        viewport.dispose(model);
        return;
      }
      editor = createHumanFaceEditor({
        document: props.initial,
        model,
        build: viewport.build,
      });
      viewport.publish(model);
      viewport.fitView();
      element<HTMLFieldSetElement>("editing").disabled = false;
      refresh();
    } catch (error) {
      if (ticket === revision) refuse(error);
    }
  })();
  return { ready, snapshot: () => editor?.snapshot() };
}
