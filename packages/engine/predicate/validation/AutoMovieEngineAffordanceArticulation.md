# src/validation/AutoMovieEngineAffordanceArticulation.ts#AutoMovieEngineAffordanceArticulation.surfaceCarrier

## @evidence contracts/development/common.md#meaningful-documentation

The declaration describes the model-local surface, the optional explicit material part, the default sole driven part and the undefined result when no valid carrier resolves.

## @evidence contracts/development/implementation.md#principled-implementation

Resolve one articulation by the surface's declared ride identifier. Accept an explicit material part only if that articulation drives it. Without an explicit choice, require exactly one driven part. The matched model part must have no bone attachment, skin deformation or morph targets. Engine admission and render preparation both use this same part decision.

## @evidence contracts/development/implementation.md#efficient-algorithms

The lookup reads the supplied affordances and model parts once each and checks only the selected joint's driven identifiers. It returns the original part record and retains no state.
