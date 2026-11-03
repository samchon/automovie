---
name: human
description: Generates every Human person from one reusable construction from anatomical centres, frames and dimensions, proven by tests that cross-check the generated skin against anatomy and its inputs, a CPU score and the viewer. Use with 3d-modeling for Human geometry, the Human viewer or its renders.
---

# Human

Generate every supported person from parameters by one reusable construction. Find the major anatomical centres, draw lofting curves from them, and construct each following layer up to the next centre by any anatomically and scientifically sound equation, recurrence or recursion.

The tasks and their order live in the issue tracker. An explicit stop overrides every instruction here.

Human debugging UI and capture tooling belong in `packages/human/debug`, a development companion inside the Human package with its own `tsconfig.debug.json` and `vite.config.ts`; the published library has no browser build and no viewer export. Playground owns the ordinary parameter editor, and the generic viewer supplies rendering without Human-specific features. Keep those boundaries so development diagnostics do not become runtime dependencies.

## Done When

- Every public parameter changes the figure through that construction, answered at its published site.
- Every supported person comes from that one construction with no person selector, and finite, connected, normal anatomy holds across the supported parameter domain, at rest and in every supported pose.
- Generation returns a figure for every valid person: a piece that cannot keep its contract is left out and records one diagnostic, and an empty diagnostics list is part of done.

## Order

Find every phenomenon and every cause, hidden ones included, before changing anything, fix them all in one batch, and give each fixed defect a test that fails if it returns; every fix and test is universal, orthodox and scientific, never a patch at the symptom, a special case or a hard-coded value or expectation, because a defect in a seam cannot be fixed from inside one piece and fixing one symptom at a time never ends. Work in cycles over the whole figure:

1. Inspect: open every image the figure needs in the [viewer](verification.md#inspection-round), the whole person, the close-ups and the curve views of every suspect piece, and read each one.
2. Analyse: write one table of every phenomenon with its root cause, the hidden causes of the same class elsewhere, and the pieces, seams and files it touches.
3. Fix every row in one batch under the [construction rules](construction.md), after reviewing the diff against them, and leave the whole figure generating.
4. Verify: pass the [tests](testing.md) and the [score](verification.md#score), then start the next cycle with every image opened again.
5. Record what the cycle taught in the Human package's documentation.

Measure the data and choose the construction yourself. When a cycle disproves a construction, choose another construction.

Conquer the anatomical neutral and the bind before any other pose: every motion starts from them, so a defect left at neutral returns in every pose.

## Files

- [Construction](construction.md): what a construction contains and how it consumes inputs.
- [Testing](testing.md): which tests to write, how to write and run them.
- [Verification](verification.md): the score, the inspection round and the render audit.
- [Screenshot](screenshot.md): the viewer, its capture route and the reference photographs.
- [Workspace](workspace.md): references and ignored paths.

Tell the user only what you checked.
