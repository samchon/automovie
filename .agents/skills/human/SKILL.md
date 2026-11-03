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

## Order

1. Build the [score](verification.md#score) and pass the [tests](testing.md) before rendering, because a render is expensive and often returns nothing.
2. Measure the data and choose the construction yourself, under the [construction rules](construction.md).
3. Change one part at a time, all of its pieces and seams together, and leave the whole figure working.
4. Inspect the change in the [viewer](verification.md#inspection-round), whole person and close-ups.
5. Record what the change taught in the Human package's documentation.

Plan only as far as the next change. When a change disproves a construction, choose another construction.

Conquer the anatomical neutral and the bind before any other pose: every motion starts from them, so a defect left at neutral returns in every pose.

## Files

- [Construction](construction.md): what a construction contains and how it consumes inputs.
- [Testing](testing.md): which tests to write, how to write and run them.
- [Verification](verification.md): the score, the inspection round and the render audit.
- [Screenshot](screenshot.md): the viewer, its capture route and the reference photographs.
- [Workspace](workspace.md): references and ignored paths.

Tell the user only what you checked.
