# src/sport/sprintStartSetChain.ts#sprintStartSetChain.IPoint

## @evidence contracts/development/design.md#principled-representation

Metres along the run's heading from the set frame's origin, and up from the floor.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The two coordinates the chain reads.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No lateral coordinate: the chain is the sagittal one.

## @evidence contracts/development/common.md#meaningful-documentation

States both axes and their unit.

# src/sport/sprintStartSetChain.ts#sprintStartSetChain.IProps

## @evidence contracts/development/design.md#principled-representation

Segment lengths in metres and included angles in degrees.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The two ends, four lengths and two angles the chain needs.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Every length is the body's own; the angles are the set's measured ones.

## @evidence contracts/development/common.md#meaningful-documentation

States each member's unit and meaning.

# src/sport/sprintStartSetChain.ts#sprintStartSetChain.ISet

## @evidence contracts/development/design.md#principled-representation

Two plane points in metres.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The hip feeds the rear block, the shoulders and both feed the seed's trunk.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Both lie on the one chain the measures define.

## @evidence contracts/development/common.md#meaningful-documentation

States both points.

# src/sport/sprintStartSetChain.ts#sprintStartSetChain

## @evidence contracts/development/implementation.md#principled-implementation

Forward kinematics of a planar three-link chain at two held included angles, and a bisection on its one remaining freedom.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One placement of the chain, one bracketing pass over the shank's elevations and one bisection per bracket.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A bracket is a sign change of the reach's miss; no elevation is taken where none reaches.

## @evidence contracts/development/implementation.md#efficient-algorithms

A fixed count of scalar placements: one pass of a degree's step over a quarter turn and fifty halvings per bracket.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Each placement is a handful of products; nothing is retained.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns two fresh points.

## @evidence contracts/development/common.md#meaningful-documentation

States the chosen root and the empty case.

# src/sport/sprintStartSetChain.ts#sprintStartSetChain.rear

## @evidence contracts/development/implementation.md#principled-implementation

The law of cosines for the leg's hip-to-ankle distance and Pythagoras for its run.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Two closed forms.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A height beyond the leg's reach returns none rather than a clamped place.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reads only its arguments.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

## @evidence contracts/development/common.md#meaningful-documentation

States the construction, units and the empty case.
