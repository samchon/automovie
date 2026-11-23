# src/geometry/construction/AutoMovieConstructionRing.ts#AutoMovieConstructionRing

## @evidence contracts/development/common.md#meaningful-documentation

States where the vertices lie, both cycles, the part's phase order and the sign's meaning.

## @evidence contracts/development/design.md#principled-representation

Represents A continuation's shared ring on the body: its vertices on the host face's end section at uniform host phases, a winding cycle of the host face there, and the same vertices as a winding cycle of the part face at the matching part phases (the host's phase, or its negative when the part's stations run against the host's), so the two faces are drawn onto one ring vertex for vertex: companion namespace of 2 members (`IRing`, `create`); units and frames named in its text: radian, local. It has no optional member, so no absent-value state combines with another.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Owned by the module that declares `AutoMovieConstructionRing` in packages/engine/src/geometry/construction/AutoMovieConstructionRing.ts; its surface is the 2 members listed and the text shows 3 other files naming it, mostly packages/engine (3), so no member is declared for a presumed future need.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Scanning the declaration finds no `any`, a use of `unknown`, no index signature and no cast; it duplicates no type that another owner declares as far as a name search shows. The widening above is the remaining shortcut and is not justified here.

# src/geometry/construction/AutoMovieConstructionRing.ts#AutoMovieConstructionRing.create

## @evidence contracts/development/implementation.md#principled-implementation

Evaluates host endpoint positions once and assigns their vertex indices to both charts, reversing the part's index correspondence when stations oppose.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One operation owns shared vertex allocation and both neighbour/cycle records, so no post-tessellation welding stage is needed.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Uses the caller's face/station/count/sign data without distance matching or an independent endpoint-equality check; invalid inputs can throw after mutation, so realization owns the admitted context.

## @evidence contracts/development/common.md#meaningful-documentation

States mutation, prior endpoint agreement, winding/phase mapping and the mm/radian chart convention through IRing.

## @evidence contracts/development/implementation.md#efficient-algorithms

For F mesh owners and C ring samples, owner lookup costs O(F), C surface jets supply positions and O(C) work builds cycles/adjacency arrays.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Both faces share exact vertex indices; the owner lookup reuses the existing unique-name surface owner in this admitted body.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The body retains C vertices and two O(C) cycle/adjacency records, with a surface closure only if its owner is newly registered; the local order array has call lifetime.
