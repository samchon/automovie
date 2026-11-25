# src/geometry/construction/AutoMovieLoftRelief.ts#AutoMovieLoftRelief.height

## @evidence contracts/development/implementation.md#principled-implementation

Evaluates the local uniform cubic tensor-product basis and station/phase chain-rule factors; a shift delegates to the full mapped jet. Valid positive spans, dimensions and zero boundary control rings are producer premises.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The first-order reader avoids second derivatives for unshifted reliefs and shares jet's mapped semantics when a shift exists.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Outside-window height is exactly zero; no sample difference or shape-specific displacement replaces the authored field.

## @evidence contracts/development/common.md#meaningful-documentation

Names chart units, the three returned orders and window behavior; the namespace identifies the zero-control-ring falloff premise.

## @evidence contracts/development/implementation.md#efficient-algorithms

Reads at most 16 controls for an unshifted field; shifted work is bounded by jet's two local field reads, independent of total net size.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

One pair of basis/first-derivative arrays supplies height and both partials; the shift branch reuses its single full-jet result.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Allocates fixed-size basis/result arrays for the call and returns a fresh triple; the relief/net is not retained.

# src/geometry/construction/AutoMovieLoftRelief.ts#AutoMovieLoftRelief.jet

## @evidence contracts/development/implementation.md#principled-implementation

Applies the written first/second-order chain rule to d(s+D(s,t),t), with both fields evaluated from the same local cubic basis and admitted relief layout.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One private field reader owns tensor-product partials while this function owns composition with the station map.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Derivatives come from basis polynomials and chain rule; absence of shift means the identity map, without fitting or finite-difference compensation.

## @evidence contracts/development/common.md#meaningful-documentation

Gives all six return orders and the full station-map derivative equations, including mixed and second-phase terms.

## @evidence contracts/development/implementation.md#efficient-algorithms

Evaluates one height field and at most one shift field, each reading 16 controls, with constant work/storage independent of net dimensions.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Each field visit accumulates every partial from its one support; the shift's six values serve all composition terms.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Local basis and six-number field arrays die with the call; only the fresh six-number mapped jet escapes.

# src/geometry/construction/AutoMovieLoftRelief.ts#AutoMovieLoftRelief.direction

## @evidence contracts/development/implementation.md#principled-implementation

The turning direction is a rotation in the plane of two fixed world vectors, so its phase derivatives are the rotation's own and its station derivatives vanish; a displaced point `p + h e` then differentiates by the product rule its callers apply.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One reader serves the point, phase-tangent and second-order jet callers, with the fixed axis as the case of no turn.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No difference of sampled directions; a fixed axis returns exact zeros.

## @evidence contracts/development/common.md#meaningful-documentation

States the law, its centre and all three returned orders.

## @evidence contracts/development/implementation.md#efficient-algorithms

One sine and one cosine per call, or none for a fixed axis.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure direction reading coordinates no shared work.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns fresh vectors and retains nothing.

# src/geometry/construction/AutoMovieLoftRelief.ts#AutoMovieLoftRelief.width

## @evidence contracts/development/implementation.md#principled-implementation

Reduces the endpoint difference modulo a turn and interprets zero remainder as the full periodic window.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One shared width calculation keeps wrapping semantics identical in the first/second-order field readers.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Equal or whole-turn-separated endpoints deliberately mean a full turn; nonfinite phase inputs are not independently admitted here.

## @evidence contracts/development/common.md#meaningful-documentation

States radians, positive finite-window range and the equal-endpoint interpretation.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant arithmetic reads two endpoints and allocates no collection.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

This scalar width calculation coordinates no cross-call field preparation.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns a number without retaining the relief or any handle.
