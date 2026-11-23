# src/scene/human-polygon/applyHumanPolygonPose.ts#applyHumanPolygonPose

## @evidence contracts/development/implementation.md#principled-implementation

Builds an admitted bone placement map before any write, rejects missing/duplicate slots, malformed/nonfinite tuples and squared quaternion norm error above 1e-6, then copies each bind-relative body transform to both existing groups and refreshes ancestor/subtree matrices. Required identities come from the fixed rest descriptor, including custom bones; normalization and parent-FK recomposition are deliberately absent.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One adapter owns complete-pose admission and actual group writes; fixed shape generation, clinical evaluation and actor-root placement stay with their respective owners.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Uses actual authored bone ids and mesh frames, without humanoid casts, hidden scale or contact-proxy substitutions.

## @evidence contracts/development/common.md#meaningful-documentation

Gives atomic admission, numerical tolerance, flat-group frame, local probe convention and actor-root ownership.

## @evidence contracts/development/implementation.md#efficient-algorithms

O(B+G+A+O) work for B supplied/required bones, G bound groups, A ancestors and O subtree nodes; one O(B) temporary map avoids repeated placement scans and no geometry is rebuilt.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses actual groups, geometry and matrices; mutable pose records are revalidated rather than cached by identity.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Placement references live only in the call-local map; no GPU object, clock, task or retained cache is acquired.
