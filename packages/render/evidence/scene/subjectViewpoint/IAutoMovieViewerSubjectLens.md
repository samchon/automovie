# src/index.ts#IAutoMovieViewerSubjectLens

## @evidence contracts/development/design.md#principled-representation

The narrower derived horizontal/vertical half-angle controls sphere framing; finite fov in (0,180) and positive finite aspect are caller premises.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Keeps optical inputs beside the pose and delegates camera realization and bounds framing to their owners.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The interface enforces no numeric range; current framing rejects ordinary range violations but nonfinite admission remains incomplete.

## @evidence contracts/development/common.md#meaningful-documentation

Documents angle/aspect units and the narrower-field framing rule.
