/**
 * Browser adapter for the connected body basis, sharing the face editor's
 * transaction and viewport owners. This panel owns only DOM inputs, draft
 * composition, file-read generations and the millimetre formatting of the
 * package's channel measurements. The package validates controls, forms and
 * skins the model and exports it; camera and clay state never enter the
 * document, and neither does the face shown beside the body.
 */
import type { IAutoMovieModelCrossing } from "@automovie/engine";
import {
  type IAutoMovieHumanBodyBasis,
  type IAutoMovieHumanBodyBasisDocument,
  type IAutoMovieHumanBodyChannelScale,
  type IAutoMovieHumanBodySimpleShape,
  createHumanFaceEditor,
  measureHumanBodyBasisChannels,
  parseHumanBodyBasisDocument,
  serializeHumanBodyBasisDocument,
} from "@automovie/human";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieJointPose,
} from "@automovie/interface";

import { renderBodyPoseControls } from "./bodyPoseControls";
import { renderBodySimpleControls } from "./bodySimpleControls";

/**
 * Mount the body's shape, measurement and pose controls around an injected
 * numerical viewport. Weight ranges, measurement rules, joint ranges and rest
 * angles all come from the admitted basis; the panel formats and binds them.
 *
 * @evidence requirements/actors/body-authoring/contract.md#actor-body-editor Provides grouped shape controls in millimetres where a rule exists, clinical joint controls, the simple tier, presets, history, file IO, contact check and orbit/clay/face display for one connected body.
 * @evidence requirements/actors/body-authoring/contract.md#actor-body-measurements Prints each measured channel's neutral and end values in millimetres beside its dimensionless weight.
 * @evidence specifications/asset-and-representation/body-authoring/contract.md#body-spec-editor-view Binds scalar controls to numerical edits, states each control's envelope and measured effect, and keeps camera, clay and the companion face outside replay data.
 * @evidence specifications/asset-and-representation/body-authoring/contract.md#body-spec-editor Shares the face's transactional history and cancels stale file reads and builds by generation.
 * @evidenceExclude requirements/actors/body-authoring/README.md#body-requirements The panel is the editing screen alone; extraction, the package evaluator and the census review are other owners of this domain index.
 * @evidenceExclude requirements/actors/body-authoring/contract.md#actor-body-connected-basis The panel evaluates no basis endpoint, corrective or identity row; the package builder in the worker does.
 * @evidenceExclude requirements/actors/body-authoring/contract.md#actor-body-joints The panel articulates no joint and applies no skin weight; it binds inputs to the document the builder evaluates.
 * @evidenceExclude requirements/actors/body-authoring/contract.md#actor-body-document The panel serializes and parses through the package's document functions and owns no admission rule.
 * @evidenceExclude requirements/actors/body-authoring/contract.md#actor-body-export The panel downloads the bytes the worker exported; the package exporter owns the format.
 * @evidenceExclude specifications/asset-and-representation/body-authoring/README.md#body-specifications The panel owns the editing screen boundary only.
 * @evidenceExclude specifications/asset-and-representation/body-authoring/contract.md#body-spec-basis The panel performs no basis evaluation.
 * @evidenceExclude specifications/asset-and-representation/body-authoring/contract.md#body-spec-joints The panel performs no skinning or pose resolution.
 * @evidenceExclude specifications/asset-and-representation/body-authoring/contract.md#body-spec-measurements The panel formats the measurements the package computed.
 * @evidenceExclude specifications/asset-and-representation/body-authoring/contract.md#body-spec-document The panel calls the package's parse and serialize functions.
 * @evidenceExclude specifications/asset-and-representation/body-authoring/contract.md#body-spec-export The panel calls no glTF writer.
 */
export function mountConnectedBodyPanel<
  Model extends {
    glb: Uint8Array<ArrayBuffer>;
    parts: number;
    crossings?: IAutoMovieModelCrossing[] | null;
    extras?: Record<string, unknown>;
  },
>(
  app: HTMLElement,
  props: {
    basis: IAutoMovieHumanBodyBasis;
    initial: IAutoMovieHumanBodyBasisDocument;
    /** A preset's shape, or a function that solves it when it is chosen (the simple tier's archetypes take seconds, off the page's thread). */
    shapes: {
      name: string;
      shape: Record<string, number> | (() => Promise<Record<string, number>>);
    }[];
    poses: { name: string; pose: IAutoMovieJointPose[] }[];
    viewport: (canvas: HTMLCanvasElement) => {
      build: (
        document: IAutoMovieHumanBodyBasisDocument,
        measure?: boolean,
      ) => Promise<Model>;
      cancel: () => void;
      publish: (model: Model) => void;
      dispose: (model: Model) => void;
      fitView: () => void;
      cameraView: (degrees: number) => void;
      setClay: (enabled: boolean) => void;
      setShadows: (enabled: boolean) => void;
    };
    /** Seat the companion face on the published body, or hide it. */
    seat: (model: Model | null) => void;
    /** The simple tier, solved off the page's thread. */
    simple: {
      expand: (
        simple: IAutoMovieHumanBodySimpleShape,
        over: Record<string, number>,
      ) => Promise<Record<string, number>>;
      project: (
        shape: Record<string, number>,
      ) => Promise<IAutoMovieHumanBodySimpleShape>;
    };
    download: (filename: string, bytes: BlobPart, mime: string) => void;
  },
) {
  const dom = app.ownerDocument;
  const scales = new Map(
    measureHumanBodyBasisChannels(props.basis).map((scale) => [
      scale.id,
      scale,
    ]),
  );
  const mm = (metres: number | null): string =>
    metres === null ? "n/a" : (metres * 1000).toFixed(1) + " mm";
  const describe = (scale: IAutoMovieHumanBodyChannelScale): string => {
    if (scale.measurement !== null) {
      const m = scale.measurement;
      return (
        `${m.kind} ${m.id}: neutral ${mm(m.neutral)} · +1 → ${mm(m.positive)}` +
        (m.negative === null ? "" : ` · -1 → ${mm(m.negative)}`)
      );
    }
    const side = (sign: string, end: typeof scale.positive): string =>
      `${sign}1 moves ${mm(end.displacement)} rms, ${mm(end.peak)} peak on ${end.vertices} vertices`;
    return [
      side("+", scale.positive),
      ...(scale.negative === null ? [] : [side("-", scale.negative)]),
    ].join(" · ");
  };
  const groups = [...new Set(props.basis.channels.map((c) => c.group))];
  app.innerHTML = `
<style>
*{box-sizing:border-box}body{margin:0;background:#161c23;color:#e4eaf0;font:13px/1.5 system-ui}main{display:grid;grid-template-columns:minmax(300px,1fr) 430px;height:100vh}section{position:relative;min-width:0}canvas{width:100%;height:100%;display:block}aside{overflow:auto;padding:20px;background:#10161d}h1{font-size:20px;margin:0}h2{font-size:14px;margin:20px 0 8px}p,small{color:#a9b7c8}button,input,select,textarea{font:inherit;color:inherit;background:#202b37;border:1px solid #405063;border-radius:4px}button{padding:5px 8px;cursor:pointer}button:disabled{opacity:.4}a{color:#a7d1f0}.toolbar{display:flex;gap:6px;flex-wrap:wrap;margin:10px 0}.views{position:absolute;top:10px;left:10px;right:10px}fieldset{border:0;padding:0;margin:0}.row{margin:12px 0}.row label{display:block}.row div{display:flex;gap:10px}.row small{display:block;font-size:11px}.row input[type=range]{flex:1;min-width:0}.row input[type=number]{width:85px;padding:3px}textarea{width:100%;height:230px;font:11px monospace;padding:8px}select{width:100%;padding:6px}#body-status{white-space:pre-wrap;background:#1c2834;padding:10px;border-radius:5px;margin:12px 0}#body-status[data-state=error]{background:#422127;color:#ffd2d2}@media(max-width:780px){main{grid-template-columns:1fr;height:auto}section{height:60vh}}
</style>
<main><section><canvas id="body-canvas"></canvas><div class="toolbar views"><button data-view="0">Front</button><button data-view="45">Left ¾</button><button data-view="-45">Right ¾</button><button data-view="90">Left</button><button data-view="-90">Right</button><button data-view="180">Back</button><button id="fit-view">Fit</button><label><input id="clay" type="checkbox"> Clay</label><label><input id="shadows" type="checkbox" checked> Shadows</label><label><input id="face" type="checkbox" checked> Face</label></div></section>
<aside><h1>Connected body editor</h1><p>Shape in millimetres and joints in clinical degrees on one connected skin</p><a href="connected-face.html">Open connected face editor</a><div id="body-status" role="status">Loading the numerical basis…</div>
<fieldset id="editing" disabled><div class="toolbar"><button id="body-undo">Undo</button><button id="body-redo">Redo</button><button id="body-reset">Reset</button></div><div class="toolbar"><button id="body-save">Save document</button><button id="body-load">Load document</button><button id="body-glb">Export GLB</button><button id="body-contacts">Check contacts</button><input id="body-file" type="file" accept=".json,application/json" hidden></div>
<h2>Simple body</h2><p>Identity-card values and tape measurements, read off the current body and expanded into the detailed channels; age sags and softens, muscle defines only where the body fat lets it.</p><div id="simple-controls"></div><h2>Body presets</h2><div id="shape-presets" class="toolbar"></div><h2>Pose presets</h2><div id="pose-presets" class="toolbar"></div><h2>Controls</h2><select id="control-kind" aria-label="Control group">${groups.map((g) => `<option value="${g}">${g === "macro" ? "Macro (gender, age, weight, muscle, height…)" : "Shape · " + g}</option>`).join("")}<option value="pose">Pose · joints</option></select><p>0 is the source neutral. A measured channel states its girth, length or height in millimetres at neutral and at each end; a joint states its clinical range and rest angle.</p><div id="basis-controls"></div><details><summary>Complete document</summary><textarea id="document-json" aria-label="Complete document"></textarea><button id="document-apply">Apply document</button></details></fieldset></aside></main>`;
  const element = <T extends HTMLElement>(id: string): T =>
    app.querySelector<T>("#" + id)!;
  const viewport = props.viewport(element<HTMLCanvasElement>("body-canvas"));
  let editor:
    | ReturnType<
        typeof createHumanFaceEditor<Model, IAutoMovieHumanBodyBasisDocument>
      >
    | undefined;
  let draft = structuredClone(props.initial);
  let revision = 0;
  let bone: AutoMovieHumanoidBone = "leftUpperArm";
  const status = (text: string, state: string): void => {
    element("body-status").textContent = text;
    element("body-status").dataset.state = state;
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
  const show = (model: Model): void => {
    viewport.publish(model);
    props.seat(element<HTMLInputElement>("face").checked ? model : null);
  };
  const refresh = (): void => {
    const state = editor!.snapshot();
    draft = state.document;
    status(
      state.error ??
        `${state.document.name}\n${state.model.parts} material regions · ${state.document.pose?.length ?? 0} posed joints · committed numerical state`,
      state.status,
    );
    element<HTMLButtonElement>("body-undo").disabled = !state.canUndo;
    element<HTMLButtonElement>("body-redo").disabled = !state.canRedo;
    element<HTMLTextAreaElement>("document-json").value =
      serializeHumanBodyBasisDocument(state.document);
    void simple.refresh(state.document.shape);
    renderControls();
  };
  const change = async (
    next: IAutoMovieHumanBodyBasisDocument,
  ): Promise<void> => {
    const ticket = ++revision;
    draft = structuredClone(next);
    status("Building the latest body…", "building");
    const success = await editor!.edit(next);
    if (ticket !== revision) return;
    if (success) show(editor!.snapshot().model);
    refresh();
  };
  const applyText = async (text: string): Promise<void> => {
    try {
      await change(parseHumanBodyBasisDocument(text));
    } catch (error) {
      refuse(error);
    }
  };
  const renderControls = (): void => {
    const kind = element<HTMLSelectElement>("control-kind").value;
    const query = element<HTMLInputElement>("control-search")
      .value.toLowerCase()
      .replace(/\s/g, "");
    const container = element("basis-controls");
    container.replaceChildren();
    if (kind === "pose") {
      const picker = dom.createElement("select");
      picker.id = "pose-bone";
      picker.setAttribute("aria-label", "Joint");
      for (const joint of props.basis.joints)
        if (joint.bone.toLowerCase().includes(query)) {
          const option = dom.createElement("option");
          option.value = joint.bone;
          option.textContent =
            joint.bone +
            (draft.pose?.some((one) => one.bone === joint.bone) ? " ●" : "");
          picker.append(option);
        }
      picker.value = bone;
      if (picker.value !== bone && picker.options.length > 0) {
        bone = picker.options[0].value as AutoMovieHumanoidBone;
        picker.value = bone;
      }
      picker.onchange = () => {
        bone = picker.value as AutoMovieHumanoidBone;
        renderControls();
      };
      const rows = dom.createElement("div");
      container.append(picker, rows);
      renderBodyPoseControls({
        dom,
        container: rows,
        basis: props.basis,
        bone,
        pose: draft.pose ?? [],
        onChange: (pose) => {
          void change({ ...structuredClone(draft), pose });
        },
      });
      return;
    }
    for (const channel of props.basis.channels.filter(
      (channel) =>
        channel.group === kind && channel.id.toLowerCase().includes(query),
    )) {
      const row = dom.createElement("div"),
        label = dom.createElement("label"),
        entry = dom.createElement("div"),
        slider = dom.createElement("input"),
        number = dom.createElement("input"),
        note = dom.createElement("small");
      row.className = "row";
      label.textContent = channel.id.replace(/([a-z])([A-Z])/g, "$1 $2");
      slider.type = "range";
      number.type = "number";
      number.min = String(channel.minimum);
      slider.min = number.min;
      number.max = String(channel.maximum);
      slider.max = number.max;
      slider.step = "0.01";
      number.step = "any";
      number.value = String(draft.shape[channel.id] ?? 0);
      slider.value = number.value;
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
        if (Number(value) === 0) delete next.shape[channel.id];
        else next.shape[channel.id] = Number(value);
        await change(next);
      };
      slider.oninput = () => {
        number.value = slider.value;
      };
      slider.onchange = () => editValue(slider.value);
      number.onchange = () => editValue(number.value);
      entry.append(slider, number);
      note.id = "scale-" + channel.id;
      note.textContent = describe(scales.get(channel.id)!);
      row.append(label, entry, note);
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
  element<HTMLInputElement>("face").onchange = () => {
    if (editor !== undefined) show(editor.snapshot().model);
  };
  element<HTMLSelectElement>("control-kind").onchange = renderControls;
  const search = dom.createElement("input");
  search.id = "control-search";
  search.type = "search";
  search.placeholder = "Find a control: waist, hip, shoulder, knee…";
  search.setAttribute("aria-label", "Find a body control");
  search.style.width = "100%";
  search.oninput = renderControls;
  element("basis-controls").before(search);
  for (const action of ["undo", "redo", "reset"] as const)
    element("body-" + action).onclick = async () => {
      const ticket = withdraw();
      status("Restoring the selected body…", "building");
      const success = await editor![action]();
      if (ticket !== revision) return;
      if (success) show(editor!.snapshot().model);
      refresh();
    };
  const simple = renderBodySimpleControls({
    dom,
    container: element("simple-controls"),
    expand: props.simple.expand,
    project: props.simple.project,
    current: () => draft.shape,
    onApply: (shape) => void change({ ...structuredClone(draft), shape }),
    onRefuse: refuse,
    onBusy: (text) => status(text, "building"),
  });
  for (const preset of props.shapes) {
    const button = dom.createElement("button");
    button.textContent = preset.name;
    button.onclick = async () => {
      try {
        if (typeof preset.shape === "function")
          status("Solving the " + preset.name + " preset…", "building");
        const shape =
          typeof preset.shape === "function"
            ? await preset.shape()
            : preset.shape;
        void change({ ...structuredClone(draft), shape: { ...shape } });
      } catch (error) {
        refuse(error);
      }
    };
    element("shape-presets").append(button);
  }
  for (const preset of props.poses) {
    const button = dom.createElement("button");
    button.textContent = preset.name;
    button.onclick = () =>
      change({ ...structuredClone(draft), pose: structuredClone(preset.pose) });
    element("pose-presets").append(button);
  }
  element("document-apply").onclick = () =>
    applyText(element<HTMLTextAreaElement>("document-json").value);
  element("body-save").onclick = () => {
    const document = editor!.snapshot().document;
    props.download(
      document.id + ".json",
      serializeHumanBodyBasisDocument(document),
      "application/json",
    );
  };
  element("body-glb").onclick = () => {
    const state = editor!.snapshot();
    props.download(
      state.document.id + ".glb",
      state.model.glb,
      "model/gltf-binary",
    );
  };
  // The body's rest crosses nothing by construction (the shipped census says
  // so), so the reading is absolute: any pair is a finding.
  const line = (entry: IAutoMovieModelCrossing): string =>
    `${entry.part} x ${entry.other} ${entry.triangles}/${entry.otherTriangles}`;
  element("body-contacts").onclick = async () => {
    const ticket = withdraw();
    status("Measuring which skin segments cross…", "building");
    try {
      const posed = await viewport.build(editor!.snapshot().document, true);
      const reading = posed.crossings;
      viewport.dispose(posed);
      if (ticket !== revision) return;
      status(
        reading === null || reading === undefined
          ? "This build does not supply a crossing reading."
          : reading.length === 0
            ? "No skin segment crosses another in this pose."
            : "Crossing segments: " + reading.map(line).join(", "),
        reading === null || reading === undefined ? "error" : "ready",
      );
    } catch (error) {
      if (ticket === revision) refuse(error);
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
      show(model);
      viewport.fitView();
      element<HTMLFieldSetElement>("editing").disabled = false;
      refresh();
    } catch (error) {
      if (ticket === revision) refuse(error);
    }
  })();
  return {
    ready,
    snapshot: () => editor?.snapshot(),
    change: (document: IAutoMovieHumanBodyBasisDocument) => change(document),
  };
}
