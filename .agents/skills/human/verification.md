# Verification

Each part owner follows [Visual Debugging](../3d-modeling/visual-debugging.md) throughout development, inspecting its real generated curves and skin in the [viewer](screenshot.md) from the first usable preview through assembly. Do not defer observation until every part or person is complete. Mark missing parts and unverified properties honestly while keeping partial work visible.

## Inspection Round

Inspect the affected person and all affected parts under matching camera, light, material, resolution and renderer conditions, expanding to other people when the task requires it.

1. View the assembled figure from every direction in the `surface`, `overlay` and `construction` passes, checking normal human proportions, silhouettes and missing or disconnected anatomy.
2. View each region and join in close-ups with `material=clay` under both raking lights, checking C2 at shared keys, G2 across strips, and trims against the observed shape.
3. Trace every line or ripple to the curves that make it:
   - Click it in `overlay` to find its skin interval `human.skin.<chain>/<k>`.
   - Isolate sections `<chain>/<k>`, `<chain>/<k+1>` and `<chain>/axis` with `isolate=1&fit=selection`.
   - Read their curvature combs in a curve diagram.
4. Record every finding with its cause, contributing factors and PNG in the [survey](../../../packages/human/docs/survey.md) before the round's combined correction. Numerical continuity alone does not establish a sound human shape.

## Render Audit

- Capture only after the generated output changes, and show only new frames.
- By default capture the current person's whole front, side, top (`free` with `view=%2By`) and back with `garment=0`, plus construction front, side and back; include the developing parts and their actual generating curves.
- Save each PNG's exact bytes under `packages/playground/.shots/<round>/`.
- Check each file's SHA-256 against its `x-human-png-sha256` header.
- Open every PNG.
- If a capture fails, stop modeling and repair the viewer and capture path first.
