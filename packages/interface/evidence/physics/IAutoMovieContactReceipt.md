# src/physics/IAutoMovieContactReceipt.ts#IAutoMovieContactReceipt

## @evidence contracts/development/design.md#principled-representation

Source, interval and collider identities distinguish a geometric proximity measurement from solver impulse evidence; nullable impulse preserves the absence of solved dynamics.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Geometric contact queries and physical simulation publish one receipt consumed by motion audits and impact readers; samples preserve the timing and applied impulse each reader needs.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Positive geometric separation remains a gap, and a geometric receipt cannot claim a solved impulse; completed-step samples do not expose later simulation results.

## @evidence contracts/development/common.md#meaningful-documentation

Defines film time, world geometry, impulse units, source authority and the temporal limits of the optional solver history.
