# src/posture/prepareHumanPostureRigCheck.ts#prepareHumanPostureRigCheck

## @evidence contracts/development/common.md#meaningful-documentation

Defines actual-source provenance, live rig/topology/ROM/axes/clinical prerequisites, signed-zero-sensitive checks and ordinary fallback.

## @evidence contracts/development/implementation.md#principled-implementation

Free-leg resolution reads skeleton/rest data, topology and canonical range/basis/frame tables. Complete typed snapshots and ordered Object.is comparisons prove those dependencies unchanged without serialization; actual rig/topology owner replacement also invalidates. Profile/measure data is unused by this restricted solve.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

This owner separates typed snapshot creation from live comparison and detects complete rig epoch changes. Limb fits keep no memory, so a cold fallback after a mismatch solves against the current rig with nothing to release.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Checks every original projected field, topology entry/order, table entry/order and default basis without tolerance, numeric coercion, mutable identity trust or a result cache; any changed or unreadable field falls back.

## @evidence contracts/development/implementation.md#efficient-algorithms

Snapshot and each comparison take O(B+T) for B live/topology records and T table entries. A later producer first compares the current typed snapshot and copies only after a mismatch, removing repeated whole-rig structuredClone calls. Consumption still directly compares every current scalar; speedup is unmeasured.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

One weak body's current immutable scalar snapshot may serve multiple actual cold producers only after a fresh complete comparison. Every producer/consumer rereads bound body and canonical tables, so in-place edits, replacements and order changes invalidate; no previous comparison verdict, pose or fit answer is retained.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

A weak body owns one current typed metadata snapshot/checker; issued sources retain their original checker only until release. No linked epoch history, FK reader, target, fitted result, callback result or handle is retained here.
