# src/physics/physicalBalanceStance.ts#physicalBalanceStance

## @evidence contracts/development/common.md#meaningful-documentation

States what the stance reads, when it is read and which phases share it.

## @evidence contracts/development/implementation.md#principled-implementation

The planted supports are the limbs not lifted, at their planted outlines; the pendulum's rate is sqrt(g / h) over the lowest planted point; the capture point's shift for rotation is `physicalStanceBalance.spin`; the swing's peak acceleration is the lesser of the policy's force over the heaviest leg less gravity and the hip's bound (`physicalStanceBalance.swingBound`); the tilt guard is `physicalStanceBalance.tipping` over the hip strategy's range (Stephens 2011, Table 4.1); the heading is the stance feet's latched turn (Pratt et al., M2V2, Section VII-C); the timing ramps over `physicalStanceBalance.FADE` (Herzog et al. 2016, Section 5.3).

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One reading of the stance, computed once per substep and shared by the plan and the swing, so both decide from the same support.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The tilt range is a stated constant; non-null assertions read the root's authored target, which the authored pose declares.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the limbs and the support patches' points; the inertia for the tilt guard is computed only when no landed foot is ramping in.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

It is rebuilt each substep from that substep's state and readings.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

It retains nothing beyond the returned stance.

# src/physics/physicalBalanceStance.ts#physicalBalanceStance.ITiming

## @evidence contracts/development/common.md#meaningful-documentation

Documents each part of a step's timing and its units.

## @evidence contracts/development/design.md#principled-representation

The fields `AutoMoviePhysicalBalance.assess` takes for a swing's timing.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Built by the stance and read by the plan and the swing.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No optional fields.

# src/physics/physicalBalanceStance.ts#physicalBalanceStance.IStance

## @evidence contracts/development/common.md#meaningful-documentation

Documents each reading of the stance.

## @evidence contracts/development/design.md#principled-representation

The stance's readings and the assessment function over them, so the plan and the swing ask the same question of the same support.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Every member is read by the plan or the swing.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Optional members are absent when the stance has no value for them.
