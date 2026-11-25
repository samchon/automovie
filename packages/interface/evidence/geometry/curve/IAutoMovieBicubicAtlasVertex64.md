# src/geometry/curve/IAutoMovieBicubicAtlasVertex64.ts#IAutoMovieBicubicAtlasVertex64.ICursor

## @evidence contracts/development/design.md#principled-representation

nextIndex is a nonnegative safe global render index initialized from vertexOffset; allocation checks that the increment remains safe.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The atlas emitter shares one mutable cursor with every patch vertex closure to preserve append-only indexing across chunks.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Reusing a shared vertex does not increment the cursor or allocate another render receipt.

## @evidence contracts/development/common.md#meaningful-documentation

Defines index scope, initialization, mutation and safe-integer admission.

# src/geometry/curve/IAutoMovieBicubicAtlasVertex64.ts#IAutoMovieBicubicAtlasVertex64.IJet

## @evidence contracts/development/design.md#principled-representation

Position uses model millimetres; the dimensionless normal is normalized du cross dv and regular reports only a finite positive cross-product norm.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The vertex owner calls this callback to obtain first-owner analytic normals independently from canonical shared positions.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A false regular flag publishes a zero normal, without fabricating a tangent plane or claiming geometric regularity elsewhere.

## @evidence contracts/development/common.md#meaningful-documentation

Defines ordinal/parameter inputs, output units, retained plans and error propagation.
