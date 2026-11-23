# src/terrain/climbStairsPrints.ts#climbStairsPrints.IPrint

## @evidence contracts/development/common.md#meaningful-documentation

States both members and their units.

## @evidence contracts/development/design.md#principled-representation

An ankle placement in world metres and a tread index.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The two fields the climb's schedule reads.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Built only by prepare.

# src/terrain/climbStairsPrints.ts#climbStairsPrints.IPrints

## @evidence contracts/development/common.md#meaningful-documentation

States each member.

## @evidence contracts/development/design.md#principled-representation

Per-foot leg placements, sole points about the ankle in the flight frame, and a memoized footprint reader.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The three members climbStairs.plan reads.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Read-only after preparation.

# src/terrain/climbStairsPrints.ts#climbStairsPrints.IStep

## @evidence contracts/development/common.md#meaningful-documentation

States both members.

## @evidence contracts/development/design.md#principled-representation

A foot and a tread index, 1 the first.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The two fields the climb's clock and prints read.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Built only by schedule.

# src/terrain/climbStairsPrints.ts#climbStairsPrints.schedule

## @evidence contracts/development/common.md#meaningful-documentation

States both patterns and the result.

## @evidence contracts/development/implementation.md#principled-implementation

Step-over-step alternates feet tread by tread; step-by-step brings both feet to each tread.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One loop per pattern.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Every tread is stepped in order.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the treads.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Built once per plan.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/terrain/climbStairsPrints.ts#climbStairsPrints.prepare

## @evidence contracts/development/common.md#meaningful-documentation

States the inputs, units and result.

## @evidence contracts/development/implementation.md#principled-implementation

A sole shorter than the tread less two edges is centred on it; a longer one keeps its heel or toe the edge from the nosing it would overhang, the landing having no far edge.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Leg placements, sole points, then one memoized footprint reader.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Every footprint follows from the flight's treads and the settled feet.

## @evidence contracts/development/implementation.md#efficient-algorithms

Each footprint is computed once per foot and tread.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Footprints are memoized by foot and tread.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The memo grows with the treads stepped and is released with the plan.
