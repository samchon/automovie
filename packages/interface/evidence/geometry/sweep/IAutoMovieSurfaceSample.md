# src/geometry/sweep/IAutoMovieSurfaceSample.ts#IAutoMovieSurfaceSample

## @evidence contracts/development/design.md#principled-representation

Identity and dimensionless domain coordinates select a model-metre writer; the registry resolves shared sample spacing before writing, while bridge callers require compatible sweep/curve metadata.

## @evidence contracts/development/design.md#minimal-and-owned-surface

rigAutoMovieSurfaceNetwork and patch planning produce these records for registerAutoMovieSurfaceVertices and rigAutoMovieSurfaceBridge; point metadata controls sampling while primitive metadata controls bridge directions.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Points are welded by key. Nullable sweep and curve metadata are not a discriminated union: producers must supply the primitive a bridge needs; a curve endpoint can also have a non-null sweep-domain point.

## @evidence contracts/development/common.md#meaningful-documentation

Specifies quantized identity, delayed writer creation, output frame, borrowed rigs, correspondence-dependent v and unconstrained spacing resolution.
