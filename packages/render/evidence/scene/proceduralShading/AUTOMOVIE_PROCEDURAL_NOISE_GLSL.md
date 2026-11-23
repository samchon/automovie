# src/scene/proceduralShading/AUTOMOVIE_PROCEDURAL_NOISE_GLSL.ts#AUTOMOVIE_PROCEDURAL_NOISE_GLSL

## @evidence contracts/development/design.md#principled-representation

GLSL ES 3.00 source of the lattice hash, gradient noise, fractal sum and cellular distances, mirroring the engine functions of the same names with exact `uint` hashing.

## @evidence contracts/development/design.md#minimal-and-owned-surface

`applyProceduralSurface` splices it, and the wear patch of #4083 reads the same fractal sum; an include guard lets both splice it into one program.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No function names a kind or a scene; kinds are composed per material by `proceduralPatternGlsl`.

## @evidence contracts/development/common.md#meaningful-documentation

States which engine function each GLSL function mirrors, where results can differ (32-bit float rounding only) and why the guard exists.
