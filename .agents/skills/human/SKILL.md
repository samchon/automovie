---
name: human
description: Builds the Human person by tracing the reference, re-basing each part and deriving parameter rules. Use with 3d-modeling for Human geometry, the Human viewer or its renders.
---

# Human

The goal is one reusable construction that generates every supported person from parameters. It finds the major anatomical centres and axes and draws the regions' front, side and top view curves from them by sound laws. It composes compatible original 2D definitions into shared generating domains before lofting, with [shared boundaries](construction.md#connections) for the remaining connections. The [construction tree](construction.md#tree) keeps logical anatomical identities independently of its surface decomposition, and the engine realizes it into the skin.

The tasks and their order live in the issue tracker. An explicit stop overrides every instruction here.

Human browser debugging UI and HTTP capture clients belong in `packages/human/debug`. Direct Node image and measurement entries belong in `packages/human/src/executable`, use the Human package's `tsconfig.json` and run through its `node:*` scripts with `ttsx --no-plugins --noCheck`. Shared pure source and display adapters belong in `src/inspection`; keep Node file access and native Canvas imports in executable modules so browser and ordinary Human consumers need neither. Playground owns the ordinary parameter editor, and the generic viewer supplies rendering without Human-specific features.

## Polygon Man

The polygon man in `packages/viewer/src/human-polygon` is a deliberately simple stand-in of a few rigid primitives on Human's skeleton, for motion verification and diffusion hints. Keep its primitives, segment count and style: a fix corrects a wrong value, such as a radius, a length or a frame, and a change that would need more geometry, segments, smoothing, anatomy, a face or realism goes to the user as a report instead. Its value is a cheap, readable and deterministic silhouette; realism costs render time and pulls the hint toward surface detail the diffusion model supplies.

## Three Steps

Conquer one person before generalizing. Follow the owner's authorized campaign order and pass the previous step's [gates](verification.md#steps-one-and-two) before advancing, because a formula fitted to an unmatched shape generalizes the error.

1. **Trace.** Extract the reference's representative 2D lines from its own mesh in its own pose. Take exact plane cuts at the stations the loft uses, read their extents and quarter shoulders, and reduce them to sparse knots within tolerance. Correct only the knots that follow a reference artifact, such as hatching, holes or saw-toothed slices; find each one in the viewer and name it in a comment. Conic-loft those lines as they are, in absolute world coordinates. Conic lofting includes turned section planes along a course where a level section cannot hold the shape, and separate lofts for branches: a parent ends at its last single-loop section, and its children start at the saddle between them. No law, drawn row or fairing replaces a traced value.
2. **Re-base.** Rewrite each part's traced coordinates about its own origin at its joint, with axes from its own landmarks, and turn its angles to the part's own neutral orientation. Reassemble the body by chaining the parts' relative frames, so the round trip back to the reference pose is exact.
3. **Generalize.** Search the universal algorithm and formulas that produce the re-based coordinates from parameters, by reverse analysis of those coordinates. This step follows [Generate From Parameters](curves.md#generate-from-parameters), [Numbers](construction.md#numbers) and [Inputs](construction.md#inputs).

Know the construction method's classical limits before a step begins, and plan their standard remedies. Level sections cannot hold a horizontal floor, a pole cannot host ports, and a branch needs a split. A limit discovered only through a refusal costs a fix-and-revert cycle.

## Done When

- Every public parameter changes the figure through that construction, answered at its published site.
- Every supported person comes from that one construction with no person selector, and finite, connected, normal anatomy holds across the supported parameter domain, at rest and in every supported pose.
- Generation returns a figure for every valid person with an empty diagnostics list.

## Order

Within each step, work in [correction rounds](../visual-debugging/correction-rounds.md) over the whole figure, using the [part-by-part transition](verification.md#curves-against-the-reference) from accepted 2D definitions to 3D inspection while gathering the round:

1. Build: keep changed code compiling in its [watch](../development/validation.md#type-checking), produce the step's originals, and execute the [selected producer](verification.md#curves-against-the-reference).
2. Curves: inspect every part's [view curves over the reference](verification.md#curves-against-the-reference) and its [shared connections](verification.md#shared-connections), under [review](verification.md#review).
3. Surfaces: sweep the whole person, its close-ups and every suspect piece once in the [inspection round](verification.md#inspection-round).
4. Analyse: write one table of every phenomenon with its root cause, the hidden causes of the same class elsewhere, and the pieces, seams and files it touches.
5. Fix every row in one batch under the [construction rules](construction.md), after reviewing the diff against them, and give each fixed defect a test that fails if it returns.
6. Confirm with the [tests](testing.md), and record what the round taught in the Human package's documentation.

Use the inspection and repair order in [AGENTS.md](../../../AGENTS.md).

When a construction resists, do not force it. Research how the problem is solved elsewhere, generate alternatives, compare them on the frames and the numbers, and move to the better one; a round that only retries the same idea is lost.

In step 3, derive every fix and every expectation from the person's inputs, published or derived laws, geometry, or normalized tables aggregated over the whole reference set, because a special case or an unsourced number fits one symptom and breaks the population.

Finish the anatomical neutral and the bind before any other pose: every motion starts from them, so a defect left at neutral returns in every pose.

## Files

- [Construction](construction.md): the construction tree, its parts and how they consume inputs.
- [Original 2D Curves](curves.md): anatomical sketch scaffolds, visible controls, representation choices and exact parameter-aware conversions.
- [Testing](testing.md): which tests to write, how to write and run them.
- [Verification](verification.md): the reference overlay, the step gates, review and the inspection round.
- [Screenshot](screenshot.md): the viewer, selection recipes, [inspection packets](screenshot.md#inspection-packets) and reference sources.
- [Workspace](workspace.md): references and ignored paths.

Tell the user only what you checked.
