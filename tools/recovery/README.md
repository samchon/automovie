# Saved cubic reconstruction tools

These tools observe a fixed oriented triangle mesh, publish independent cubic curves and explicit continuation relationships, then generate a new engine mesh from that saved representation. The final consumer opens the saved curves and continuation graph. It does not read the original source mesh, copied source normals or source topology.

The observer input supplies mesh file paths and complete-byte hashes, millimetre units, registration frame, pose uncertainty and a fixed automatic section/fitting policy. Curve and continuation publications retain their input hashes. Set RUN_SOURCE_EPOCH to the generating source commit before invoking the CLI. Existing outputs are immutable.

Build from the repository with `pnpm run build` on Node 22.23.2 or later. NodeNext and generated package boundaries retain the tools' ESM and the numerical packages' declared module kinds. The recovery package emits ESM entrypoints under lib/tools/recovery/src. The following command arguments are the same declared operation sequence used by the frozen reconstruction run:

```sh
node tools/recovery/lib/tools/recovery/src/recovery.js extract input.json curves.json
node tools/recovery/lib/tools/recovery/src/recoveryOpen.js observe input.json curves.json continuation.json
node tools/recovery/lib/tools/recovery/src/recoveryLocal.js curves.json continuation.json model.json ruled
```

The historical `human-reference-engine-model-v1` artifact discriminator identifies the existing generic engine-model envelope; it does not select a Human generator. The returned document contains an existing interface model with mesh parts, generated engine normals and explicit processing/coverage diagnostics. The existing viewer mesh path consumes that model. Construction and physical vertex ownership are part of the original publication; a derived surface-only transport must declare omitted fields rather than claim full document identity.

The selected ruled mode uses two saved open courses and station C0 continuity. Open split/merge/cavity changes, mixed open/closed events, closed/ruled seam coupling and general physical C1/G1 joins remain unsupported. Processing complete means the declared work ended; it does not establish full source coverage, source embedding, watertightness or visual quality.

This is a dense saved-contour reconstruction baseline. It has not established a compact shared equation family, held-out identity recovery or independent measurement edits. More curves are observation density, not population generalization. Actual render inspection found major face and junction defects: horizontal facial bands, missing eye and mouth detail, raised neck/shoulder sheets and pelvic steps remain. Sampled closest-surface distances do not certify appearance, missing-region coverage, absence of additional surfaces or correct normals. The inspected models retain their original generating snapshot; packaging and owner relocation do not regenerate or improve them. This baseline does not complete the broader recovery requirements in issue #2873. No input meshes, subject curves, rendered assets or private benchmark results ship in this package.
