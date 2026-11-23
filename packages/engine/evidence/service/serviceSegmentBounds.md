# src/service/serviceSegmentBounds.ts#serviceSegmentBounds

## @evidence contracts/development/implementation.md#principled-implementation

Coordinate minima/maxima of all route vertices, padded by uniform radius, contain every straight swept span as a conservative world AABB.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

This whole-route query is distinct from per-leg clash bounds, but currently reaches only service geometry tests rather than a production broad phase.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Empty routes refuse by segment id instead of returning an invented origin volume; the box is not presented as an exact pipe surface.

## @evidence contracts/development/common.md#meaningful-documentation

Names broad-phase meaning, metre/admitted-input premise, empty/singleton behavior and the missing product consumer.

## @evidence contracts/development/implementation.md#efficient-algorithms

R route vertices require three coordinate comparisons each, O(R) time with fixed two-corner working storage.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A bound belongs to the current radius and route; no geometry-version cache or cross-segment reuse is maintained.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Working and returned corners contain scalar copies only, so releasing the result leaves no source-route references.
