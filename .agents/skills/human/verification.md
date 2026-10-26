# Verification

Run a complete inspection round after each implementation pass of the [work order](SKILL.md#work-order), including in solo work. Inspect the assembled result before claiming visual acceptance. Report unavailable checks as unverified.

## Actual Generated Form

- Apply the [essential viewer rule](SKILL.md#human). Isolate heavy/failure-prone models in request/child execution; preserve the host and return explicit diagnostics. A model failure starts viewer recovery, not permission to skip inspection.
- Bind source, emitted JS/maps, actual loaded imports, inputs, skin/construction and PNG bytes.
- Trace actual API/root consumption; unused code, empty requests and successful fits do not prove changed geometry.
- Separate acquisition, source-conditioned reproduction, common fit, integration, visual acceptance and prediction.

A stale ownership record for an already dead service never authorizes killing a live process. Use the single [web service](screenshot.md#human-url-catalog), not another viewer.

## Inspection Round

The round follows [Visual Debugging](../3d-modeling/visual-debugging.md#correction-rounds), uses every viewer feature on all four people under the same camera, light, material, resolution and renderer backend, and edits nothing:

1. Inspect the whole body from every direction, top, back and obliques included, in the surface, overlay and construction passes.
2. Inspect each region, join and defect with free cameras and isolation, close-ups framed from outside the model, in `material=clay` under both raking lights and in colour.
3. Trace every line, ripple, shelf or crease to its curves under [Lines And Ripples](#lines-and-ripples-on-the-skin), reading curve diagrams and station series across module boundaries.
4. Show unattached regions separately as generated, integrated or not renderable; state missing anatomical close-ups.
5. Write each finding to the [survey](../../../packages/human/docs/survey.md)'s open-defect table with its traced cause, latent effects and the PNG that shows it.

The round closes when every finding has a cause or is stated as untraced; the [work order](SKILL.md#work-order) then fixes them together, and new or unexplained defects in the next round keep the work open.

Source-only overlays and bounds-relative tiles do not establish independent skin or dedicated close-ups. If no broad-form progress appears, reconsider correspondence and representation rather than increasing precision, layers or wrappers.

Qualify source-domain admission, boundary fitting, interior regularity, embedding, runtime integration and visual acceptance separately. A sampled or partial numerical round proves only its stated coverage. An off-live candidate is not a rendered improvement; preserve rejected candidates as counterexamples without reusing their passing subchecks as whole-surface acceptance.

## Lines And Ripples On The Skin

In the inspection round, trace each crease, stripe or ripple to the curves that generate it with the [screenshot service](screenshot.md#curve-selection):

1. Click the line in `overlay` or read the `human.skin.<chain>/<k>` interval under it; that interval is shaped by sections `<chain>/<k>` and `<chain>/<k+1>` and by `<chain>/axis`.
2. Isolate those curves with `isolate=1&fit=selection` and view them along their own axis with `ortho=1` (`view=+y` for horizontal sections, `el=0` for an axis profile) to see the true shape the skin is lofted from.
3. Read the curvature combs of the bounding sections and their neighbours in one [2D diagram](screenshot.md#curve-diagrams), for example `curves=<chain>/<k-1>&curves=<chain>/<k>&curves=<chain>/<k+1>`. Alternating spikes are ringing (Gibbs oscillation near pinches and contacts); a comb that changes sign where the skin creases locates the cause in that section.
4. Compare the layers above and below with a station series, `<chain>@<from>:<to>:<step>`, to tell a defect of one principal section from one of the Hermite interpolation between sections.

Record the cause with the finding and keep the PNGs that showed it with the round's evidence.

## Audit And User Reports

During authorized active modeling, deliver these reports directly to the user, including in solo work and when progress is unchanged. When verification is delegated, inspect its evidence and retain responsibility for the user report; internal agent replies do not replace it. The [explicit stop](SKILL.md#human) suspends captures and automatic resumption.

- Audit and report every 15 minutes, including solo work. Check the next deadline before starting a bounded computation; schedule capture ahead of work that could cross it.
- Use the subjects, directions, display conditions and delivery format the user requests. By default, capture f1 only: fresh whole front, side, top and back with `garment=0`, plus whole-body front, side and back construction. Keep PNGs local and open all seven. Specimen implementation still requires its own affected-population verification.
- Extra details and cache hits do not replace the required whole-body set.
- An audit reports state. A defect it shows joins the next inspection round's findings and starts no edit.
- Check regional image inspection, actual code consumption, uncovered regions and violations; follow [Work Allocation](SKILL.md#work-allocation) for audit delegation.
- Preserve/open/display exact local PNGs under [Screenshot reporting](screenshot.md#user-facing-image-reports), with captured UTC, SHA and code/input/output binding.
- Distinguish capture, local-save and report times. Report defects, unsupported scope and remaining comparisons.
- A scheduled audit is complete only after every required fresh PNG is saved, its provenance checked and the local image opened. If any capture fails, suspend all modeling and shared computation, collect the failure evidence, repair the viewer/capture path and finish the entire audit before resuming. Failure notes and unavailable labels do not replace the images.
- On delay, report cause/current recovery/last actual capture immediately and continue recovery until the audit is complete. Never reset the cadence to excuse a missed audit, skip a direction or present cached pixels as a new capture.

## Separate Qualifications

- Check independent input changes, interactions and restoration only within the user's authorized experiment scope; deferred experiments stay unperformed.
- Reproduction does not establish unseen-shape prediction.
- Human and Human-viewer tests must not be written, restored or run, including renamed/relocated substitutes.
