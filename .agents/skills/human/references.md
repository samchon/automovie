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

## Extract And Save

- Bind original model, native application/readback, registered frame, saved members and photographs by their receipts.
- Inventory sections, guides, obliques, features, open curves, branches, continuation, selection, publication and overrides; retain omissions and failures.
- Save through `curveFormat: "hermite"` and [Mesh Recovery](../3d-modeling/recovery.md).
- Preserve degree, rational information, original h, direction, units, frames and relationships. Endpoints/first jets determine a cubic, not arbitrary higher-degree or rational geometry.
- Keep unsupported conversions explicit; distinguish any fitted approximation from the original.
- Apply full chain rules: circumferential h is not height difference; ring tangent is not an interlayer derivative.

`legacy-contour-v1` identifies saved observation/reconstruction policy and its partial coverage. `recoveryLocal`'s `ruled` option connects corresponding saved curves; it is not an `AutoMovieRecoveryOperator`, new coefficient authority or proof of unknown branch recovery.

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
