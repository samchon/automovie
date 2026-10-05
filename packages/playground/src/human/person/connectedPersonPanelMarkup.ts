/**
 * The person editor's static markup: one canvas, one status line, one
 * history toolbar and file actions for the whole person, then a body section
 * and a face section. Each section carries its own `basis-controls`,
 * `control-kind` and help elements, so the reused body and face control
 * owners render into their own container.
 *
 * @author Samchon
 */
export function connectedPersonPanelMarkup(groups: readonly string[]): string {
  return `
<style>
*{box-sizing:border-box}body{margin:0;background:#161c23;color:#e4eaf0;font:13px/1.5 system-ui}main{display:grid;grid-template-columns:minmax(300px,1fr) 450px;height:100vh}section{position:relative;min-width:0}canvas{width:100%;height:100%;display:block}aside{overflow:auto;padding:20px;background:#10161d}h1{font-size:20px;margin:0}h2{font-size:14px;margin:20px 0 8px}p,small{color:#a9b7c8}button,input,select,textarea{font:inherit;color:inherit;background:#202b37;border:1px solid #405063;border-radius:4px}button{padding:5px 8px;cursor:pointer}button:disabled{opacity:.4}a{color:#a7d1f0}.toolbar{display:flex;gap:6px;flex-wrap:wrap;margin:10px 0}.views{position:absolute;top:10px;left:10px;right:10px}fieldset{border:0;padding:0;margin:0}.row{margin:12px 0}.row label{display:block}.row div{display:flex;gap:10px}.row small{display:block;font-size:11px}.row input[type=range]{flex:1;min-width:0}.row input[type=number]{width:85px;padding:3px}textarea{width:100%;height:230px;font:11px monospace;padding:8px}select{width:100%;padding:6px}#person-status{white-space:pre-wrap;background:#1c2834;padding:10px;border-radius:5px;margin:12px 0}#person-status[data-state=error]{background:#422127;color:#ffd2d2}@media(max-width:780px){main{grid-template-columns:1fr;height:auto}section{height:60vh}}
</style>
<main><section><canvas id="person-canvas"></canvas><div class="toolbar views"><button data-view="0">Front</button><button data-view="45">Left ¾</button><button data-view="-45">Right ¾</button><button data-view="90">Left</button><button data-view="-90">Right</button><button data-view="180">Back</button><button id="fit-view">Fit</button><label><input id="clay" type="checkbox"> Clay</label><label><input id="shadows" type="checkbox" checked> Shadows</label></div></section>
<aside><h1>Connected person editor</h1><p>One person on one connected skin: the face owns the head, the body owns the rest, and one document records both.</p><p><a href="connected-body.html">Body editor</a> · <a href="connected-face.html">Face editor</a></p><div id="person-status" role="status">Loading the person generation…</div>
<fieldset id="editing" disabled><div class="toolbar"><button id="person-undo">Undo</button><button id="person-redo">Redo</button><button id="person-reset">Reset</button></div><div class="toolbar"><button id="person-save">Save document</button><button id="person-load">Load document</button><button id="person-glb">Export GLB</button><input id="person-file" type="file" accept=".json,application/json" hidden></div>
<div id="body-section"><h2>Body</h2><p>Age, sex, weight and muscle are the body's macros and shape the head too. Measurements in millimetres, joints in clinical degrees.</p><h2>Pose presets</h2><div id="pose-presets" class="toolbar"></div><select id="control-kind" aria-label="Body control group">${groups.map((g) => `<option value="${g}">${"Measurement · " + g}</option>`).join("")}<option value="pose">Pose · joints</option></select><div id="basis-controls"></div></div>
<div id="face-section"><h2>Face</h2><h2>Expression presets</h2><div id="expression-presets" class="toolbar"></div><select id="control-kind" aria-label="Face control group"><option value="shape">Face shape</option><option value="expression">Expression</option></select><p id="control-help"></p><div id="basis-controls"></div></div>
<details><summary>Complete document</summary><textarea id="document-json" aria-label="Complete person document"></textarea><button id="document-apply">Apply document</button></details></fieldset></aside></main>`;
}
