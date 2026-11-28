# src/geometry/IAutoMovieMeasureContourFace64.ts#IAutoMovieMeasureContourFace64.IResult

## @evidence contracts/development/common.md#meaningful-documentation

Each field is double area, computed in its named coordinate frame. Independent rounding can change the results.

## @evidence contracts/development/design.md#principled-representation

The helper computes the cross magnitude in millimetres and repeats after converting each vertex to metres. A finite-leg witness produced infinite mm² and finite m². The generator's current positive-only gate does not explicitly reject an infinite measure.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The helper returns arithmetic observations and leaves the retention decision to the emitter.

# src/geometry/IAutoMovieMeasureContourFace64.ts#IAutoMovieMeasureContourFace64.IResult.millimetresSquared

## @evidence contracts/development/common.md#meaningful-documentation

The source-frame cross magnitude gives double area for millimetre endpoints. Zero or nonfinite arithmetic stays observable.

# src/geometry/IAutoMovieMeasureContourFace64.ts#IAutoMovieMeasureContourFace64.IResult.metresSquared

## @evidence contracts/development/common.md#meaningful-documentation

The output-frame measure derives after converting positions to metres before subtracting or taking the cross.
