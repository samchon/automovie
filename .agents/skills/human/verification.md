# Verification

## Inspection Round

Inspect all four people in the [viewer](screenshot.md) under the same camera, light, material, resolution and renderer:

1. View the whole body from every direction in the `surface`, `overlay` and `construction` passes.
2. View each region and join in close-ups with `material=clay` under both raking lights.
3. Trace every line or ripple to the curves that make it:
   - Click it in `overlay` to find its skin interval `human.skin.<chain>/<k>`.
   - Isolate sections `<chain>/<k>`, `<chain>/<k+1>` and `<chain>/axis` with `isolate=1&fit=selection`.
   - Read their curvature combs in a curve diagram.
4. Record each finding with its cause and PNG in the [survey](../../../packages/human/docs/survey.md).

## Render Audit

- Capture only after the generated output changes, and show only new frames.
- By default capture f1 whole front, side, top (`free` with `view=%2By`) and back with `garment=0`, plus construction front, side and back.
- Save each PNG's exact bytes under `packages/playground/.shots/<round>/`.
- Check each file's SHA-256 against its `x-human-png-sha256` header.
- Open every PNG.
- If a capture fails, stop modeling and repair the viewer and capture path first.
