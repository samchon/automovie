# src/validation/IAutoMovieAffordanceArticulation.ts#IAutoMovieAffordanceArticulation

## @evidence contracts/development/common.md#meaningful-documentation

Admission result for resolving an authored articulation input to its independent coordinate. Nested contracts define the relevant units, ownership and failure states.

## @evidence contracts/development/design.md#principled-representation

The Input union distinguishes usable independent travel from a failed coordinate and its reason.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Articulation input admission serves archetype posing and motion coordinate lookup.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Failure context is not a partial successful coordinate or permission to drive a follower.

# src/validation/IAutoMovieAffordanceArticulation.ts#IAutoMovieAffordanceArticulation.Input

## @evidence contracts/development/common.md#meaningful-documentation

Distinguishes independent success from the first failed coordinate, its units and optional upstream context.

## @evidence contracts/development/design.md#principled-representation

The success discriminant separates usable coordinates from reference/range/follower/inverse failures; travel always uses the named joint's unit.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Archetype posing and motion coordinate lookup consume the same result of the engine's chain admission, without an exception class crossing the boundary.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No request is clamped and no duplicate independent input is selected here; optional leader is diagnostic context only after a coupling has resolved.
