# src/perform/HumanPropSweepColliders.ts#HumanPropSweepColliders.reach

## @evidence contracts/development/common.md#meaningful-documentation

States what `reach` reads and what it returns.

## @evidence contracts/development/implementation.md#principled-implementation

A prop reaches the largest over its shapes of the shape's offset plus its own bounding radius.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One helper of `HumanPropSweep`, moved to its own file with the helpers it shares a concern with.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Moved unchanged from `HumanPropSweep`; no value, tolerance, fallback or search is added.

## @evidence contracts/development/implementation.md#efficient-algorithms

Called where `HumanPropSweep` called it before; its cost is the moved code's.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each call reads its own arguments; nothing is computed twice by the move.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains only what its result holds, for as long as the caller holds it.

# src/perform/HumanPropSweepColliders.ts#HumanPropSweepColliders.culled

## @evidence contracts/development/common.md#meaningful-documentation

States what `culled` reads and what it returns.

## @evidence contracts/development/implementation.md#principled-implementation

A collider is read only where its cheap lower bound allows a contact within the projectile's radius; elsewhere the bound stands for the distance.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One helper of `HumanPropSweep`, moved to its own file with the helpers it shares a concern with.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Moved unchanged from `HumanPropSweep`; no value, tolerance, fallback or search is added.

## @evidence contracts/development/implementation.md#efficient-algorithms

Called where `HumanPropSweep` called it before; its cost is the moved code's.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each call reads its own arguments; nothing is computed twice by the move.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains only what its result holds, for as long as the caller holds it.

# src/perform/HumanPropSweepColliders.ts#HumanPropSweepColliders.separating

## @evidence contracts/development/common.md#meaningful-documentation

States what `separating` reads and what it returns.

## @evidence contracts/development/implementation.md#principled-implementation

A start contact the flight leaves is one whose relative velocity points out along the surface normal (Baraff 1989) and whose gap is positive at the next grid second.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One helper of `HumanPropSweep`, moved to its own file with the helpers it shares a concern with.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Moved unchanged from `HumanPropSweep`; no value, tolerance, fallback or search is added.

## @evidence contracts/development/implementation.md#efficient-algorithms

Called where `HumanPropSweep` called it before; its cost is the moved code's.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each call reads its own arguments; nothing is computed twice by the move.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains only what its result holds, for as long as the caller holds it.

# src/perform/HumanPropSweepColliders.ts#HumanPropSweepColliders.pointVelocity

## @evidence contracts/development/common.md#meaningful-documentation

States what `pointVelocity` reads and what it returns.

## @evidence contracts/development/implementation.md#principled-implementation

A carried point's velocity is the central difference of the point fixed in its frame over the contact's time resolution.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One helper of `HumanPropSweep`, moved to its own file with the helpers it shares a concern with.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Moved unchanged from `HumanPropSweep`; no value, tolerance, fallback or search is added.

## @evidence contracts/development/implementation.md#efficient-algorithms

Called where `HumanPropSweep` called it before; its cost is the moved code's.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each call reads its own arguments; nothing is computed twice by the move.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains only what its result holds, for as long as the caller holds it.

# src/perform/HumanPropSweepColliders.ts#HumanPropSweepColliders.thinnest

## @evidence contracts/development/common.md#meaningful-documentation

States what `thinnest` reads and what it returns.

## @evidence contracts/development/implementation.md#principled-implementation

The least thickness over the non-flying props' and the other people's non-finger shapes, the whole span when none is thin.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One helper of `HumanPropSweep`, moved to its own file with the helpers it shares a concern with.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Moved unchanged from `HumanPropSweep`; no value, tolerance, fallback or search is added.

## @evidence contracts/development/implementation.md#efficient-algorithms

Called where `HumanPropSweep` called it before; its cost is the moved code's.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each call reads its own arguments; nothing is computed twice by the move.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains only what its result holds, for as long as the caller holds it.

# src/perform/HumanPropSweepColliders.ts#HumanPropSweepColliders.size

## @evidence contracts/development/common.md#meaningful-documentation

States what `size` reads and what it returns.

## @evidence contracts/development/implementation.md#principled-implementation

A round shape's diameter, a box's least full extent, or a hull's inscribed width bound.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One helper of `HumanPropSweep`, moved to its own file with the helpers it shares a concern with.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Moved unchanged from `HumanPropSweep`; no value, tolerance, fallback or search is added.

## @evidence contracts/development/implementation.md#efficient-algorithms

Called where `HumanPropSweep` called it before; its cost is the moved code's.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each call reads its own arguments; nothing is computed twice by the move.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains only what its result holds, for as long as the caller holds it.

# src/perform/HumanPropSweepColliders.ts#HumanPropSweepColliders.width

## @evidence contracts/development/common.md#meaningful-documentation

States what `width` reads and what it returns.

## @evidence contracts/development/implementation.md#principled-implementation

Twice the depth of a hull's vertex centroid inside it bounds its least width from below (the largest ball about that point).

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One helper of `HumanPropSweep`, moved to its own file with the helpers it shares a concern with.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Moved unchanged from `HumanPropSweep`; no value, tolerance, fallback or search is added.

## @evidence contracts/development/implementation.md#efficient-algorithms

Called where `HumanPropSweep` called it before; its cost is the moved code's.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each call reads its own arguments; nothing is computed twice by the move.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains only what its result holds, for as long as the caller holds it.

# src/perform/HumanPropSweepColliders.ts#HumanPropSweepColliders.ISurface

## @evidence contracts/development/common.md#meaningful-documentation

Names a surface's outward normal and velocity at its nearest point.

## @evidence contracts/development/design.md#principled-representation

Moved unchanged from `HumanPropSweep`; its units and frames are those its members or signature state.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by `HumanPropSweepColliders` and `HumanPropSweep`; every member type is imported from its owner.

## @evidenceExclude contracts/development/design.md#prohibited-design-shortcuts

Moved unchanged; it adds no shape of its own.

# src/perform/HumanPropSweepColliders.ts#HumanPropSweepColliders.Bound

## @evidence contracts/development/common.md#meaningful-documentation

Names a lower bound on a collider's distance from a flight segment.

## @evidence contracts/development/design.md#principled-representation

Moved unchanged from `HumanPropSweep`; its units and frames are those its members or signature state.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by `HumanPropSweepColliders` and `HumanPropSweep`; every member type is imported from its owner.

## @evidenceExclude contracts/development/design.md#prohibited-design-shortcuts

Moved unchanged; it adds no shape of its own.

# src/perform/HumanPropSweepColliders.ts#HumanPropSweepColliders.Surface

## @evidence contracts/development/common.md#meaningful-documentation

Names a reader of a collider's surface at its point nearest a flight segment.

## @evidence contracts/development/design.md#principled-representation

Moved unchanged from `HumanPropSweep`; its units and frames are those its members or signature state.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by `HumanPropSweepColliders` and `HumanPropSweep`; every member type is imported from its owner.

## @evidenceExclude contracts/development/design.md#prohibited-design-shortcuts

Moved unchanged; it adds no shape of its own.
