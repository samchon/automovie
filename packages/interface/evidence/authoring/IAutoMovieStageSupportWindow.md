# src/authoring/IAutoMovieStageSupportWindow.ts#IAutoMovieStageSupportWindow

## @evidence contracts/development/common.md#meaningful-documentation

Defines shot-local seconds, reference domain, overlap ordering, crossing use and explicit suspension.

## @evidence contracts/development/design.md#principled-representation

One timestamp delimits an interval on the shot clock. Stage admission checks strictly increasing starts and distinct walkable references. A point query compares actual heights in world metres.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Identifies existing surfaces without copying their geometry or defining a separate floor model. The next window's start, or the shot end, determines length.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Empty surfaces means explicit static suspension, while a nonempty scope with no covering surface has no support. Neither substitutes the legacy global ground query.
