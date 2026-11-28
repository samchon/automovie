# src/geometry/IAutoMovieEvaluateImplicitProjection64.ts#IAutoMovieEvaluateImplicitProjection64.IProps.field

## @evidence contracts/development/common.md#meaningful-documentation

The callback defines a millimetre point query and the derivative data it returns. It states exception propagation and bounded extra diagnostic samples.

# src/geometry/IAutoMovieEvaluateImplicitProjection64.ts#IAutoMovieEvaluateImplicitProjection64.IFieldJet

## @evidence contracts/development/common.md#meaningful-documentation

The record describes the scalar unit, gradient per millimetre and Hessian per square millimetre with a caller-owned dimension requirement.

## @evidence contracts/development/design.md#principled-representation

Continuation reads the value for level error, the gradient for directional Newton steps, and the Hessian for an optional second-order chain rule.

## @evidence contracts/development/design.md#minimal-and-owned-surface

One result is one local field evaluation. The caller owns the field and continuation supplies query positions and target levels.

# src/geometry/IAutoMovieEvaluateImplicitProjection64.ts#IAutoMovieEvaluateImplicitProjection64.IFieldJet.value

## @evidence contracts/development/common.md#meaningful-documentation

The scalar uses the target level's own field unit.

# src/geometry/IAutoMovieEvaluateImplicitProjection64.ts#IAutoMovieEvaluateImplicitProjection64.IFieldJet.gradient

## @evidence contracts/development/common.md#meaningful-documentation

The gradient carries Cartesian field derivatives per millimetre in the seed frame.

# src/geometry/IAutoMovieEvaluateImplicitProjection64.ts#IAutoMovieEvaluateImplicitProjection64.IFieldJet.hessian

## @evidence contracts/development/common.md#meaningful-documentation

The Hessian carries Cartesian second derivatives in field units per square millimetre. The caller supplies all three rows when the chain rule needs them.
