# src/core/ArchetypeCoursePath.ts#ArchetypeCoursePath.IRow

## @evidence contracts/development/common.md#meaningful-documentation

States what it is and each member's unit.

## @evidence contracts/development/design.md#principled-representation

The leg, its distances along the path and on the ground in metres, its direction of travel, and the root's place and heading where it starts.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Written by `lay`, read by `advance` and the plan's samplers.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None.

# src/core/ArchetypeCoursePath.ts#ArchetypeCoursePath.IPose

## @evidence contracts/development/common.md#meaningful-documentation

States what it is and each member's unit.

## @evidence contracts/development/design.md#principled-representation

The root's place in metres and its heading in degrees.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Returned by `advance`.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None.

# src/core/ArchetypeCoursePath.ts#ArchetypeCoursePath.lay

## @evidence contracts/development/common.md#meaningful-documentation

States the inputs, the result and the refusals.

## @evidence contracts/development/implementation.md#principled-implementation

Each leg's run on the ground is its length or its radius times its angle, and its length along the path that run times the square root of one plus the grade squared, the hypotenuse of a constant grade; each leg starts where `advance` leaves the one before it.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Admit the leg, measure it, record it, advance to its end.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A leg that cannot be laid is refused, never skipped.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the legs.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Called once per plan.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The rows are handed to the plan, which keeps them as long as its caller keeps it.

# src/core/ArchetypeCoursePath.ts#ArchetypeCoursePath.advance

## @evidence contracts/development/common.md#meaningful-documentation

States the inputs, the range and the result.

## @evidence contracts/development/implementation.md#principled-implementation

The ground covered and the height gained in the grade's proportion; a straight leg along the way the root travels, a reversed leg opposite to the heading it faces, and a turn the arc about its centre a radius to the turning side.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The grade, the direction of travel, then one branch for a straight leg and one for a turn.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A level leg skips the grade's scaling and a forward leg the reversal, so a course using neither computes as before they existed.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.
