# Verification

The unit tests and the score reject and the viewer accepts. Run them first because they are cheap, then inspect what survives, because numbers alone do not establish a sound human shape. Each candidate needs all of them: a reversed arc and a zero-length arc reached the viewer in one session because no number was read first, and each cost a render round to find.

## Unit Tests

Unit tests are how logic and mathematics get checked here, and the only way besides the score. Write one when a question comes up, run it alone, and read its list:

```bash
pnpm test --include human_curve_trunk
```

That command compiles the whole test project for about thirteen minutes before a test starts, however narrow the selection. While iterating, run the same test functions directly with the local `test/src/executable/human-score/runHumanTest.ts`, and use `pnpm test --include` before a commit.

A Human test audits every region before it fails, and its error lists all that it found by person, chain, layers and direction. Stopping at the first failure turns one cause into a run per symptom, so never assert one at a time. Fix the list by cause, then run it again.

One test per part (`trunk`, `arm`, `hand`, `leg`, `foot`) audits the generated curves on every person across the domain, by rules in `HumanCurveAudit`; run the part you changed, and `human_curve` for all of them: orientation, crossings, slopes, slide, overshoot, creases, curvature bands, ripples, open or kinked seams and mirrored sides. Their limits sit just above the fitted figure's worst values, whose skin read smooth.

The rules name no coordinate, and no test reads a private reference. `test_human_curve_placement` is a sanity bound instead: at set shares of the stature, each part must stand within a wide margin of the figure before generation, because a construction may lay its layers anywhere and still be compared at a height. Agreement is not asked for and a small error is not a goal; it fires only on the absurd.

When a defect reaches the viewer that no rule caught, add the rule that would have listed it. A clean run says the curves are not broken, not that the anatomy is right: that still takes the [inspection round](#inspection-round) in the viewer.

## Score

Keep one CPU-only executable beside the other reference tools under `test/src/executable/`. It reads private references, so it stays local and never runs in CI. It generates the figure without a GPU and reports:

| Measure | Reads | Meaning |
| --- | --- | --- |
| Table bytes deleted against source bytes added | the diff | Rejects a slice with a negative balance. |
| Validity across the parameter domain | every control at both ends of its declared range and combined extremes, declaring a range first where a control has none | Rejects non-finite values, collapsed or self-crossing sections, folds and open joins. |
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
