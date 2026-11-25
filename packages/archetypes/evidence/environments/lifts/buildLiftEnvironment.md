# src/environments/lifts/buildLiftEnvironment.ts#buildLiftEnvironment

## @evidence contracts/development/implementation.md#principled-implementation

Reuses the accessible-car geometry and slider travels. It cuts the same rectangular aperture at each admitted sill, keeps its front wall outside the moving leaf, and locates each landing slab and affordance from its gap and depth. This is a kinematic stage, not a lift design or collision certificate.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Builds the shaft and moving cab once, then derives each landing's pieces and logical station in one pass. Timing lives with the clip builder.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Requires real leaf clearance from the original model and attaches call buttons only to fixed landings. Generated split models make no synthetic mass claim from the original assembled body.

## @evidence contracts/development/implementation.md#efficient-algorithms

Uses O(F) models, positions, supports and state records for F stops, plus the wall kernel's opening partition cost. Model parts and materials are borrowed across repeated stock members.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Geometry, stop positions and declared clearances are shared by the stage, build record and clip consumers. An independent placement creates new instance ids.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Outputs plain geometry and prop arrays bounded by the stop count and wall tessellation, and opens no host resources.

## @evidence contracts/development/common.md#meaningful-documentation

Explains the model source, fixed and moving members, coordinate policy and connection owner.
