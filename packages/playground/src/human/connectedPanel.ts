/**
 * Browser adapter for a connected facial basis, sharing the ordinary face
 * editor's transaction and viewport owners. This panel owns only DOM inputs,
 * draft composition and file-read generations. The package validates controls,
 * forms the model and exports it; camera/clay state never enters the document.
 * A failed or superseded edit retains the committed preview and downloads.
 */
import {
  type IAutoMovieHumanFaceBasis,
  type IAutoMovieHumanFaceBasisDocument,
  createHumanFaceEditor,
  parseHumanFaceBasisDocument,
  serializeHumanFaceBasisDocument,
} from "@automovie/human";

/**
 * Mount editable endpoint controls around an injected numerical viewport.
 * Weight ranges come from the admitted basis. Displaying a source control does
 * not turn its artistic endpoint into a measured anatomical quantity.
 *
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-editor Provides shape/expression inputs, presets, history, file IO and orbit/clay controls for a connected facial prior.
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-editor-state Publishes and downloads only the latest committed document/model while refusing invalid or obsolete requests.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-editor-view Binds scalar controls to numerical edits and keeps camera and display state outside replay data.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-editor Shares transactional history and cancels stale file reads and builds by generation.
 */
export function mountConnectedFacePanel<
  Model extends { glb: Uint8Array<ArrayBuffer>; parts: number },
>(
  app: HTMLElement,
  props: {
    channels: IAutoMovieHumanFaceBasis["channels"];
    initial: IAutoMovieHumanFaceBasisDocument;
    presets: { name: string; expression: Record<string, number> }[];
    viewport: (canvas: HTMLCanvasElement) => {
      build: (document: IAutoMovieHumanFaceBasisDocument) => Promise<Model>;
      cancel: () => void;
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
*{box-sizing:border-box}body{margin:0;background:#161c23;color:#e4eaf0;font:13px/1.5 system-ui}main{display:grid;grid-template-columns:minmax(300px,1fr) 410px;height:100vh}section{position:relative;min-width:0}canvas{width:100%;height:100%;display:block}aside{overflow:auto;padding:20px;background:#10161d}h1{font-size:20px;margin:0}h2{font-size:14px;margin:20px 0 8px}p,small{color:#a9b7c8}button,input,select,textarea{font:inherit;color:inherit;background:#202b37;border:1px solid #405063;border-radius:4px}button{padding:5px 8px;cursor:pointer}button:disabled{opacity:.4}a{color:#a7d1f0}.toolbar{display:flex;gap:6px;flex-wrap:wrap;margin:10px 0}.views{position:absolute;top:10px;left:10px;right:10px}fieldset{border:0;padding:0;margin:0}.row{margin:12px 0}.row label{display:block}.row div{display:flex;gap:10px}.row input[type=range]{flex:1;min-width:0}.row input[type=number]{width:85px;padding:3px}textarea{width:100%;height:230px;font:11px monospace;padding:8px}select{width:100%;padding:6px}#face-status{white-space:pre-wrap;background:#1c2834;padding:10px;border-radius:5px;margin:12px 0}#face-status[data-state=error]{background:#422127;color:#ffd2d2}@media(max-width:780px){main{grid-template-columns:1fr;height:auto}section{height:60vh}}
</style>
<main><section><canvas id="face-canvas"></canvas><div class="toolbar views"><button data-view="0">Front</button><button data-view="45">Left ¾</button><button data-view="-45">Right ¾</button><button data-view="90">Left</button><button data-view="-90">Right</button><button data-view="180">Back</button><button id="fit-view">Fit</button><label><input id="clay" type="checkbox"> Clay</label><label><input id="shadows" type="checkbox" checked> Shadows</label></div></section>
<aside><h1>Connected face editor</h1><p>Shape and expression on one shared surface</p><a href="face.html">Open procedural face editor</a><div id="face-status" role="status">Loading the numerical basis…</div>
<fieldset id="editing" disabled><div class="toolbar"><button id="face-undo">Undo</button><button id="face-redo">Redo</button><button id="face-reset">Reset</button></div><div class="toolbar"><button id="face-save">Save document</button><button id="face-load">Load document</button><button id="face-glb">Export GLB</button><input id="face-file" type="file" accept=".json,application/json" hidden></div>
<h2>Expression presets</h2><div id="presets" class="toolbar"></div><h2>Controls</h2><select id="control-kind" aria-label="Control group"><option value="shape">Face shape</option><option value="expression">Expression</option></select><p>0 is the source neutral. Weights interpolate authored endpoints; they are not physical measurements.</p><div id="basis-controls"></div><details><summary>Complete document and appearance</summary><textarea id="document-json" aria-label="Complete document"></textarea><button id="document-apply">Apply document</button></details></fieldset></aside></main>`;
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
    return ++revision;
  };
  const refuse = (error: unknown): void => {
    withdraw();
    if (editor !== undefined) draft = editor.snapshot().document;
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
    renderControls();
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
  const renderControls = (): void => {
    const kind = element<HTMLSelectElement>("control-kind").value;
    const container = element("basis-controls");
    container.replaceChildren();
    for (const channel of props.channels.filter(
      (channel) => channel.kind === kind,
    )) {
      const row = dom.createElement("div"),
        label = dom.createElement("label"),
        entry = dom.createElement("div");
      row.className = "row";
      label.textContent = channel.id.replace(/([a-z])([A-Z])/g, "$1 $2");
      const slider = dom.createElement("input"),
        number = dom.createElement("input");
      slider.type = "range";
      number.type = "number";
      slider.min = String(channel.minimum);
      number.min = slider.min;
      slider.max = String(channel.maximum);
      number.max = slider.max;
      slider.step = "0.01";
      number.step = "any";
      slider.value = String(
        editor!.snapshot().document[channel.kind][channel.id] ?? 0,
      );
      number.value = slider.value;
      number.id = "control-" + channel.id;
      slider.id = number.id + "-slider";
      label.htmlFor = number.id;
      slider.setAttribute("aria-label", label.textContent + " slider");
      const editValue = async (value: string): Promise<void> => {
        if (value.trim() === "") {
          refuse("A numeric value is required.");
          return;
        }
        const next = structuredClone(draft);
        next[channel.kind][channel.id] = Number(value);
        await change(next);
      };
      slider.oninput = () => {
        number.value = slider.value;
      };
      slider.onchange = () => editValue(slider.value);
      number.onchange = () => editValue(number.value);
      entry.append(slider, number);
      row.append(label, entry);
      container.append(row);
    }
  };
  for (const button of app.querySelectorAll<HTMLButtonElement>("[data-view]"))
    button.onclick = () => viewport.cameraView(Number(button.dataset.view));
  element("fit-view").onclick = viewport.fitView;
  element<HTMLInputElement>("clay").onchange = () =>
    viewport.setClay(element<HTMLInputElement>("clay").checked);
  element<HTMLInputElement>("shadows").onchange = () =>
    viewport.setShadows(element<HTMLInputElement>("shadows").checked);
  element<HTMLSelectElement>("control-kind").onchange = renderControls;
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
  element("face-glb").onclick = () => {
    const state = editor!.snapshot();
    props.download(
      state.document.id + ".glb",
      state.model.glb,
      "model/gltf-binary",
    );
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
