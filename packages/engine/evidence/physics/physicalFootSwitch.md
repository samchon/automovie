# src/physics/physicalFootSwitch.ts#physicalFootSwitch

## @evidence contracts/development/common.md#meaningful-documentation

States the touchdown rule, the filters, the minimum force for a centre of pressure, the disabled distance and that each window keeps the reference's time.

## @evidence contracts/development/implementation.md#principled-implementation

A port of IHMC's develop `WrenchBasedFootSwitch.update` (l.145-199) with its filter windows (l.121-129) and minimum force (l.37), and Zulu's thresholds (ZuluWalkingControllerParameters l.814-816). The centre of pressure's signed distance into the outline is Euclid's `signedDistance` (`physicalPlanarPolygon`). The header records the version mix: the class and its Zulu values are develop's, the rest of the push recovery 201903's. Each window is its count of the reference controller's updates over Zulu's period, in this controller's updates (`physicalGlitchFilter.ticks`, main's Q9).

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The low force, the high force, the centre-of-pressure test and the output, each one filter update, in the reference's order.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No casts or non-null assertions; every constant is the reference's, cited at its declaration.

## @evidence contracts/development/implementation.md#efficient-algorithms

One signed distance over the outline's edges per update.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

It advances one state by one update.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

It retains nothing; the caller owns the state.

# src/physics/physicalFootSwitch.ts#physicalFootSwitch

## @evidence contracts/development/common.md#meaningful-documentation

Documents the switch's state, thresholds and constants.

## @evidence contracts/development/design.md#principled-representation

The reference's three glitch filters and its three thresholds, newtons and metres.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Owned here; read by the touchdown phase.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No optional members in the state; the thresholds are partial only as the caller's override of Zulu's.

# src/physics/physicalFootSwitch.ts#physicalFootSwitch.IState

## @evidence contracts/development/common.md#meaningful-documentation

Documents each filter's meaning.

## @evidence contracts/development/design.md#principled-representation

The low-force, centre-of-pressure and output filters of the reference.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Built by the switch and kept in the recovery state.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

All members required.

# src/physics/physicalFootSwitch.ts#physicalFootSwitch.IThresholds

## @evidence contracts/development/common.md#meaningful-documentation

Documents each threshold with its unit and the disabled distance.

## @evidence contracts/development/design.md#principled-representation

The factory's contact, second contact and centre-of-pressure thresholds.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by the switch; Zulu's values are the default.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

All members required.

# src/physics/physicalFootSwitch.ts#physicalFootSwitch.initial

## @evidence contracts/development/common.md#meaningful-documentation

States that every filter starts false.

## @evidence contracts/development/implementation.md#principled-implementation

The reference's filters are constructed false (201903 GlitchFilteredYoBoolean l.65).

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One literal.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

None.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

It builds one value.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

It retains nothing.

# src/physics/physicalFootSwitch.ts#physicalFootSwitch.reset

## @evidence contracts/development/common.md#meaningful-documentation

States which filter is cleared and when the reference resets it.

## @evidence contracts/development/implementation.md#principled-implementation

The reference's `reset()` (l.213-217), called on entering single support.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One copy with the centre-of-pressure filter set false.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

None.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

It builds one value.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

It retains nothing.
