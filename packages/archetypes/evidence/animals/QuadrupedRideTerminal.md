# src/animals/QuadrupedRideTerminal.ts#QuadrupedRideTerminal.IEnd

## @evidence contracts/development/common.md#meaningful-documentation

The solver and the clearance in metres.

## @evidence contracts/development/design.md#principled-representation

The chain with its terminal direction constrained by a pose goal, and its endpoint height above the terminal's lowest surface.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Returned by a binding.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None.

# src/animals/QuadrupedRideTerminal.ts#QuadrupedRideTerminal.Binding

## @evidence contracts/development/common.md#meaningful-documentation

The orientation rotates the terminal's neutral axis; the normal is the support plane's, the nominal floor when absent.

## @evidence contracts/development/design.md#principled-representation

A function of the pose goal's terminal state.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Returned by `of`.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None.

# src/animals/QuadrupedRideTerminal.ts#QuadrupedRideTerminal.of

## @evidence contracts/development/common.md#meaningful-documentation

States the inputs, the output and the refusals.

## @evidence contracts/development/implementation.md#principled-implementation

Preserve the terminal axis; the clearance is the bar's upward share of its length plus its radius, the cylinder's rim radius scaled by the bar's share across the support normal.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One admission, one default support, one support per bound orientation.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The terminal radius is never ignored.

## @evidence contracts/development/implementation.md#efficient-algorithms

The neutral support is prepared once and reused.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses the exact limb owner's prepared chain.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Retains the prepared chain and the terminal shape.
