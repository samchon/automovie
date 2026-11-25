# src/posture/prepareHumanFootPivot.ts#prepareHumanFootPivot

## @evidence contracts/development/common.md#meaningful-documentation

States fixed inputs, frames, units, defaults and the reader's equivalence to pivot.

## @evidence contracts/development/implementation.md#principled-implementation

Uses exactly rotation's yaw-times-roll prefix, normalization and varying pitch multiplication, then the actual default or explicitly supplied contact minus its rotated socket offset.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Fixed rotation prefix and socket offset precede one pitch reader of the same rigid transform as pivot.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Calls offset for toe articulation and preserves quaternion multiplication order; no pitch or angle bound changes.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant preparation and evaluation; socket lookup and fixed yaw and roll quaternion construction run once per rocker.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The caller fixes body, side, socket, heading, toes and roll. Default at remains fixed; an explicitly supplied current contact changes translation alone and is actually subtracted each time, without sharing a placed result.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

One reader retains its default contact, socket offset and rotation prefix until its solve/action releases it; explicit current contacts and queried results are not retained.
