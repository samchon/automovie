# src/authoring/IAutoMovieStageActor.ts#IAutoMovieStageActor

## @evidence contracts/development/design.md#principled-representation `stageScene` requires a cast-member node, a finite position and a finite heading, turns the heading into a quaternion about +Y, and checks that a mount parent is another placed actor; `performShot` then bakes the mount through the same attach baker an `attachTo` uses and refuses a rig-less parent or a missing bone.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Placement supplies position and an upright heading. Optional support windows reference already staged surfaces by id. Staging fixes scale to one and resolves the model from the cast reference.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A mount that names the actor itself is refused rather than ignored, and a resumed beat overwrites the placement from recorded state instead of trusting a stale authored value.

## @evidence contracts/development/common.md#meaningful-documentation

States how the node and model are chosen, world units and heading, resumption, optional support timing, and mount requirements.
