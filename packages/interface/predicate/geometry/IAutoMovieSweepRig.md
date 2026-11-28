# src/geometry/IAutoMovieSweepRig.ts#IAutoMovieSweepRig

## @evidence contracts/development/common.md#meaningful-documentation

Live compiled sweep used by cage readers through frame, scale and probe slots.

## @evidence contracts/development/design.md#principled-representation

Registration caches rest shapes and assigns stable slots. Seal initializes rest buffers, and pose refreshes them from the current bones and girth state.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The rig owns compiled slots and live packed arrays. Callers register the addresses they need before sealing.

# src/geometry/IAutoMovieSweepRig.ts#IAutoMovieSweepRig.surface

## @evidence contracts/development/common.md#meaningful-documentation

Compiled rest sweep whose unscaled section shape supplies all pose samples.

# src/geometry/IAutoMovieSweepRig.ts#IAutoMovieSweepRig.frame

## @evidence contracts/development/common.md#meaningful-documentation

Register a normalized spine coordinate and return its deduplicated section-frame ordinal.

# src/geometry/IAutoMovieSweepRig.ts#IAutoMovieSweepRig.scale

## @evidence contracts/development/common.md#meaningful-documentation

Register a normalized spine coordinate and return its deduplicated scale ordinal.

# src/geometry/IAutoMovieSweepRig.ts#IAutoMovieSweepRig.probe

## @evidence contracts/development/common.md#meaningful-documentation

Register a unit normal and spine derivative using four finite-difference point writers with one shared footprint.

# src/geometry/IAutoMovieSweepRig.ts#IAutoMovieSweepRig.sample

## @evidence contracts/development/common.md#meaningful-documentation

Register a surface point or fixed-cell average and return a writer for three model-metre coordinates.

# src/geometry/IAutoMovieSweepRig.ts#IAutoMovieSweepRig.seal

## @evidence contracts/development/common.md#meaningful-documentation

Complete registration, size the live arrays and initialize their rest values.

# src/geometry/IAutoMovieSweepRig.ts#IAutoMovieSweepRig.girth

## @evidence contracts/development/common.md#meaningful-documentation

Replace the radial correction profile after sealing. Factors, resulting scales and dependent probes must pass admission before the rig publishes the new state.

# src/geometry/IAutoMovieSweepRig.ts#IAutoMovieSweepRig.frames

## @evidence contracts/development/common.md#meaningful-documentation

Current packed frame data with twelve scalars per slot, in origin, first-axis, second-axis and normal order.

# src/geometry/IAutoMovieSweepRig.ts#IAutoMovieSweepRig.scales

## @evidence contracts/development/common.md#meaningful-documentation

Current positive dimensionless scales, one per registered slot.

# src/geometry/IAutoMovieSweepRig.ts#IAutoMovieSweepRig.probes

## @evidence contracts/development/common.md#meaningful-documentation

Six scalars per probe, first unit normal XYZ and then the derivative along the normalized spine parameter.

# src/geometry/IAutoMovieSweepRig.ts#IAutoMovieSweepRig.pose

## @evidence contracts/development/common.md#meaningful-documentation

Refresh geometric slots from the current pose buffer, or use the rest sweep when passed null.
