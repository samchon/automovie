---
name: human
description: Builds the Human person as conic-lofted families joined by the engine's operators, verifies it against the reference by renders and tests, and governs supervised Human work. Use with 3d-modeling for Human geometry, with visual-debugging when inspecting the figure, and whenever workers build Human under a supervisor.
---

# Human

The goal is one reusable construction that generates every supported person from parameters. It finds the major anatomical centres and axes and draws each region's view curves from them by sound laws. Its [construction tree](construction.md#tree) keeps logical anatomical identities independently of its surface decomposition, and the engine realizes the tree into one skin.

The tasks and their order live in the issue tracker. An explicit stop overrides every instruction here.

## The skills are binding

This skill and the skills it links are the owner's method. Follow them as written. When one blocks the work, report the conflict with its quote, then amend the skill before acting differently. A rule one worker bends is a rule no other worker can rely on, and a method agreed only in conversation is lost at the next session.

Before each decision, reread the section that governs it. Research means reading these yourself:

- the skill text;
- the engine and interface code at the operator in question, starting from the capabilities it already has;
- the Human package's record of what was tried;
- the method's literature.

A measurement order, or another value of a parameter, is not research.

## Method

1. **Families.** Every part is a conic family: a few view curves (outline pairs, axis, fullness) and one inflection line for each groove along it. [Lofting](../3d-modeling/crafting/lofting.md#one-section-family) owns the section model and its one limit, star-shape about the course.
2. **Connections.** Parts meet only through the operator their topology selects in [Connections](construction.md#connections). The joint is composed in 2D before either side is lofted.
3. **Repair.** A defect is fixed at the curve that makes it, in the order [Repair](construction.md#repair) gives.
4. **Seeing.** Nothing is true until it is seen. Every shape claim rests on renders opened beside the reference, as [Verification](verification.md) requires.

## Three Steps

Conquer one person before generalizing. Pass each step's [gates](verification.md#steps-one-and-two) before the next, because a formula fitted to an unmatched shape generalizes the error.

1. **Trace.**
   - Extract the reference's representative 2D lines from its own mesh in its own pose. Take exact plane cuts at the stations the loft uses, read their extents and quarter shoulders, and reduce them to sparse knots within tolerance.
   - Correct only the knots that follow a reference artifact, such as hatching, holes or saw-toothed slices. Name each one in a comment.
   - Conic-loft those lines in absolute world coordinates.
2. **Re-base.** Rewrite each part's traced coordinates about its own origin at its joint, with axes from its own landmarks. Chain the parts' relative frames so the round trip back to the reference pose is exact.
3. **Generalize.** Derive, by reverse analysis of the re-based coordinates, the universal laws that produce them from parameters, under [Generate From Parameters](curves.md#generate-from-parameters), [Numbers](construction.md#numbers) and [Inputs](construction.md#inputs).

Know the method's classical limits before a step begins and plan their standard remedies: a level section cannot hold a horizontal floor, a pole cannot host ports, and a branch needs its connection. A limit discovered through a refusal costs a fix-and-revert cycle.

## Order

Work in [correction rounds](../visual-debugging/correction-rounds.md) over the whole figure:

1. **Build.** Keep changed code compiling in its [watch](../development/validation.md#type-checking), produce the step's originals and run the selected producer.
2. **Curves.** Inspect every part's [view curves over the reference](verification.md#curves-against-the-reference) and its [shared connections](verification.md#shared-connections).
3. **Surfaces.** Sweep the whole person, its close-ups and every suspect piece in one [inspection round](verification.md#inspection-round).
4. **Analyse.** Write one table: every phenomenon with its owner, its measured cause, and the same cause elsewhere.
5. **Fix.** Fix every row in one batch under [Construction](construction.md), giving each fixed defect a test that fails if it returns.
6. **Confirm.** Confirm with the [tests](testing.md) and the next round, and record what the round taught in the Human package's documentation.

A change that follows a skill rule stays when it breaks something fitted to the old state; refit that dependent on the new state. Revert only when a measurement shows the change itself is wrong, because a revert made to quiet a dependent restores the defect the change removed.

In step 3, derive every fix and expectation from the person's inputs, published laws, geometry or normalized population tables. A special case or an unsourced number fits one symptom and breaks the population.

Finish the anatomical neutral and the bind before any other pose, because every motion starts from them.

## Polygon Man

The polygon man that `render` draws is a deliberately simple stand-in of a few rigid primitives on Human's skeleton, for motion verification and diffusion hints. Keep its primitives, segment count and style. A fix corrects a wrong value, such as a radius, a length or a frame. A change that would need more geometry, segments, smoothing, anatomy, a face or realism goes to the user as a report instead, because the stand-in's value is a cheap, readable and deterministic silhouette.

## Done When

- Every public parameter changes the figure through the one construction, answered at its published site.
- Every supported person comes from that construction with no person selector, and finite, connected, normal anatomy holds across the parameter domain, at rest and in every supported pose.
- Generation returns a figure for every valid person with an empty diagnostics list.

## Files

- [Construction](construction.md): the tree, the connection operators, the repair order, identity and binding, form, numbers and inputs.
- [Original 2D Curves](curves.md): sketches, view curves, representation choices and generation from parameters.
- [Verification](verification.md): seeing before believing, the reference overlay, the step gates, the inspection round and verdicts.
- [Testing](testing.md): which tests to write, how to write and run them.
- [Screenshots](screenshot.md): the shared instrument's selections and passes for the Human figure.
- [Supervision](supervision.md): briefs and the supervision cycle when workers build Human.
- [Workspace](workspace.md): references and ignored paths.

Tell the user only what you checked.
