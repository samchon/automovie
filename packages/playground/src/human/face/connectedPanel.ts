/**
 * Browser adapter for a connected facial basis, sharing the ordinary face
 * editor's transaction and viewport owners. This panel owns only DOM inputs,
 * draft composition, file-read generations and the millimetre formatting of the
 * package's channel scale measurement. The package validates controls,
 * forms the model and exports it; camera/clay state never enters the document.
 * A failed or superseded edit retains the committed preview and downloads.
 */
import type { IAutoMovieModelCrossing } from "@automovie/engine";
import type { IAutoMovieHumanFaceBasisDocument } from "@automovie/human";
import { parseHumanFaceBasisDocument } from "@automovie/human/face/document/parseHumanFaceBasisDocument";
import { serializeHumanFaceBasisDocument } from "@automovie/human/face/document/serializeHumanFaceBasisDocument";
import { createHumanFaceEditor } from "@automovie/human/face/editor/createHumanFaceEditor";

import type { IConnectedFacePanelModel } from "./IConnectedFacePanelModel";
import type { IConnectedFacePanelProps } from "./IConnectedFacePanelProps";
import { mountConnectedFaceAppearance } from "./connectedAppearance";
import { mountConnectedFaceControls } from "./connectedControls";
import { describeConnectedFaceContacts } from "./describeConnectedFaceContacts";

/**
 * Mount editable endpoint controls around an injected numerical viewport.
 * Weight ranges come from the admitted basis. Displaying a source control does
 * not turn its artistic endpoint into a measured anatomical quantity.
 *
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-editor Provides shape/expression inputs, presets, history, file IO and orbit/clay controls for a connected facial prior.
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-editor-state Publishes and downloads only the latest committed document/model while refusing invalid or obsolete requests.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-editor-view Binds scalar controls to numerical edits, states each control's envelope and measured metric effect, and keeps camera and display state outside replay data.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-editor Shares transactional history and cancels stale file reads and builds by generation.
 * @evidenceExclude requirements/actors/facial-authoring/README.md#face-requirements The panel is the face editing screen alone; the face domain index also spans the package builder, provenance and review.
 * @evidenceExclude requirements/actors/facial-authoring/contract.md#actor-face-anatomical-components The panel lists component controls and composes no component; the package builder does.
 * @evidenceExclude requirements/actors/facial-authoring/contract.md#actor-face-articulation The panel displays articulation readings and evaluates no jaw, lid or attachment; the package builder does.
 * @evidenceExclude requirements/actors/facial-authoring/contract.md#actor-face-contact The panel reports contact readings and evaluates no lip, tooth or tongue contact; the package builder does.
 * @evidenceExclude requirements/actors/facial-authoring/contract.md#actor-face-controls-replacement The panel binds controls to the document; the package resolves controls and replacements.
 * @evidenceExclude requirements/actors/facial-authoring/contract.md#actor-face-document The panel parses and serializes through the package and defines no document rule.
 * @evidenceExclude requirements/actors/facial-authoring/contract.md#actor-face-expression The panel applies expression presets; the package separates identity from expression.
 * @evidenceExclude requirements/actors/facial-authoring/contract.md#actor-face-provenance The panel records no photograph provenance.
 * @evidenceExclude requirements/actors/facial-authoring/contract.md#actor-face-review The panel produces no review evidence or likeness judgement.
 * @evidenceExclude requirements/actors/facial-authoring/contract.md#actor-face-skin-colour The panel colours no skin; the package builder does.
 * @evidenceExclude requirements/actors/facial-authoring/contract.md#actor-face-skin-condition The panel shapes no skin condition or wrinkle.
 * @evidenceExclude requirements/actors/facial-authoring/contract.md#actor-face-surface-maps The panel builds no surface map.
 * @evidenceExclude specifications/asset-and-representation/facial-authoring/README.md#face-specifications The panel owns the face editing screen boundary only.
 * @evidenceExclude specifications/asset-and-representation/facial-authoring/contract.md#face-spec-articulation The panel evaluates no articulation.
 * @evidenceExclude specifications/asset-and-representation/facial-authoring/contract.md#face-spec-attachments The panel builds no shared joint or internal structure.
 * @evidenceExclude specifications/asset-and-representation/facial-authoring/contract.md#face-spec-components The panel builds no component or surface composition.
 * @evidenceExclude specifications/asset-and-representation/facial-authoring/contract.md#face-spec-contact The panel evaluates no contact.
 * @evidenceExclude specifications/asset-and-representation/facial-authoring/contract.md#face-spec-controls The panel resolves no control or replacement.
 * @evidenceExclude specifications/asset-and-representation/facial-authoring/contract.md#face-spec-document The panel holds no replay basis of its own.
 * @evidenceExclude specifications/asset-and-representation/facial-authoring/contract.md#face-spec-expression The panel defines no expression or optical reference.
 * @evidenceExclude specifications/asset-and-representation/facial-authoring/contract.md#face-spec-parametric-hair The panel generates no hair.
 * @evidenceExclude specifications/asset-and-representation/facial-authoring/contract.md#face-spec-provenance The panel executes no photograph source.
 * @evidenceExclude specifications/asset-and-representation/facial-authoring/contract.md#face-spec-review The panel records no review state or source.
 * @evidenceExclude specifications/asset-and-representation/facial-authoring/contract.md#face-spec-skin-colour The panel colours no skin.
 * @evidenceExclude specifications/asset-and-representation/facial-authoring/contract.md#face-spec-skin-condition The panel divides no skin into local regions.
 */
export function mountConnectedFacePanel<Model extends IConnectedFacePanelModel>(
  app: HTMLElement,
  props: IConnectedFacePanelProps<Model>,
) {
  const dom = app.ownerDocument;
  app.innerHTML = `
<style>
*{box-sizing:border-box}body{margin:0;background:#161c23;color:#e4eaf0;font:13px/1.5 system-ui}main{display:grid;grid-template-columns:minmax(300px,1fr) 410px;height:100vh}section{position:relative;min-width:0}canvas{width:100%;height:100%;display:block}aside{overflow:auto;padding:20px;background:#10161d}h1{font-size:20px;margin:0}h2{font-size:14px;margin:20px 0 8px}p,small{color:#a9b7c8}button,input,select,textarea{font:inherit;color:inherit;background:#202b37;border:1px solid #405063;border-radius:4px}button{padding:5px 8px;cursor:pointer}button:disabled{opacity:.4}a{color:#a7d1f0}.toolbar{display:flex;gap:6px;flex-wrap:wrap;margin:10px 0}.views{position:absolute;top:10px;left:10px;right:10px}fieldset{border:0;padding:0;margin:0}.row{margin:12px 0}.row label{display:block}.row div{display:flex;gap:10px}.row small{display:block;font-size:11px}.row input[type=range]{flex:1;min-width:0}.row input[type=number]{width:85px;padding:3px}textarea{width:100%;height:230px;font:11px monospace;padding:8px}select{width:100%;padding:6px}#face-status{white-space:pre-wrap;background:#1c2834;padding:10px;border-radius:5px;margin:12px 0}#face-status[data-state=error]{background:#422127;color:#ffd2d2}@media(max-width:780px){main{grid-template-columns:1fr;height:auto}section{height:60vh}}
</style>
<main><section><canvas id="face-canvas"></canvas><div class="toolbar views"><button data-view="0">Front</button><button data-view="45">Left ¾</button><button data-view="-45">Right ¾</button><button data-view="90">Left</button><button data-view="-90">Right</button><button data-view="180">Back</button><button id="fit-view">Fit</button><label><input id="clay" type="checkbox"> Clay</label><label><input id="shadows" type="checkbox" checked> Shadows</label><label><input id="occlusion" type="checkbox" checked> Occlusion</label></div></section>
<aside><h1>Face editor</h1><p>Numerical shape, expression, skin and hair</p><div id="face-status" role="status">Loading the numerical basis…</div>
<fieldset id="editing" disabled><div class="toolbar"><button id="face-undo">Undo</button><button id="face-redo">Redo</button><button id="face-reset">Reset</button></div><div class="toolbar"><button id="face-save">Save document</button><button id="face-load">Load document</button><button id="face-glb">Export GLB</button><button id="face-contacts">Check contacts</button><input id="face-file" type="file" accept=".json,application/json" hidden></div>
<h2>Expression presets</h2><div id="presets" class="toolbar"></div><h2>Controls</h2><select data-role="control-kind" aria-label="Control group"><option value="shape">Face shape</option><option value="expression">Expression</option></select><p data-role="control-help">0 is the source neutral. Weights interpolate authored endpoints; they are not physical measurements. Each control states how far one unit of its endpoints moves the surface.</p><div data-role="basis-controls"></div><details><summary>Complete document and appearance</summary><textarea id="document-json" aria-label="Complete document"></textarea><button id="document-apply">Apply document</button></details></fieldset></aside></main>`;
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
    // The joint line reads what the builder posed: opening in degrees, the
    // mandible's translation against its sagittal budget, each gaze angle.
    const joints = state.model.articulation;
    const articulated =
      joints === undefined || joints === null
        ? ""
        : `
Jaw ${joints.jaw.degrees.toFixed(1)}° open, ${(joints.jaw.translationMetres * 1000).toFixed(1)} of ${(joints.jaw.budgetMetres * 1000).toFixed(1)} mm condylar travel · ` +
          joints.eyes
            .map((eye) => `${eye.id} ${eye.degrees.toFixed(1)}°`)
            .join(", ");
    // The contact line reads what the contact stage measured and did: both
    // apertures, the closure ratio, the tongue's passage and every push.
    const contact = state.model.contact;
    const contacted =
      contact === undefined || contact === null
        ? ""
        : `
Lips ${(contact.interlabialMetres * 1000).toFixed(1)} mm, incisors ${contact.interincisalMetres === null ? "measurement unavailable (representative absent)" : (contact.interincisalMetres * 1000).toFixed(1) + " mm apart"} · closure ×${contact.closureRatio.toFixed(2)}` +
          (contact.passage === null
            ? ""
            : ` · tongue ${(contact.passage.protrudingMetres * 1000).toFixed(1)} mm out, ${(contact.passage.thicknessMetres * 1000).toFixed(1)} mm thick`) +
          contact.resolved
            .filter((entry) => entry.vertices > 0)
            .map(
              (entry) =>
                ` · ${entry.surface}: ${entry.vertices} vertices held out of the teeth (${(entry.maxDepthMetres * 1000).toFixed(2)} mm)`,
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
    components: props.componentTree,
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
  // Every build bakes the face's ambient occlusion while the box is checked;
  // a change applies from the next build.
  const occlusion = () => element<HTMLInputElement>("occlusion").checked;
  const build = (document: IAutoMovieHumanFaceBasisDocument, measure = false) =>
    viewport.build(document, measure, occlusion());
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
      const bytes = await viewport.export(state.document, occlusion());
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
  element("face-contacts").onclick = async () => {
    const ticket = withdraw();
    status("Measuring which surfaces cross…", "building");
    try {
      if (rest === undefined) {
        const neutral = await build(props.initial, true);
        const reading = neutral.crossings;
        viewport.dispose(neutral);
        if (ticket !== revision) return;
        if (reading === null || reading === undefined) {
          status("This build does not supply a crossing reading.", "error");
          return;
        }
        rest = reading;
      }
      const posed = await build(editor!.snapshot().document, true);
      const reading = posed.crossings;
      viewport.dispose(posed);
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
      const model = await build(props.initial);
      if (ticket !== revision) {
        viewport.dispose(model);
        return;
      }
      editor = createHumanFaceEditor({
        document: props.initial,
        model,
        build,
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
