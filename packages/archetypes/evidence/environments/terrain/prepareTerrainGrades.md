# src/environments/terrain/prepareTerrainGrades.ts#prepareTerrainGrades

## @evidence contracts/development/implementation.md#principled-implementation

A nearest-segment projection grades each path across its stated width. Landing lengths reserve half a path width where possible while leaving half a segment for any rise. Polygon membership and edge distances govern the pad shoulder. A smoothstep taper with zero endpoint derivative blends the graded heights into the base.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Resolves plan geometry and hard heights once before baking. The sampling owner chooses lattice density and checks resulting route support.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Fixed constraints are named and never resolved by author order when incompatible. Grade widths and slopes are parameter-driven. Simultaneous path influence is averaged where corridors overlap, then graded-path admission checks every declared slope and pinned waypoint on the baked field.

## @evidence contracts/development/common.md#meaningful-documentation

Gives world and local frames, width and landing behavior, hard grade premise and returned field ownership.

## @evidence contracts/development/implementation.md#efficient-algorithms

Preparation compares pad polygon pairs and projects each path waypoint onto the applicable pad or base. A sample visits at most the sum of outline edges and path segments, storing no sample grid.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Resolved frames, waypoint heights, radii and segment lengths are shared between every sample, route publication and vegetation clearance. A different placed recipe gets a fresh plan.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The returned evaluator retains only the current resolved plan and borrowed base callback. It acquires no host resources or background task.
