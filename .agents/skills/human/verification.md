# Verification

The score rejects and the viewer accepts. Run the score first because it is cheap, then inspect what survives, because numbers alone do not establish a sound human shape. Each candidate needs both.

## Score

Keep one CPU-only executable beside the other reference tools under `test/src/executable/`. It reads private references, so it stays local and never runs in CI. It generates the figure without a GPU and reports:

| Measure | Reads | Meaning |
| --- | --- | --- |
| Table bytes deleted against source bytes added | the diff | Rejects a slice with a negative balance. |
| Validity across the parameter domain | every control at both ends of its range and combined extremes | Rejects non-finite values, collapsed or self-crossing sections, folds and open joins. |
| Requested against generated dimensions | public measurement definitions | Rejects a parameter with no or the wrong response. |
| Held-out surface distance per part | the reference meshes | Rejects a law that does not generalize. |

For the held-out distance, build the law without one person, generate that person from public parameters alone and measure along the reference surface normal, reporting RMS and the 95th percentile. Print the stature-only distance beside it: a law that does not beat that baseline explains nothing. Held-out rows of one person measure nothing, because neighbouring rows of a mesh predict each other almost exactly.

## Inspection

Inspect a candidate's generating curves, skin and joins in the [viewer](screenshot.md) as soon as the score admits it, following [Visual Debugging](../3d-modeling/visual-debugging.md). Compare it with the existing figure under the same conditions in every affected region and join, including changed inputs. Keep partial work visible and mark what is unverified.

## Inspection Round

Inspect the affected person and all affected parts under matching camera, light, material, resolution and renderer conditions, expanding to other people when the task requires it.

1. View the assembled figure from every direction in the `surface`, `overlay` and `construction` passes, checking normal human proportions, silhouettes and missing or disconnected anatomy.
2. View each region and join in close-ups with `material=clay` under both raking lights, checking C2 at shared keys, G2 across strips, and trims against the observed shape.
3. Trace every line or ripple to the curves that make it:
   - Click it in `overlay` to find its skin interval `human.skin.<chain>/<k>`.
   - Isolate sections `<chain>/<k>`, `<chain>/<k+1>` and `<chain>/axis` with `isolate=1&fit=selection`.
   - Read their curvature combs in a curve diagram.
4. Record each finding that outlives the round, with its cause, in [Generalization](../../../packages/human/docs/generalization.md) before the round's combined correction.

## Render Audit

- Capture only after the generated output changes, and show only new frames.
- By default capture the current person's whole front, side, top (`free` with `view=%2By`) and back with `garment=0`, plus construction front, side and back; include the developing parts and their actual generating curves.
- Save each PNG's exact bytes under `packages/playground/.shots/<round>/`.
- Check each file's SHA-256 against its `x-human-png-sha256` header.
- Open every PNG.
- If a capture fails, stop visual claims that depend on it and repair the viewer and capture path first.
