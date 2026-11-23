# src/harness/IAutoMovieClearanceBox.ts#IAutoMovieClearanceBox

## @evidence contracts/development/design.md#principled-representation `propClearanceBounds` encloses the transformed box in a world AABB and `propBoundsOverlap` applies strict interval comparisons on all three axes. This is the separating-axis rule for ordered AABBs, not an oriented-box or mesh intersection test: rotated enclosures can overlap without the original volumes touching. A derived NaN makes the overlap comparisons false; finite local admission does not prove finite transformed arithmetic.

## @evidence contracts/development/design.md#minimal-and-owned-surface

A clearance is a prop box plus an id, so it shares the occupancy box's corner rules and transform code and needs no shape of its own.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Each violation names the clearance and intruding prop instead of nudging either. This check excludes its own prop and building geometry; separate relation measurements are partial and do not establish that the keep-out box clears every building element. A declared prop contact exempts pairwise occupancy overlap, never a clearance intrusion.

## @evidence contracts/development/common.md#meaningful-documentation

States the id and corner refusals, how the volume is transformed and against which props it is tested, the face-contact rule, and the two things it is never tested against.
