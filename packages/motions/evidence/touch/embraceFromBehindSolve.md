# src/touch/embraceFromBehindSolve.ts#embraceFromBehindSolve.neck

## @evidence contracts/development/common.md#meaningful-documentation

States what `neck` reads and what it returns.

## @evidence contracts/development/implementation.md#principled-implementation

The neck's flexion, side bend, turn and protraction are added to the entry's neck and head joints at a share of the embrace.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One helper of `embraceFromBehind`, moved to its own file with the helpers it shares a concern with.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Moved unchanged from `embraceFromBehind`; no value, tolerance, fallback or search is added.

## @evidence contracts/development/implementation.md#efficient-algorithms

Called where `embraceFromBehind` called it before; its cost is the moved code's.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each call reads its own arguments; nothing is computed twice by the move.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains only what its result holds, for as long as the caller holds it.

# src/touch/embraceFromBehindSolve.ts#embraceFromBehindSolve.solve

## @evidence contracts/development/common.md#meaningful-documentation

States what `solve` reads and what it returns.

## @evidence contracts/development/implementation.md#principled-implementation

The stance and the head are one trust-region SQP (sco's `BasicTrustRegionSQP`): the chin's squared distance to the shoulder region as cost, the chin and chest contact violations as equalities (Mordatch, Todorov and Popovic 2012), trajopt's collision hinge against the skin margin, each freedom within its range; the result is checked as Algorithm 1 checks a base and refused with its measure.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One helper of `embraceFromBehind`, moved to its own file with the helpers it shares a concern with.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Moved unchanged from `embraceFromBehind`; no value, tolerance, fallback or search is added.

## @evidence contracts/development/implementation.md#efficient-algorithms

Called where `embraceFromBehind` called it before; its cost is the moved code's.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each call reads its own arguments; nothing is computed twice by the move.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains only what its result holds, for as long as the caller holds it.

# src/touch/embraceFromBehindSolve.ts#embraceFromBehindSolve.contact

## @evidence contracts/development/common.md#meaningful-documentation

States what `contact` reads and what it returns.

## @evidence contracts/development/implementation.md#principled-implementation

The chest's contact is the least signed distance from the audit's torso probes to the partner's back colliders.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One helper of `embraceFromBehind`, moved to its own file with the helpers it shares a concern with.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Moved unchanged from `embraceFromBehind`; no value, tolerance, fallback or search is added.

## @evidence contracts/development/implementation.md#efficient-algorithms

Called where `embraceFromBehind` called it before; its cost is the moved code's.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each call reads its own arguments; nothing is computed twice by the move.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains only what its result holds, for as long as the caller holds it.

# src/touch/embraceFromBehindSolve.ts#embraceFromBehindSolve.degrees

## @evidence contracts/development/common.md#meaningful-documentation

States what `degrees` reads and what it returns.

## @evidence contracts/development/implementation.md#principled-implementation

Radians times the degrees in a radian.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One helper of `embraceFromBehind`, moved to its own file with the helpers it shares a concern with.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Moved unchanged from `embraceFromBehind`; no value, tolerance, fallback or search is added.

## @evidence contracts/development/implementation.md#efficient-algorithms

Called where `embraceFromBehind` called it before; its cost is the moved code's.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each call reads its own arguments; nothing is computed twice by the move.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains only what its result holds, for as long as the caller holds it.

# src/touch/embraceFromBehindSolve.ts#embraceFromBehindSolve.refusal

## @evidence contracts/development/common.md#meaningful-documentation

States what `refusal` reads and what it returns.

## @evidence contracts/development/implementation.md#principled-implementation

The embrace's refusal names the partner and states the reason and the fix.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One helper of `embraceFromBehind`, moved to its own file with the helpers it shares a concern with.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Moved unchanged from `embraceFromBehind`; no value, tolerance, fallback or search is added.

## @evidence contracts/development/implementation.md#efficient-algorithms

Called where `embraceFromBehind` called it before; its cost is the moved code's.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each call reads its own arguments; nothing is computed twice by the move.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains only what its result holds, for as long as the caller holds it.

# src/touch/embraceFromBehindSolve.ts#embraceFromBehindSolve.NeckBone

## @evidence contracts/development/common.md#meaningful-documentation

Names the two neck bones a resting head bends over.

## @evidence contracts/development/design.md#principled-representation

Moved unchanged from `embraceFromBehind`; its units and frames are those its members or signature state.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by `embraceFromBehindSolve` and `embraceFromBehind`; every member type is imported from its owner.

## @evidenceExclude contracts/development/design.md#prohibited-design-shortcuts

Moved unchanged; it adds no shape of its own.

# src/touch/embraceFromBehindSolve.ts#embraceFromBehindSolve.IRange

## @evidence contracts/development/common.md#meaningful-documentation

Names a freedom's least and greatest value in the solve.

## @evidence contracts/development/design.md#principled-representation

Moved unchanged from `embraceFromBehind`; its units and frames are those its members or signature state.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by `embraceFromBehindSolve` and `embraceFromBehind`; every member type is imported from its owner.

## @evidenceExclude contracts/development/design.md#prohibited-design-shortcuts

Moved unchanged; it adds no shape of its own.

# src/touch/embraceFromBehindSolve.ts#embraceFromBehindSolve.ISolved

## @evidence contracts/development/common.md#meaningful-documentation

Names one solved embrace's stance and head freedoms and the chin's miss.

## @evidence contracts/development/design.md#principled-representation

Moved unchanged from `embraceFromBehind`; its units and frames are those its members or signature state.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by `embraceFromBehindSolve` and `embraceFromBehind`; every member type is imported from its owner.

## @evidenceExclude contracts/development/design.md#prohibited-design-shortcuts

Moved unchanged; it adds no shape of its own.

# src/touch/embraceFromBehindSolve.ts#embraceFromBehindSolve.IPlaced

## @evidence contracts/development/common.md#meaningful-documentation

Names a solved embrace with the partner's torso bone its chest bears on.

## @evidence contracts/development/design.md#principled-representation

Moved unchanged from `embraceFromBehind`; its units and frames are those its members or signature state.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by `embraceFromBehindSolve` and `embraceFromBehind`; every member type is imported from its owner.

## @evidenceExclude contracts/development/design.md#prohibited-design-shortcuts

Moved unchanged; it adds no shape of its own.

# src/touch/embraceFromBehindSolve.ts#embraceFromBehindSolve.ISurfaces

## @evidence contracts/development/common.md#meaningful-documentation

Names the partner's surfaces the embrace bears on.

## @evidence contracts/development/design.md#principled-representation

Moved unchanged from `embraceFromBehind`; its units and frames are those its members or signature state.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by `embraceFromBehindSolve` and `embraceFromBehind`; every member type is imported from its owner.

## @evidenceExclude contracts/development/design.md#prohibited-design-shortcuts

Moved unchanged; it adds no shape of its own.
