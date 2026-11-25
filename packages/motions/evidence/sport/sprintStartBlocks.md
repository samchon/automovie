# src/sport/sprintStartBlocks.ts#sprintStartBlocks.IPlaced

## @evidence contracts/development/common.md#meaningful-documentation

States both members and their frame.

## @evidence contracts/development/design.md#principled-representation

A side and two world-frame foot placements whose soles lie on the plate faces.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The two values `athletics.plan` passes on to `sprintStartSet.of`.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Both feet are always present; a block without both plates is refused before this record exists.

# src/sport/sprintStartBlocks.ts#sprintStartBlocks

## @evidence contracts/development/common.md#meaningful-documentation

Names the scene transform, optional side, returned contacts and every refusal.

## @evidence contracts/development/implementation.md#principled-implementation

Composes each pedal's placed frame, takes its +Y as the face normal, and seats the ball of the foot at the middle of the face's lower edge, the sole on the face at the normal's heading and pitch, the toes on the track as a crouch start sets them. The front plate's side of the lane decides the front foot.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Read both plates, order them in the runner's frame, then place each sole.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Missing, sideways or reversed plates and a contrary front side are refused before the set fit; the set fit still owns reach and joint ranges.

## @evidence contracts/development/implementation.md#efficient-algorithms

Two affordance lookups, two rigid transforms and two foot placements per plan.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reads the prop's frame once and delegates each rigid sole placement to HumanFoot.pivot.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains only the two numeric placements it returns.

# src/sport/sprintStartBlocks.ts#sprintStartBlocks.scaled

## @evidence contracts/development/common.md#meaningful-documentation

States the placement, its frame and units.

## @evidence contracts/development/implementation.md#principled-implementation

The ball pivot on the floor under the hip's lateral offset, pitched by the face angle (`HumanFoot.pivot`).

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One frame point and one pivot.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Every length is the body's.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each foot is placed once per set solve.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns a fresh placement.
