# src/index.ts#renderCrossDissolve

## @evidence contracts/development/implementation.md#principled-implementation

Wraps two pose resolutions and actual scene draws into the existing display-frame dissolve owner, giving each source an optional reversible render wrapper.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Pose/state resolution remains caller-owned while alpha admission, display-copy composition and native state restoration belong to renderCrossDissolveFrames.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Structural guide products must select their dominant layer before this beauty path; no pixel identity is inferred from the shared scene object or equal pose metadata.

## @evidence contracts/development/common.md#meaningful-documentation

Documents two beauty poses and wrapper responsibility for source-local rendering configuration.

## @evidence contracts/development/implementation.md#efficient-algorithms

Adapter coordination is fixed around exactly two pose/wrapper callbacks, with native draw and display compositor costs delegated.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Both callbacks use the same borrowed scene/camera but resolve their actual source state independently; renderer-scoped copy reuse is owned by the downstream compositor.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The adapter retains no owner after return and acquires no geometry/target; caller owns scene/camera and the renderer compositor owns its copied display resources.
