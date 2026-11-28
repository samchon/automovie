# src/geometry/IAutoMovieSweepSurface.ts#IAutoMovieSweepSurface

## @evidence contracts/development/common.md#meaningful-documentation

The declaration defines normalized chord-length U, section turns, both correspondence modes, metres and the query ownership. It documents retained authored input, coordinate clamping and the finite-difference endpoint convention.

## @evidence contracts/development/design.md#principled-representation

The Engine compiles the source sweep and retains its path and coefficient functions. Scalar and vector queries share the same frame and section owner. The compiler checks the source and the generated section functions enforce loop and representability conditions where they evaluate.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The compiled surface makes reusable query state available to the rig, sampling and construction consumers. It exposes source, path, step and loop count alongside the numerically distinct methods.

# src/geometry/IAutoMovieSweepSurface.ts#IAutoMovieSweepSurface.IFeaturePoint

## @evidence contracts/development/common.md#meaningful-documentation

The record identifies the possibly overshooting spine coordinate and the unwrapped section turn in which feature continuity is preserved.

## @evidence contracts/development/design.md#principled-representation

The feature compiler unwraps consecutive authored angles, builds a centripetal spline over its knot span and evaluates the two coordinates for the requested share. The compiled surface returns that domain point after selecting the feature by index.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The result conveys the two chart coordinates used by construction and sweep consumers. The retained spline and its authored control samples remain in the feature implementation.

# src/geometry/IAutoMovieSweepSurface.ts#IAutoMovieSweepSurface.sweep

## @evidence contracts/development/common.md#meaningful-documentation

Documents the borrowed authored declaration returned by the compiler alongside its retained data.

# src/geometry/IAutoMovieSweepSurface.ts#IAutoMovieSweepSurface.path

## @evidence contracts/development/common.md#meaningful-documentation

Documents the compiled spine and its chord-length coordinate and metre scale.

# src/geometry/IAutoMovieSweepSurface.ts#IAutoMovieSweepSurface.step

## @evidence contracts/development/common.md#meaningful-documentation

Documents the finite-difference step used for section and spine derivatives. The compiled surface returns the same step used by its methods.

# src/geometry/IAutoMovieSweepSurface.ts#IAutoMovieSweepSurface.loops

## @evidence contracts/development/common.md#meaningful-documentation

Documents the loop count. Compilation returns one for directional correspondence or the compiled loop count for parameter correspondence.

# src/geometry/IAutoMovieSweepSurface.ts#IAutoMovieSweepSurface.feature

## @evidence contracts/development/common.md#meaningful-documentation

Documents the declaration index, clamped knot-span share, domain result and missing-index failure. The compiler looks up and evaluates the selected feature spline.

# src/geometry/IAutoMovieSweepSurface.ts#IAutoMovieSweepSurface.shape

## @evidence contracts/development/common.md#meaningful-documentation

Documents the unscaled section result and loop selection. The evaluator defaults to the outer loop and checks that the selected loop exists.

# src/geometry/IAutoMovieSweepSurface.ts#IAutoMovieSweepSurface.section

## @evidence contracts/development/common.md#meaningful-documentation

Documents scaled section positions in metres and their overflow or underflow conditions. The evaluator scales the unscaled shape before returning its plane coordinates.

# src/geometry/IAutoMovieSweepSurface.ts#IAutoMovieSweepSurface.radius

## @evidence contracts/development/common.md#meaningful-documentation

Documents the scalar outer-loop distance and distinguishes the two correspondence modes. The evaluator applies the positive scale to the unscaled profile and checks the numeric result.

# src/geometry/IAutoMovieSweepSurface.ts#IAutoMovieSweepSurface.profile

## @evidence contracts/development/common.md#meaningful-documentation

Documents the metre-valued radius before sweep scale. The parameter path uses the Euclidean norm of the loop point and allows a point at the origin.

# src/geometry/IAutoMovieSweepSurface.ts#IAutoMovieSweepSurface.scale

## @evidence contracts/development/common.md#meaningful-documentation

Documents the positive scale factor and default of one supplied by the compiled scale evaluator.

# src/geometry/IAutoMovieSweepSurface.ts#IAutoMovieSweepSurface.frame

## @evidence contracts/development/common.md#meaningful-documentation

Documents the section frame and its station orientation. The evaluator returns fresh vectors from the compiled orientation buffer.

# src/geometry/IAutoMovieSweepSurface.ts#IAutoMovieSweepSurface.point

## @evidence contracts/development/common.md#meaningful-documentation

Documents the model-metre position and optional loop index. The evaluator combines the section coordinates with the frame basis and origin.

# src/geometry/IAutoMovieSweepSurface.ts#IAutoMovieSweepSurface.normal

## @evidence contracts/development/common.md#meaningful-documentation

Documents the crossing order and orientation of the unit normal. The evaluator crosses the around-loop difference with the spine derivative and normalizes it.

# src/geometry/IAutoMovieSweepSurface.ts#IAutoMovieSweepSurface.along

## @evidence contracts/development/common.md#meaningful-documentation

Documents model metres per normalized U and the endpoint rule. The evaluator divides its point difference by the actual clipped span.

# src/geometry/IAutoMovieSweepSurface.ts#IAutoMovieSweepSurface.IFeaturePoint.u

## @evidence contracts/development/common.md#meaningful-documentation

Documents the feature's fitted spine coordinate, which can extend beyond authored knot values.

# src/geometry/IAutoMovieSweepSurface.ts#IAutoMovieSweepSurface.IFeaturePoint.v

## @evidence contracts/development/common.md#meaningful-documentation

Documents the unwrapped section turns retained across adjacent fitted feature points.
