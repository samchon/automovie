---
name: human
description: Builds, inspects or supervises the parameterized Human figure and viewer.
---

# Human

Generate every supported person from one [construction tree](construction.md#tree). Derive each region's view curves from anatomical centres and axes. The engine realizes the tree as one skin while retaining region identities.

Follow the current issue's scope and order.

## Research

Before changing an operator, read the applicable skill, existing engine and interface capability, the Human package's record and the method's primary sources. Resolve conflicts at the governing rule or refer them to the user.

## Method

1. Derive [joint and course centres](curves.md#centres-before-curves) from measurements.
2. Build conic families from [view curves](curves.md#few-view-curves-per-segment).
3. Compose [shared boundaries](construction.md#connections) in 2D before lofting.
4. [Repair](construction.md#repair) defects at the curves that produce them.
5. [Verify](verification.md) shape beside its references.

## Three steps

Finish one reference before generalizing. Pass each step's [gates](verification.md#steps-one-and-two) before advancing.

1. Trace the reference in its recorded pose.
   - Cut exact planes at the loft stations and read extents and quarter shoulders.
   - Reduce to sparse knots within tolerance. Document corrections for mesh artifacts.
   - Loft the traced curves in world coordinates.
2. Rebase each part to its joint origin and landmark axes. Verify the exact pose round trip.
3. Derive shared laws that generate the curves from [inputs](construction.md#inputs).
   - Follow [parameter generation](curves.md#generate-from-parameters) and [numerical sources](construction.md#numbers).

Plan for section limits before lofting. Use a suitable frame for a level floor, place ports away from poles and connect branches at their shared boundary.

## Order

Work in [correction rounds](../visual-debugging/correction-rounds.md) over the whole figure:

1. Compile in the [shared watch](../development/validation.md#type-checking) and produce the step's originals.
2. Inspect [view curves](verification.md#curves-against-the-reference) and [shared connections](verification.md#shared-connections).
3. Sweep the whole person, close-ups and suspect pieces in one [inspection round](verification.md#inspection-round).
4. Record each finding, owner, measured cause and affected neighbours.
5. Fix every cause in one [construction](construction.md) batch with regression checks.
6. Confirm with [tests](testing.md) and the next round. Record the findings in the package.

Refit affected dependents to a verified correction. Revert a correction when measurements disprove it.

Finish the anatomical neutral and the bind before any other pose, because every motion starts from them.

## Polygon man

Keep the polygon man's rigid primitives, segment count and style for motion verification and diffusion hints. Correct wrong dimensions or frames. Refer a change needing more geometry, anatomy or style to the user.

## Done when

- Every public parameter changes the figure through the one construction, answered at its published site.
- One construction yields finite, connected and anatomically valid skin across parameters and supported poses.
- Generation returns a figure for every valid person with an empty diagnostics list.

## Files

| Read | To |
| --- | --- |
| [Construction](construction.md) | Build a tree, join parts or repair a region |
| [Original 2D curves](curves.md) | Draw curves or derive them from parameters |
| [Verification](verification.md) | Compare shapes or decide a step's acceptance |
| [Testing](testing.md) | Write or run Human tests |
| [Screenshots](screenshot.md) | Select subjects, views and passes |
| [Supervision](supervision.md) | Brief or audit Human workers |
| [Workspace](workspace.md) | Use references and ignored output paths |
