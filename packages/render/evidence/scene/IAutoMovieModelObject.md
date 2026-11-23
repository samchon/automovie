# src/scene/IAutoMovieModelObject.ts#IAutoMovieModelObject

## @evidence contracts/development/design.md#principled-representation

A root group with semantic bone and authored part-id maps supports common pose and prop-articulation application; imported appearances may supply expression/frame callbacks and an empty part map.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Separates root placement, skeletal articulation, authored part lookup, the model's gaze declaration and optional runtime integration without exposing a concrete imported-avatar SDK.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Part ids decide articulation rather than optional nonunique display names; missing imported rig slots are not replaced with invented bones.

## @evidence contracts/development/common.md#meaningful-documentation

Documents root mounting, nonrigged bone absence, part-id lookup rationale, the optional gaze declaration and optional expression/runtime-flush hooks.

# src/scene/IAutoMovieModelObject.ts#IAutoMovieModelObject.afterAutoMovieFrame

## @evidence contracts/development/implementation.md#principled-implementation

Receives AutoMoviePlayer's actual applied pose/expression frame after both viewer adapters finish, so imported dependent state shares the same elapsed/delta clock.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One optional callback adapts foreign runtime integration without exposing its SDK methods throughout model construction and playback.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The host supplies this callback explicitly instead of monkey-patching a runtime update method or synthesizing a global clock.

## @evidence contracts/development/common.md#meaningful-documentation

States optional imported-runtime flushing and its ordering after pose/expression application.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

This callback contract does not select the imported runtime's update algorithm.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

The player invokes effectful flushing for each update and defines no result-sharing promise here.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Any imported state or task retained by the callback remains host-owned; the model handle acquires no imported manager.
