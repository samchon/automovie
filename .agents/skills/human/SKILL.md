---
name: human
description: Generates every Human person from one reusable construction from anatomical centres, frames and dimensions, judged in the viewer against the reference overlay and confirmed by tests that cross-check the generated skin against anatomy and its inputs. Use with 3d-modeling for Human geometry, the Human viewer or its renders.
---

# Human

Generate every supported person from parameters by one reusable construction. Find the major anatomical centres, draw lofting curves from them, and construct each following layer up to the next centre by any anatomically and scientifically sound equation, recurrence or recursion.

The tasks and their order live in the issue tracker. An explicit stop overrides every instruction here.

Human debugging UI and capture tooling belong in `packages/human/debug`, which the published library does not ship. Playground owns the ordinary parameter editor, and the generic viewer supplies rendering without Human-specific features. Keep those boundaries so development diagnostics do not become runtime dependencies.

## Done When

- Every public parameter changes the figure through that construction, answered at its published site.
- Every supported person comes from that one construction with no person selector, and finite, connected, normal anatomy holds across the supported parameter domain, at rest and in every supported pose.
- Generation returns a figure for every valid person with an empty diagnostics list.

## Order

Work in [correction rounds](../3d-modeling/visual-debugging.md#correction-rounds) over the whole figure, each in this order:

1. Build: the code type-checks clean in its [watch](../development/validation.md#type-checking) and the figure generates.
2. Curves: judge every part's [view curves over the reference](verification.md#curves-against-the-reference).
3. Surfaces: sweep the whole person, its close-ups and every suspect piece once in the [inspection round](verification.md#inspection-round).
4. Analyse: write one table of every phenomenon with its root cause, the hidden causes of the same class elsewhere, and the pieces, seams and files it touches.
5. Fix every row in one batch under the [construction rules](construction.md), after reviewing the diff against them, and give each fixed defect a test that fails if it returns.
6. Confirm with the [tests](testing.md), and record what the round taught in the Human package's documentation.

Derive every fix and every expectation from the person's inputs, a published source, geometry, or a law derived from them, because a special case or an unsourced number fits one symptom and breaks the population. Measure the data and choose the construction yourself; when a round disproves a construction, choose another.

Finish the anatomical neutral and the bind before any other pose: every motion starts from them, so a defect left at neutral returns in every pose.

## Files

- [Construction](construction.md): what a construction contains and how it consumes inputs.
- [Testing](testing.md): which tests to write, how to write and run them.
- [Verification](verification.md): the reference overlay, the inspection round and the render audit.
- [Screenshot](screenshot.md): the viewer, its routes and the reference sources.
- [Workspace](workspace.md): references and ignored paths.

Tell the user only what you checked.
