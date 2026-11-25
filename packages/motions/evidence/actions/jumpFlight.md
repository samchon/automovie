# src/actions/jumpFlight.ts#jumpFlight.IFlight

## @evidence contracts/development/common.md#meaningful-documentation

Each member states its meaning and unit.

## @evidence contracts/development/design.md#principled-representation

The apex, the flight time and the centre's velocities at both ends.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Five members, all read by the jump.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The landing velocity is the take-off's under gravity, not set apart.

# src/actions/jumpFlight.ts#jumpFlight.solve

## @evidence contracts/development/common.md#meaningful-documentation

States each input, its unit, the result and the refusals.

## @evidence contracts/development/implementation.md#principled-implementation

The closed form of a drag-free projectile between two heights.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The apex, the refusal, then three closed forms.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A flight that cannot clear a raised landing is refused, never flown through it.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses `HumanBound` for the sign check.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

A pure function that retains nothing.
