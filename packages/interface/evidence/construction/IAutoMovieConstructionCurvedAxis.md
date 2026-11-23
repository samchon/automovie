# src/construction/IAutoMovieConstructionCurvedAxis.ts#IAutoMovieConstructionCurvedAxis

## @evidence contracts/development/design.md#principled-representation

Minimal rotation by double reflection (Wang, Juttler, Zheng and Liu, ACM TOG 27(1), 2008), fourth order in its step, gives the section axes without twist about the course.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The course's knots, the first axis and the step are all the frame needs; the second axis follows from the first and the tangent.

## @evidence contracts/development/design.md#prohibited-design-shortcuts `u`'s part along the tangent is removed, `u` otherwise kept as given; beyond its end knots the course continues as its straight end tangent.

## @evidence contracts/development/common.md#meaningful-documentation

States the course's interpolant, the planes, the carried axes, the extension past the knots and the admission rules.
