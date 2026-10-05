/**
 * The connected body editor's screen: its stylesheet, the canvas with the
 * view toolbar, and the side panel with the editing controls, as one HTML
 * string for the panel to mount.
 *
 * The panel binds behaviour to these element ids and owns no markup of its
 * own, so the ids are the contract between this file and the panel. Only the
 * detailed-control selector varies with the basis: one option per channel
 * group that has a measurement rule, then the pose group. Group names come
 * from the admitted basis, not from the user, and are inserted into option
 * text and attributes as they are, which is safe because the basis is a
 * caller-selected asset and never a document field.
 *
 * @param groups The channel groups that have a measurement rule.
 */
export function connectedBodyPanelMarkup(groups: readonly string[]): string {
  return `
<style>
*{box-sizing:border-box}body{margin:0;background:#161c23;color:#e4eaf0;font:13px/1.5 system-ui}main{display:grid;grid-template-columns:minmax(300px,1fr) 430px;height:100vh}section{position:relative;min-width:0}canvas{width:100%;height:100%;display:block}aside{overflow:auto;padding:20px;background:#10161d}h1{font-size:20px;margin:0}h2{font-size:14px;margin:20px 0 8px}p,small{color:#a9b7c8}button,input,select,textarea{font:inherit;color:inherit;background:#202b37;border:1px solid #405063;border-radius:4px}button{padding:5px 8px;cursor:pointer}button:disabled{opacity:.4}a{color:#a7d1f0}.toolbar{display:flex;gap:6px;flex-wrap:wrap;margin:10px 0}.views{position:absolute;top:10px;left:10px;right:10px}fieldset{border:0;padding:0;margin:0}.row{margin:12px 0}.row label{display:block}.row div{display:flex;gap:10px}.row small{display:block;font-size:11px}.row input[type=range]{flex:1;min-width:0}.row input[type=number]{width:85px;padding:3px}textarea{width:100%;height:230px;font:11px monospace;padding:8px}select{width:100%;padding:6px}#body-status{white-space:pre-wrap;background:#1c2834;padding:10px;border-radius:5px;margin:12px 0}#body-status[data-state=error]{background:#422127;color:#ffd2d2}@media(max-width:780px){main{grid-template-columns:1fr;height:auto}section{height:60vh}}
</style>
<main><section><canvas id="body-canvas"></canvas><div class="toolbar views"><button data-view="0">Front</button><button data-view="45">Left ¾</button><button data-view="-45">Right ¾</button><button data-view="90">Left</button><button data-view="-90">Right</button><button data-view="180">Back</button><button id="fit-view">Fit</button><label><input id="clay" type="checkbox"> Clay</label><label><input id="shadows" type="checkbox" checked> Shadows</label><label><input id="face" type="checkbox" checked> Head</label></div></section>
<aside><h1>Connected body editor</h1><p>Shape in millimetres and joints in clinical degrees on one connected skin</p><a href="connected-face.html">Open connected face editor</a><p><a href="connected-body-anatomical.html">Numerical request inspection</a></p><div id="body-status" role="status">Loading the numerical basis…</div>
<fieldset id="editing" disabled><div class="toolbar"><button id="body-undo">Undo</button><button id="body-redo">Redo</button><button id="body-reset">Reset</button></div><div class="toolbar"><button id="body-save">Save document</button><button id="body-load">Load document</button><button id="body-glb">Export GLB</button><button id="body-contacts">Check contacts</button><input id="body-file" type="file" accept=".json,application/json" hidden></div>
<h2>Simple body</h2><p>Identity-card values and tape measurements, read off the current body and expanded into the detailed channels; age sags and softens, muscle defines only where the body fat lets it.</p><div id="simple-controls"></div><h2>Internal shoulder measurements</h2><p>Optional measured articular-head radii, one per side. Blank uses an adult CT population estimate within its observed age and stature range. Check contacts reads each head around the rig's posed shoulder centre against the skin; this does not establish an individual's bone centre or complete humerus.</p><div id="humeral-head-controls"></div><h2>Pose presets</h2><div id="pose-presets" class="toolbar"></div><h2>Detailed measurements and pose</h2><select data-role="control-kind" aria-label="Control group">${groups.map((g) => `<option value="${g}">${"Measurement · " + g}</option>`).join("")}<option value="pose">Pose · joints</option></select><p>Enter a target in millimetres for a supported measurement; the current body is measured and solved in a worker. Joint angles remain clinical degrees.</p><div data-role="basis-controls"></div><details><summary>Complete document</summary><textarea id="document-json" aria-label="Complete document"></textarea><button id="document-apply">Apply document</button></details></fieldset></aside></main>`;
}
