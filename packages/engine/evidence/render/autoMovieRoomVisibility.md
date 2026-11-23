# src/render/autoMovieRoomVisibility.ts#autoMovieRoomVisibility

## @evidence contracts/development/implementation.md#principled-implementation

Build a conservative cell/portal graph from openings and every connector stop, include exterior connectivity and then add ancestors of reachable leaf cells. Outside, ambiguous or cell-less placement hides nothing; validated parent acyclicity is a premise.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Leaf containment selects the camera cell and a separate closure owns reachability; container spaces are consequences of visible cells rather than routing shortcuts between sealed rooms.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Declared openings stay portals regardless of movable door state because this owner has no closed-door proof; unknown extents produce an explicit inconclusive result instead of invented culling.

## @evidence contracts/development/common.md#meaningful-documentation

Docs describe world camera position, leaf/container distinction, exterior behavior and every conservative fallback; sorted ids make outputs independent of declaration order.

## @evidence contracts/development/implementation.md#efficient-algorithms

Containment scans leaf geometry; boundary/connector cliques cost the sum of squared stop counts, and indexed-queue BFS costs O(V+E) without shift-induced queue copies. Parent closure and deterministic sorting add their own space/depth costs.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Parent, open-boundary and edge indices are built once per request; no graph cache assumes mutable environments, openings or camera position remain equivalent.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Graph/queue/indices are call-owned and returned id arrays contain only report values; no camera, scene object, handle or background culler is retained.
