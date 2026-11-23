# src/index.ts#applyAutoMovieInspectionSection

## @evidence contracts/development/common.md#meaningful-documentation

States what is cut, who owns the cut, what is recorded and put back and when a material is recompiled.

## @evidence contracts/development/implementation.md#principled-implementation

Restoring recorded state rather than defaults keeps planes a film set on its own materials, and three.js compiles clipping into a program by plane count, so a change of count needs a recompile.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Record, cut, and return the restore.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Every material is recorded by identity, so one shared by many meshes is put back once.

## @evidence contracts/development/implementation.md#efficient-algorithms

One traversal to record and one by the plane owner; the restore is linear in the materials.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The cut itself is the section plane owner's.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The record of prior state lives until the returned call runs; nothing is allocated on the GPU.
