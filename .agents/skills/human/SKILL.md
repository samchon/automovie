---
name: human
description: Generates every Human person from anatomical view curves composed into shared source domains and realized by the engine, judged in the viewer against the reference overlay and confirmed by tests that cross-check the generated skin against anatomy and its inputs. Use with 3d-modeling for Human geometry, the Human viewer or its renders.
---

# Human

Generate every supported person from parameters by one reusable construction. Find the major anatomical centres and axes, and draw the regions' front, side and top view curves from them by anatomically and scientifically sound equations, recurrences or recursions. Compose compatible original 2D definitions into shared generating domains before lofting, with [shared boundaries](construction.md#connections) for the remaining connections. The [construction tree](construction.md#tree) keeps logical anatomical identities independently of its surface decomposition, and the engine realizes it into the skin.

The tasks and their order live in the issue tracker. An explicit stop overrides every instruction here.

Human browser debugging UI and HTTP capture clients belong in `packages/human/debug`. Direct Node image and measurement entries belong in `packages/human/src/executable`, use the Human package's `tsconfig.json` and run through its `node:*` scripts with `ttsx --no-plugins --noCheck`. Shared pure source and display adapters belong in `src/inspection`; keep Node file access and native Canvas imports in executable modules so browser and ordinary Human consumers need neither. Playground owns the ordinary parameter editor, and the generic viewer supplies rendering without Human-specific features.

## Done When

- Every public parameter changes the figure through that construction, answered at its published site.
- Every supported person comes from that one construction with no person selector, and finite, connected, normal anatomy holds across the supported parameter domain, at rest and in every supported pose.
- Generation returns a figure for every valid person with an empty diagnostics list.

## Order

Work in [correction rounds](../3d-modeling/visual-debugging.md#correction-rounds) over the whole figure, using the [part-by-part transition](verification.md#curves-against-the-reference) from accepted 2D definitions to 3D inspection while gathering the round:

1. Build: keep changed code compiling in its [watch](../development/validation.md#type-checking), generate originals [directly from parameters and shared definitions](curves.md#generate-from-parameters), and execute the [selected producer](verification.md#curves-against-the-reference).
2. Curves: inspect every part's [view curves over the reference](verification.md#curves-against-the-reference) and its [shared connections](verification.md#shared-connections), with [independent review and campaign supervision](verification.md#review-and-supervision).
3. Surfaces: sweep the whole person, its close-ups and every suspect piece once in the [inspection round](verification.md#inspection-round).
4. Analyse: write one table of every phenomenon with its root cause, the hidden causes of the same class elsewhere, and the pieces, seams and files it touches.
5. Fix every row in one batch under the [construction rules](construction.md), after reviewing the diff against them, and give each fixed defect a test that fails if it returns.
6. Confirm with the [tests](testing.md), and record what the round taught in the Human package's documentation.

Use the inspection and repair order in [AGENTS.md](../../../AGENTS.md).

When a construction resists, do not force it: research how the problem is solved elsewhere, generate alternatives, compare them on the frames and the numbers, and move to the better one; a round that only retries the same idea is lost.

Derive every fix and every expectation from the person's inputs, published or derived laws, geometry, or normalized tables aggregated over the whole reference set, because a special case or an unsourced number fits one symptom and breaks the population. Measure the data and choose the construction yourself; when a round disproves a construction, choose another.

Finish the anatomical neutral and the bind before any other pose: every motion starts from them, so a defect left at neutral returns in every pose.

## Files

- [Construction](construction.md): the construction tree, its parts and how they consume inputs.
- [Original 2D Curves](curves.md): anatomical sketch scaffolds, visible controls, representation choices and exact parameter-aware conversions.
- [Testing](testing.md): which tests to write, how to write and run them.
- [Verification](verification.md): the reference overlay, the inspection round and the render audit.
- [Screenshot](screenshot.md): the viewer, selection recipes, [inspection packets](screenshot.md#inspection-packets) and reference sources.
- [Workspace](workspace.md): references and ignored paths.

Tell the user only what you checked.
