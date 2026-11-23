# src/construction/IAutoMovieConstructionAxis.ts#IAutoMovieConstructionAxis

## @evidence contracts/development/design.md#principled-representation

The kind preserves the authored plane contract: fixed straight/parallel directions, world-level planes, or tangent-normal curved/jointed transport. Minimal rotation uses the double reflection of Wang, Juttler, Zheng and Liu, ACM TOG 27(1), 2008.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Five records distinguish a fixed straight frame, level planes, authored parallel planes, a tangent-normal curved course and a jointed one.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No frame is fitted to a mesh; a curved course is its own knots, and the step bounds the integration rather than smoothing it.

## @evidence contracts/development/common.md#meaningful-documentation

States the plane's origin, axes and station direction and each kind's use.
