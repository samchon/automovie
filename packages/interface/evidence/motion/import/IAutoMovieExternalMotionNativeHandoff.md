# src/motion/import/IAutoMovieExternalMotionNativeHandoff.ts#IAutoMovieExternalMotionNativeHandoff

## @evidence contracts/development/design.md#principled-representation

The handoff carries a rig whose mapped bones matched the inspected basis and a node-sorted mapping, a canonical order that makes two receipts for the same decision compare equal regardless of the author's row order.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The handoff separates admitted source binding from the author's decision; the selected clip is already present on the receipt, so the take id is omitted here.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Interpolation and channel coverage remain later conversion checks; the handoff does not claim ingest proved an executable take.

## @evidence contracts/development/common.md#meaningful-documentation

The comments state that the rig is a deep copy and that the mapping is sorted by node id in code-unit order.
