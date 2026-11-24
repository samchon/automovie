# src/environment/IAutoMovieFurnishingRelation.ts#IAutoMovieFurnishingRelation

## @evidence contracts/development/design.md#principled-representation

A closed union of three placements, discriminated by `kind`, resolves in the room frame in metres and degrees from the pieces' measured rest boxes. References name earlier roles only, so resolution is ordered and acyclic; the producer checks the reference, finiteness and fit at run time.

## @evidence contracts/development/design.md#minimal-and-owned-surface

`interface` owns the authored relation; `resolveFurnishingPieces` in `archetypes` consumes it for `createFurnishedRoom` and the room kits. The `at` member keeps the existing absolute placement so one record can hold every piece.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Wall, facing and absolute placement are separate members rather than optional fields on one record. Within the wall member, `offset` and `gap` belong to the two run origins; the producer refuses `offset` with `after` and `gap` without it, because the type cannot tie them to `after`'s presence without splitting the member the issue fixes.

## @evidence contracts/development/common.md#meaningful-documentation

States the room frame, the front and heading conventions, measurement between rest-box faces and the ordering rule.

# src/environment/IAutoMovieFurnishingRelation.ts#IAutoMovieFurnishingRelation.IWall

## @evidence contracts/development/design.md#principled-representation

A wall, a run origin (an offset from the run's start corner, or a gap past an earlier piece) and an underside elevation, all in metres, place the piece's back box face on the wall's inner face. The run direction and heading per wall are fixed by the documentation's table.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Kits and productions place counters, sofas, beds, cabinets and hung mirrors against walls without arithmetic on model sizes; `after` chains pieces so a resized piece moves its neighbours.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The elevation default reads the producer's own underside height, so the planner adds no mounting heights of its own. The producer refuses an `after` on another wall, `offset` with `after` and `gap` without it.

## @evidence contracts/development/common.md#meaningful-documentation

States the run direction and heading of each wall and each field's unit and default.

# src/environment/IAutoMovieFurnishingRelation.ts#IAutoMovieFurnishingRelation.IFacing

## @evidence contracts/development/design.md#principled-representation

A target role, a clear distance between the two front box faces and an offset along the target's local X, in metres, place a piece turned 180 degrees from the target.

## @evidence contracts/development/design.md#minimal-and-owned-surface

A coffee table before a sofa and an office chair before a desk need exactly this relation; the clear distance is what an author states.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The piece stands on the floor; elevation belongs to the wall member that hangs pieces. The producer refuses a negative distance and a missing or later target.

## @evidence contracts/development/common.md#meaningful-documentation

States the heading rule, how the distance and offset are measured and the floor seating.

# src/environment/IAutoMovieFurnishingRelation.ts#IAutoMovieFurnishingRelation.IAt

## @evidence contracts/development/design.md#principled-representation

A labelled XZ tuple in room-frame metres and a heading in degrees, the same shape as a layout override.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Keeps absolute placement available to pieces that have no relation, so one record holds every piece.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Its shape matches the layout override; the producer checks finiteness and fit.

## @evidence contracts/development/common.md#meaningful-documentation

States the frame, units and heading default.
