# src/production/IAutoMovieCreatePerformShotSubjectFramer.ts#IAutoMovieCreatePerformShotSubjectFramer.IProps

## @evidence contracts/development/design.md#principled-representation

Models supply model-metre bounds, rotations place motion under staged world facing, and all clips/cues are sampled on shot-local seconds. Missing geometry falls back to rig span and then the stand-in.

## @evidence contracts/development/design.md#minimal-and-owned-surface

createPerformShotSubjectFramer captures these inputs for the hero camera and coverage cameras after performance, launches and coupling are complete.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The closure retains the supplied tables and caches model extents; callers must keep them stable while using it. Group height/radius are opening measurements, so following changes the base without refitting later expansion.

## @evidence contracts/development/common.md#meaningful-documentation

Final shot artifacts borrowed by the camera subject-framing closure. Models supply model-metre bounds, rotations place motion under staged world facing, and all clips/cues are sampled on shot-local seconds. Missing geometry falls back to rig span and then the stand-in.
