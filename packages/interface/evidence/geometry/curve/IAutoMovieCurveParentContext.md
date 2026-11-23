# src/geometry/curve/IAutoMovieCurveParentContext.ts#IAutoMovieCurveParentContext

## @evidence contracts/development/design.md#principled-representation

Each local row-basis is admitted within 64 epsilons, requires positive determinant, and composes through column-major parent matrices. Binding checks both serialized context revision and exact published object identity.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The constructor resolves all frames and clones all edges before revision serialization; frame/matrix maps own placement while edge/publication maps own routing and token authenticity.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Reflections, absent parents, nonfinite transforms and copied/stale operator tokens are refused; no pose fitting or anatomy-specific placement is inserted.

## @evidence contracts/development/common.md#meaningful-documentation

Documents parent-first inputs, millimetre charts, throw-before-use construction failure, copied frame snapshots, immutable shared fields and same-instance publication binding.
