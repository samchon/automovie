# Saved cubic reconstruction tools

These tools observe a fixed oriented triangle mesh, publish independent cubic curves and explicit continuation relationships, then generate a new engine mesh from that saved representation. The final consumer opens the saved curves and continuation graph. It does not read the original source mesh, copied source normals or source topology.

The observer input supplies mesh file paths and complete-byte hashes, millimetre units, registration frame, pose uncertainty and a fixed automatic section/fitting policy. Curve and continuation publications retain their input hashes. Set RUN_SOURCE_EPOCH to the generating source commit before invoking the CLI. Existing outputs are immutable.

Use Node 22.23.2 or later. These private workspace tools are not a distributable recovery package. Their default TypeScript configuration checks source without emitting a CLI; `pnpm run build` alone does not create the following entrypoints. For an explicit local CLI build, retain NodeNext, rewrite relative TypeScript extensions and restore the relocated numerical packages' declared module kinds:

```sh
pnpm exec ttsc -p tools/recovery/tsconfig.json --noEmit false --rootDir . --outDir tools/recovery/lib --rewriteRelativeImportExtensions
node --experimental-strip-types tools/recovery/src/writeRecoveryModuleBoundaries.ts . tools/recovery/lib
```

Set `RUN_SOURCE_EPOCH` to the complete generating commit hash. The saved-curve operation sequence is:

```sh
node tools/recovery/lib/tools/recovery/src/recovery.js extract input.json curves.json
node tools/recovery/lib/tools/recovery/src/recoveryOpen.js observe input.json curves.json continuation.json
node tools/recovery/lib/tools/recovery/src/recoveryLocal.js curves.json continuation.json model.json ruled
```

`recoveryLocal` also accepts `quadratic`, a `final-only` or `final-only-gzip` publication mode and an optional analytic publication after that mode. An analytic publication binds the exact curve and continuation byte hashes, replaces explicitly named coefficient authorities once and preserves retained courses outside its declared ownership. Gzip mode requires a new `model.json`, reverse-verifies the archive and reports compressed and logical byte identities separately.

The public `bicubic-atlas` geometry carries model-metre Bernstein controls, explicit chart and boundary identities, approximation limits and cell budgets. The engine generates metre geometry through `realizeAutoMovieBicubicAtlas64`; CPU geometry consumers and the viewer use that same owner. `recoveryAtlas` separates source observation from source-free recipe compilation. The event, field-complex, chart fitting and transport helpers have bounded synthetic regression coverage; the complete experimental upstream producer chain has not been promoted into this maintained tool. This snapshot does not reproduce every experimental whole-object result from an original mesh.

The historical `human-reference-engine-model-v1` artifact discriminator remains for saved-document compatibility; it does not load a retired research tool or select a Human generator. Generic mesh cuts, cutting frames, scalar critical events and orientation witnesses belong to the recovery tool’s `src/internal/mesh-observations` module and consume only registered positions, faces and canonical connectivity. The returned document contains an existing interface model with mesh parts, generated engine normals and explicit processing/coverage diagnostics. The existing viewer mesh path consumes that model. Construction and physical vertex ownership are part of the original publication; a derived surface-only transport must declare omitted fields rather than claim full document identity.

The selected ruled mode uses two saved open courses and station C0 continuity. Open split/merge/cavity changes, mixed open/closed events, closed/ruled seam coupling and general physical C1/G1 joins remain unsupported. Processing complete means the declared work ended; it does not establish full source coverage, source embedding, watertightness or visual quality.

This is a dense saved-contour reconstruction baseline. It has not established a compact shared equation family, held-out identity recovery or independent measurement edits. More curves are observation density, not population generalization. Actual render inspection found major face and junction defects: horizontal facial bands, missing eye and mouth detail, raised neck/shoulder sheets and pelvic steps remain. Sampled closest-surface distances do not certify appearance, missing-region coverage, absence of additional surfaces or correct normals. The inspected models retain their original generating snapshot; packaging and owner relocation do not regenerate or improve them. This baseline does not complete the broader recovery requirements in issue #2873. No input meshes, subject curves, rendered assets or private benchmark results ship in this package.
