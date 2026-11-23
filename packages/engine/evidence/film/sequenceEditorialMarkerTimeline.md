# src/film/sequenceEditorialMarkerTimeline.ts#sequenceEditorialMarkerTimeline

## @evidence contracts/development/implementation.md#principled-implementation

Reconciles a same-shot hard-cut seam at roundoff scale and tests half-open membership exactly. On collapsed source spans, the opening point stays at output start and ranges covering the span extend to output end. Prepared entry starts already account for transitions.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Reuses preparePlaybackTimeline for placement and source lookup and owns only marker retention, projection and ordering.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Trim-edge touches do not become point markers. Replays keep distinct indices. Sorting uses code units and original endpoints remain unchanged.

## @evidence contracts/development/common.md#meaningful-documentation

Specifies the matching preparation premise, hard-cut seam convention, half-open rule, clipping and ordering.

## @evidence contracts/development/implementation.md#efficient-algorithms

After preparation, projection compares one next entry per play, visits each marker once per play, and sorts the retained plays by output placement.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Uses the prepared playback clock and its shot index without a second layout or lookup table.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Only fresh marker placements escape. The layout and shot index remain caller-owned.
