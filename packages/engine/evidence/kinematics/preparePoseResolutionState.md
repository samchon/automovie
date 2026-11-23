# src/kinematics/preparePoseResolutionState.ts#preparePoseResolutionState

## @evidence contracts/development/implementation.md#principled-implementation

Record poses compose admitted joints through parent-first FK. Fixed tuple scans validate all values and select the requested ancestry's articulations. Fixed sources snapshot their admitted articulations before overlays, and an edit a query omits restores the baseline at completion. Genuine rest composes identity articulations under a null root through the same pass, without scale.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Static construction, tuple staging, joint admission, the selection and the composition have their own owners. Record and scalar scans meet at the same completion, root and composition phases here; array and map outputs share one record maker.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Ordinary reads admit every current record, fixed-source production admits every baseline record and every query admits all supplied edits, including overwritten/stray records. No target, time, tolerance, editable whitelist or external admission flag certifies a result; numeric demands come only from the same immutable rig's name lookup.

## @evidence contracts/development/implementation.md#efficient-algorithms

A pose of J records costs J ordered admissions, one completion pass over the B rows, a composition pass when the selection or the root changed over the demanded ancestor closure (extended for an additional read of the same pose), and one fresh record per demanded bone. One byte per bone tracks completed rows and the last immutable demand retains only its ancestor indices; K names sort unless bound. A fixed source admits its baseline once, then E edits a query. Rest composes once per rig and copies B records a read. Speedup is unmeasured.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The rig's tables are built once per node list. An unchanged selection under an unchanged root keeps its composed frames for every later read of the operation. A reading takes one completed admission's articulations and root as a value, so the readers its producer hands it to share its frames without another admission.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

An operation owns the joint admission's O(U+B) rows, nine numbers a bone of selection and eleven of frames until release; a fixed source adds its own baseline row. Rest frames belong to the rig's tables. Every output is a fresh caller-owned record; no raw pose, query history, task or handle is kept.

## @evidence contracts/development/common.md#meaningful-documentation

Defines immutable graph/conventions, joint/pose/fixed-source and staged-tuple admission, the numeric selection and frames, fixed demand, genuine rest, metre frames, phase ordering and fresh-output/operation lifetime.
