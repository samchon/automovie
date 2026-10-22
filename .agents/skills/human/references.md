# References

Use the existing [reference-experiments program](../../../test/src/executable/reference-experiments/README.md) under [reference supply](https://github.com/samchon/automovie/issues/2926) for the [Human campaign](https://github.com/samchon/automovie/issues/2925). Acquisition is separate from independent Human generation.

Honor [explicit stops](SKILL.md#human); documenting an acquisition or resume command does not authorize overriding them.

## Reference Addresses

- Canonical outputs are `test/.shots/f1/`, `f2/`, `m1/` and `m2/`; `test/.shots/manifest.json` selects their exact artifacts.
- Permanent request inputs retain original identities under `test/reference-inputs/natural4/{jang-nara,emma-watson,won-bin,daniel-radcliffe}/`, corresponding to f1, f2, m1 and m2.
- `test/reference-inputs/alias-relocation.json` resolves historical output addresses without changing model, curve, image or receipt bytes.
- Preserve all normal completed artifacts; alias relocation is not new acquisition. Keep scratch files outside `test/.shots`.

The retained cohort's address-validation command is:

```powershell
node --experimental-strip-types test/src/executable/reference-experiments/registerReferencePerson.mts test/reference-inputs/natural4/alias-supply-plan.json --plan
```

`--plan` has passed read-only validation; it does not run native acquisition, Recovery or capture. Omit it only for an authorized supply/resume run by the [execution owner](SKILL.md#work-allocation). The original `supply-plan.json` retains historical addresses and must not be substituted for this alias plan.

## Original And Recovery Photographs

| Image | Selected index | PNG location |
| --- | --- | --- |
| Original reference model | `test/.shots/{id}/captures.json` | `test/.shots/{id}/screenshots-corrected/{whole-front,whole-back}.png` |
| Recovery ruled reverse render | The subject's `ruledCapture.path` in `test/.shots/manifest.json` | `test/.shots/{id}/recovery-diagnostics/<recovery-key>/direct-render/<render-key>/screenshots-corrected/{whole-front,whole-back}.png` |

1. Select the `subjects[]` entry whose `id` is f1, f2, m1 or m2; use its exact `ruledCapture.path`, never an arbitrary glob match.
2. Resolve each index's `screenshotDirectory` relative to that index's parent, then append the exact `frames[].name`, including `.png`.
3. Verify PNG bytes against that frame's `sha256`; bind the selected index and its manifest receipt.
4. Resolve historical absolute addresses through `alias-relocation.json`; preserve the original index and receipt bytes.

For f1, the original front is `test/.shots/f1/screenshots-corrected/whole-front.png`. Its Recovery front comes from the manifest-selected diagnostic index, not the original `captures.json`; read that index's directory and `whole-front.png` frame rather than hardcoding diagnostic keys.

## Extract And Save

- Use saved Recovery/Hermite curves and coefficients as primary geometric constraints for axes, sections, guides and shared boundaries.
- Use matching original-model photographs as the appearance comparison; ruled reverse renders visualize reconstruction and can contain artifacts.
- Validate Hermite data rather than assuming it is exact; preserve raw observations and disclose conflicts, uncertainty and support limits.
- Bind original model, native application/readback, registered frame, saved members and photographs by their receipts.
- Inventory sections, guides, obliques, features, open curves, branches, continuation, selection, publication and overrides; retain omissions and failures.
- Save through `curveFormat: "hermite"` and [Mesh Recovery](../3d-modeling/recovery.md).
- Preserve degree, rational information, original h, direction, units, frames and relationships. Endpoints/first jets determine a cubic, not arbitrary higher-degree or rational geometry.
- Keep unsupported conversions explicit; distinguish any fitted approximation from the original.
- Apply full chain rules: circumferential h is not height difference; ring tangent is not an interlayer derivative.

`legacy-contour-v1` identifies saved observation/reconstruction policy and its partial coverage. `recoveryLocal`'s `ruled` option connects corresponding saved curves; it is not an `AutoMovieRecoveryOperator`, new coefficient authority or proof of unknown branch recovery.

The official observation program may read the original mesh; independent product generation must not use its mesh or normals as a fallback.

## Reverse Render Defects

The user has reported comb-like striping and some cracks in retained `legacy-contour-v1` + `recoveryLocal` `ruled` reverse renders; their causes remain unverified.

- Distinguish original-model photographs, saved curves and regenerated surfaces; never copy reverse-render defects as anatomical targets.
- Compare them under matching conditions and trace defects to observation, correspondence, generation or display.
- Check direction, seam phase, correspondence, topology coverage, derivatives, tessellation and normals as hypotheses, not established causes.
- Distinguish anatomical openings from cracks; retain unresolved branches without invented pairing, caps or smoothing that conceals missing constraints.
- Collect all defects and latent effects, then correct shared causes and reinspect the affected population under [Verification](verification.md#inspection-round).
- Use valid observations immediately; these artifacts do not invalidate the whole dataset or justify acquisition restarts or implementation delays.

## Add Or Resume A Reference

Needed additional references are authorized without repeated permission requests. Use existing adequate observations immediately rather than waiting for acquisition.

1. Prepare an immutable new id, input directory, `appearance.json`, `pose.json`, `reference.json`, `analysis.md`, approved private host and supply plan outside `test/.shots`.
2. Set the subject's `parameterProfile` to the [Playground typed source](screenshot.md#parameters-and-aliases), its complete local JSON or JSON URL. Relative file paths resolve from the plan; a TS file must export its basename. For a plan at `test/reference-inputs/new-f1/plan.json`, the source field is:

```json
{ "parameterProfile": "../../../packages/playground/src/human-parameters/f1.ts" }
```

3. The execution owner runs the [existing entry](../../../test/src/executable/reference-experiments/README.md#add-or-resume-people) with Node 22.23.2 or later; this example requires the prepared new plan, not the retained cohort's resume plan:

```powershell
node --experimental-strip-types test/src/executable/reference-experiments/registerReferencePerson.mts test/reference-inputs/new-f1/plan.json
```

4. Verify native application/readback, original full photograph plan, Hermite/named publication, ruled captures and selected completion receipt. Repeat the identical command to resume only missing stages.

- Host prerequisites: installed editor/project/bridge/preset, successful native build evidence and `editor.nativeDiagnostics.bodyGlobalDeltaScale: 0`.
- Registration snapshots the complete input in `human-parameters.json` with `human-parameters-source.json` provenance, and creates native `parameters.json`/`head.json`; existing immutable files are checked, never overwritten.
- Only body/head enter the native converter. Other Human fields remain in the snapshot without a native-application claim; companion appearance/pose files remain explicit inputs.
- All 28 body controls are required. Non-null independent body measurements or diagnostics are unsupported and rejected; do not clear observed values silently to force acceptance.
- Typed-source plan-only admission has been checked for all four examples. HTTP retrieval, new native acquisition and downstream Recovery/rendering require their own execution evidence.
- Verify requested/native/final delta 0; a lone parameter JSON or submitted plan is not completed supply.
- Preserve registered inputs, completed outputs and partial failures. Changed bound inputs/hosts require a new id; never force overwrite.
- Use no substitute acquisition engine or hand-built outputs. Additional samples do not replace the four audit subjects.

## Interpretation And Output

- Keep source geometry and person-specific conditions outside product generation.
- Use source-conditioned reconstruction to verify representation, then identify common laws separately.
- Compare matching scale, posture, frame and feature definitions; label measured/derived/fitted/uncertain quantities.
- Distinguish supply, partial recovery, numeric fit and visual acceptance.
- Public material calls the source a reference model without naming its generating service.
