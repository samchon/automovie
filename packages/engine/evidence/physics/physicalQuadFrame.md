# src/physics/physicalQuadFrame.ts#physicalQuadFrame

## @evidence contracts/development/common.md#meaningful-documentation

States the frame mapping and what the namespace maps.

## @evidence contracts/development/design.md#principled-representation

IHMC's z-up frame as (x, y, z) = (Z, X, Y), a proper rotation, so the porters' left and right keep their sense.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by the quadruped plan, touchdown and the stance's demand.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Functions only.
# src/physics/physicalQuadFrame.ts#physicalQuadFrame.ihmc

## @evidence contracts/development/common.md#meaningful-documentation

States the mapping.

## @evidence contracts/development/implementation.md#principled-implementation

x forward is the world's z, y left the world's x, z up the world's y.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One literal.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

None.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

It retains nothing.
# src/physics/physicalQuadFrame.ts#physicalQuadFrame.world

## @evidence contracts/development/common.md#meaningful-documentation

States the inverse mapping.

## @evidence contracts/development/implementation.md#principled-implementation

The inverse of `ihmc`.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One literal.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

None.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

It retains nothing.
# src/physics/physicalQuadFrame.ts#physicalQuadFrame.quadrants

## @evidence contracts/development/common.md#meaningful-documentation

States the rule, its convention and when it gives none.

## @evidence contracts/development/implementation.md#principled-implementation

IHMC names legs by the robot's build; the authored stance names them here, front ahead of the endpoints' mean and left of it along +z, the stance's heading convention (`physicalBalanceStance`), which `body` shares, so the gait's sides and the crossover projection agree (main's Q7).

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The mean, one sign test per limb, one distinctness check.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A non-null assertion reads each limb's authored point by index; the cast-free record keeps a null prototype.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the four limbs.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

It reads one stance.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

It retains nothing.
# src/physics/physicalQuadFrame.ts#physicalQuadFrame.bones

## @evidence contracts/development/common.md#meaningful-documentation

States the inversion.

## @evidence contracts/development/implementation.md#principled-implementation

Each quadrant's bone, the quadrant map inverted.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One mapping.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The cast types the four-entry record `Object.fromEntries` builds from four distinct quadrants.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

It retains nothing.
# src/physics/physicalQuadFrame.ts#physicalQuadFrame.soles

## @evidence contracts/development/common.md#meaningful-documentation

States the soles' points.

## @evidence contracts/development/implementation.md#principled-implementation

IHMC's sole frames' origins are the feet's soles; each limb's support endpoint is this engine's, where it is now or where the authored motion puts it (the desired support, standing rule 3), mapped to IHMC's frame.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One point per quadrant.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

None.

## @evidence contracts/development/implementation.md#efficient-algorithms

Four readings.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

It reads one update.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

It retains nothing.
# src/physics/physicalQuadFrame.ts#physicalQuadFrame.body

## @evidence contracts/development/common.md#meaningful-documentation

States the body frame.

## @evidence contracts/development/implementation.md#principled-implementation

IHMC's `bodyZUpFrame` for the crossover projection: the root's position and its heading's yaw, the heading read as the stance's is.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One rotation, one angle.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A non-null assertion reads the root's authored target.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

It reads one update.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

It retains nothing.
# src/physics/physicalQuadFrame.ts#physicalQuadFrame.pivot

## @evidence contracts/development/common.md#meaningful-documentation

States the controller, its estimate, its setpoint and why the pivot is the pressure too.

## @evidence contracts/development/implementation.md#principled-implementation

201903 `QuadrupedBalanceManager.compute` l.297-322: the DCM estimate xi = c + v / omega driven by `physicalQuadrupedDcmController` to the plan's setpoint, with the generic quadruped's gains of 2 from its force controller's parameter file (`simulation_force_controller.xml` l.99-101, loaded by `GenericQuadrupedModelFactory` l.100-107; standing rules 1 and 5).

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The estimate, the controller, the point back on the floor.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

None; the authored capture point at rest serves a demand given no plan.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

It reads one update.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

It retains nothing.
