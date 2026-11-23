# src/authoring/IAutoMovieStage.ts#IAutoMovieStage

## @evidence contracts/development/design.md#principled-representation `stageScene` checks referential integrity and finite ranges, not craft: every cast member placed exactly once and every placement a cast member, unique non-blank ids across the four node lists, camera and mount targets that resolve, and the space, fog and environment through their own validators; it then lowers actors and set pieces to scene nodes, cameras to resolved scene cameras and lights to scene lights.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The set is one record of typed lists, one per kind of placement, plus optional world members, with one authored form selected for fog and an optional physical medium that staging refuses beside it; each list's rules live on its element type, and the cross-list id uniqueness is stated once here.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

An omitted `space` lowers to an explicit `space: null` while fog is omitted when neither fog form is authored and environment is omitted when unstaged, so a scene states whether it has a ground and an unstaged atmosphere does not change the bytes of scenes that never declared one; no node id or set shape is special-cased.

## @evidence contracts/development/common.md#meaningful-documentation

States who owns the record and who consumes it, the id uniqueness rule, what each optional member lowers to when omitted, which validator checks it, that `plan` is never read, and that a shot needs at least one camera.
