# src/motion/IAutoMovieFootPlant.ts#IAutoMovieFootPlant

## @evidence contracts/development/design.md#principled-representation

Records a maximal inclusive stance run and one fixed model-frame contact target, matching pinStanceTargets' grouping of adjacent contact samples; a carried opening target preserves beat continuity.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Separates compact stance metadata from dense corrected keyframes, so later beat handoff reads one contact per run instead of re-detecting stance.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A new run pins its detected initial foot and ground height, while an opening run may retain the caller's prior target; neither path invents a contact for a non-stancing foot.

## @evidence contracts/development/common.md#meaningful-documentation

States inclusive local times, fixed model-frame position, ground snapping and the authoritative opening-target exception.
