# src/construction/IAutoMovieConstructionAngleParameter.ts#IAutoMovieConstructionAngleParameter

## @evidence contracts/development/common.md#meaningful-documentation

Names the coordinate frame, clock, reference and nondegenerate axis premises.

## @evidence contracts/development/design.md#principled-representation

ConstructionViews converts the centre to kernel millimetres and preserves the direction values. SolidTraceLaw normalizes the normal and its projected reference, then derives angle with atan2 in that basis.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The description reuses world vectors for location and directions. The trace owner builds its actual tangent frame and angle law.

# src/construction/IAutoMovieConstructionAngleParameter.ts#IAutoMovieConstructionAngleParameter.type

## @evidence contracts/development/common.md#meaningful-documentation

The literal identifies the angular trace variant.

# src/construction/IAutoMovieConstructionAngleParameter.ts#IAutoMovieConstructionAngleParameter.centre

## @evidence contracts/development/common.md#meaningful-documentation

The comment distinguishes the length-valued origin from its direction inputs.

# src/construction/IAutoMovieConstructionAngleParameter.ts#IAutoMovieConstructionAngleParameter.normal

## @evidence contracts/development/common.md#meaningful-documentation

The comment identifies the direction units and source normalization.

# src/construction/IAutoMovieConstructionAngleParameter.ts#IAutoMovieConstructionAngleParameter.reference

## @evidence contracts/development/common.md#meaningful-documentation

The comment explains how the trace establishes its zero-angle axis.
