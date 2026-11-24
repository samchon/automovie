# src/kinematics/curlChainUntilContact.ts#curlChainUntilContact

## @evidence contracts/development/implementation.md#principled-implementation

The auto-grasp stopping rule of Miller and Allen (2004) evaluated proximal to distal, with exact segment distances and a bracketed root search on forward kinematics of the engine's own resolver: the Illinois false position of `bracketedRoot` (Dowell and Jarratt 1971) on the continuous gap, whose readings move the bracket end of their own sign exactly as a bisection's do, completed by bisection to the stated width.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One chain/joint loop shares one actual gap reader. Raw FK retains its array-to-map adapter; an explicit native overlay writes that same fresh map directly through its private canonical frame-copy owner.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No tolerance counts a gap as contact: a joint stops on the positive side of the first non-positive gap, and an unreached object leaves the joint at its range limit with the positive gap reported.

## @evidence contracts/development/implementation.md#efficient-algorithms

Every original range/step probe remains and the scan's two bracket readings are not read again; the bracket is closed to the width of 30 bisections by false position, superlinear on a smooth gap, in place of 30 forward-kinematics and distance readings a joint (unmeasured). An explicit immutable rig admits each chain's first actual trial once, then its E complete existing edits rather than J rows. Native map output omits each probe's temporary FK array and subsequent indexing pass; fresh frame/Map output and all actual FK/contact work remain. Raw full resolvePose and original map construction are unchanged; speedup is unmeasured.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The supplied rig fixes unchanged skeleton/axes/frames/topology. A per-chain source is created only after the original first trial edit, preserving admission order and overwrite behavior; prior-chain commits and fixed root/non-chain records then remain unchanged. Every later complete current-chain edit list is actually admitted, while absent future bones stay absent. Contact queries, brackets, angles and final gaps are never reused as results.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

One lazy operation reader and fixed-collider readers live until this closure returns or throws. Each chain releases one fixed-source workspace, demanded set and bounded current-chain order before the next chain; no workspace, FK reader, queried pose/time history or handle escapes in the returned pose/reports.

## @evidence contracts/development/common.md#meaningful-documentation

States the closing rule and its source, the phalanx capsules, the exact distances, the search with its stopping side, the range-of-motion cap, determinism and the step's resolution.
