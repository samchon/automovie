# src/cinematics/IAutoMovieCompilePerformShotCameras.ts#IAutoMovieCompilePerformShotCameras

## @evidence contracts/development/design.md#principled-representation

IProps joins final motion on one shot clock with staged cameras and geometry; validation belongs to performShot and its delegated gates.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The camera stage consumes these fields for shared framing and clearance rather than receiving frontend state or a second scene representation.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Missing models and runtime keep their distinct framing-fallback and clearance-refusal meanings.

## @evidence contracts/development/common.md#meaningful-documentation

IProps documents clip identity, units, final-motion ordering and absence behavior.

# src/cinematics/IAutoMovieCompilePerformShotCameras.ts#IAutoMovieCompilePerformShotCameras.IProps

## @evidence contracts/development/design.md#principled-representation

All motion is on the context's shot-local seconds clock, placement uses world metres and focal length intent retains millimetres without driving the fovY solve. performShot owns admission and checks the collector after compilation.

## @evidence contracts/development/design.md#minimal-and-owned-surface

performShot supplies final actor/object/formation motion and staged rotations to the shared subject framer, while the same models and runtime feed clearance; it passes its delivery raster and clock unchanged, so the aspect and rate are derived once for hero and coverage takes. No rendering state is included.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Missing models permit the subject framer's rig/default-size fallbacks but do not excuse missing obstacle geometry during clearance; alternate takes receive null focus and focal length intent.

## @evidence contracts/development/common.md#meaningful-documentation

Describes clip naming, locked-off behavior, units, borrowed tables, the raster and clock fallbacks and refusal, model fallback and conditional runtime requirements.
