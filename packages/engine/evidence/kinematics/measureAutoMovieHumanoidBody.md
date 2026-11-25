# src/kinematics/measureAutoMovieHumanoidBody.ts#measureAutoMovieHumanoidBody

## @evidence contracts/development/implementation.md#principled-implementation

Joint-centre anthropometry on the rest rig and exact collider bounds, the segment definitions of Winter ch. 4.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One rest-position pass and a first-name segment index feed direct anthropometric reads. The stature traversal supplies every later measure's bounds. WithSurfaces then calls the existing surface resolver in original order with one internal, genuine neutral-bounds epoch.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A missing bone or segment throws rather than being guessed.

## @evidence contracts/development/implementation.md#efficient-algorithms

O(B+S) indexing precedes one bounds computation per profile shape, including O(V) hull rotations. Head/chest/hand/foot reuse extents. WithSurfaces shares those six numeric coordinates with subsequent surface bounds instead of repeating hull rotations. Requested hull least width still scans F faces against V vertices in O(F V) time and constant scratch.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Exact segment identities share actual neutral bounds in the unchanged synchronous epoch, preserving first duplicate-name precedence. The optional internal handle must match the live profile/segment; withSurfaces issues and releases it itself, accepting no caller-derived bounds. Standalone calls retain only local extents.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Owns O(B+S) local rest/names/bounds until return or throw. WithSurfaces releases all internal epoch entries in finally on either derivation's success or failure; only fresh numeric measure and surface records escape, with no profile reader or geometry handle.

## @evidence contracts/development/common.md#meaningful-documentation

States the frame premise, where each family of measures is read and the fallbacks.
