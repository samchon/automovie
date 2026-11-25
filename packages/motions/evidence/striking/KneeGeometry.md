# src/striking/KneeGeometry.ts#KneeGeometry.ILeg

## @evidence contracts/development/common.md#meaningful-documentation

Names hip-to-knee and knee-to-ankle directions, used by the unchanged knee swing.

## @evidence contracts/development/design.md#principled-representation

Two normalized canonical vectors describe the two original segment directions without another joint or limb solver.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The knee law interpolates these two directions between entry and contact.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Reuses interface vectors; no fitted target, success flag or altered segment length is represented.

# src/striking/KneeGeometry.ts#KneeGeometry.IGeometry

## @evidence contracts/development/common.md#meaningful-documentation

Defines target/turn, original entry/contact directions, stance slack and foot rotation in world metres/degrees.

## @evidence contracts/development/design.md#principled-representation

Extends the existing KneeReach solution with the actual carriage/key inputs the knee law already consumes.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Contains only the former lazy knee key's fields, including its original short/jammed status and interpolation endpoints.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Reuses the physical reach status and canonical vectors/quaternion, with no alternate outcome, resolved flag or relaxed support goal.

# src/striking/KneeGeometry.ts#KneeGeometry.solve

## @evidence contracts/development/common.md#meaningful-documentation

Defines canonical planning inputs, exact original look-back target read, actual carriage callback, world-frame key fields and the unsettled carriage's refusal.

## @evidence contracts/development/implementation.md#principled-implementation

Preserves original target aiming, patella radius, travel bound, heading wrap and initial stance hip; the carriage's hip is iterated as a fixed point until its move is within the limb solver's place tolerance, then entry/contact directions, stance slack and foot axes derive from the same geometry.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One synchronous numeric key owner serves the knee law's existing lazy geometry callback; the law alone retains/reset the completed original key.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Target time, lookup order, complete carriage lowering, solve limits, vector expression grouping and short/jammed status remain unchanged; no fixed pass count stands in for convergence, and a carriage that does not settle is refused.

## @evidence contracts/development/implementation.md#efficient-algorithms

One knee/carriage evaluation per pass until the hip settles. One local exact workspace and lazy genuine unchanged-table ROM mapper share only fixed prerequisites across those real reads; separation adds no numerical algorithm or measured speedup claim.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Within this one unchanged body/context calculation the explicit carriage and hip reads borrow the same exact workspace; changed postures still execute normally. The caller's original lazy settled-plan key is the only retained numeric result.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The local workspace, genuine ROM mapper and temporary posture/maps end on return or throw. Only the original key's numeric points/directions/status escape to the law, which clears it on settle and retains no reader or new time history.
