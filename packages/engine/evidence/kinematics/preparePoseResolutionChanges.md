# src/kinematics/preparePoseResolutionChanges.ts#preparePoseResolutionChanges

## @evidence contracts/development/implementation.md#principled-implementation

A pose's records are sparse and the last record of a bone wins, so the selection is the last write per row and the baseline elsewhere; a frame depends on its row's and its ancestors' selections only, so one version of the whole selection tells a composed pose from a stale one.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Three numeric rows (the staged writes, the stamp of each row's last write and the selection) and one version. Admission stays with `preparePoseJointResolution`, composition with `composePoseFrames`.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No caller flag, pose identity or tolerance decides a change: every component is compared exactly at completion, and a write outside the rig's rows is ignored as an unrooted name's was.

## @evidence contracts/development/implementation.md#efficient-algorithms

A write is four stores; completion is one pass over the rows with four exact comparisons each, no sorting, no per-frame revision and no allocation.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

An unchanged selection keeps its version, so its composed frames are read again without composing.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Owns nine numbers a row and the borrowed baseline until its operation releases it; no record, pose or query history is kept.

## @evidence contracts/development/common.md#meaningful-documentation

Defines the query's three phases, last-write precedence, baseline restoration, the exact comparison and what an incomplete query leaves.
