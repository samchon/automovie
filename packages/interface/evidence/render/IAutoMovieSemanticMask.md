# src/render/IAutoMovieSemanticMask.ts#IAutoMovieSemanticMask

## @evidence contracts/development/design.md#principled-representation

Semantic palette derives non-background RGB24 colors from stable ids, processes collision claims in code-unit id order with deterministic forward probing and seals the full entries and bounded-gap payload by digest.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Entries join semantic hierarchy to drawable node or slot identity while unaddressed records expose bounded per-slot gaps rather than silently losing the logical instance-set address.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Scene reordering preserves palette identity, but adding a genuinely colliding earlier id can shift an existing color; allocation is not universally insertion-invariant, and capacity overflow or duplicate semantic claims refuse.

## @evidence contracts/development/common.md#meaningful-documentation

Defines versioned palette, reserved black background, exact RGB representation, sorted entries, bounded slot gaps and complete canonical digest coverage.
