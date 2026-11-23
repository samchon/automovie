# src/props/PracticalLightConstruction.ts#PracticalLightConstruction.PendantContact

## @evidence contracts/development/common.md#meaningful-documentation

Names the contact ids in the signature of pendant.

## @evidence contracts/development/design.md#principled-representation

A closed union of the literal contact ids the construction builds.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Only pendant and the named producers that call it read this union.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

It names no contact the construction does not build.

# src/props/PracticalLightConstruction.ts#PracticalLightConstruction.pendant

## @evidence contracts/development/common.md#meaningful-documentation

Build a suspended lamp with a downward light frame.

## @evidence contracts/development/implementation.md#principled-implementation

Hang the cord from the origin and place the light along the shade's downward axis.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Resolve the saved dimensions and build the parts before returning the contacts.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The published shade and cord dimensions are retained. The socket locates a renderer-owned light.

## @evidence contracts/development/implementation.md#efficient-algorithms

Two solids and three contacts.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The named producer and the historical selector share this construction.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Each call hands its model data to the caller and acquires no external resource.

# src/props/PracticalLightConstruction.ts#PracticalLightConstruction.StandingKind

## @evidence contracts/development/common.md#meaningful-documentation

Names the admitted values of one place in the signature of standing.

## @evidence contracts/development/design.md#principled-representation

A closed union of the literal values the construction handles.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Only standing and its callers read this union.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

It admits no value the construction does not handle.

# src/props/PracticalLightConstruction.ts#PracticalLightConstruction.StandingContact

## @evidence contracts/development/common.md#meaningful-documentation

Names the contact ids in the signature of standing.

## @evidence contracts/development/design.md#principled-representation

A closed union of the literal contact ids the construction builds.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Only standing and the named producers that call it read this union.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

It names no contact the construction does not build.

# src/props/PracticalLightConstruction.ts#PracticalLightConstruction.standing

## @evidence contracts/development/common.md#meaningful-documentation

Build a standing lamp with its source inside the shade.

## @evidence contracts/development/implementation.md#principled-implementation

Calculate the stem upward from the base, place the elected shade around the holder and distribute the two measured masses.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Resolve the saved dimensions and build the parts before returning the contacts.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The base and stem dimensions describe model geometry. The socket locates a renderer-owned light.

## @evidence contracts/development/implementation.md#efficient-algorithms

Three solids and two contacts.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The named producer and the historical selector share this construction.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Each call hands its model data to the caller and acquires no external resource.

# src/props/PracticalLightConstruction.ts#PracticalLightConstruction.LanternContact

## @evidence contracts/development/common.md#meaningful-documentation

Names the contact ids in the signature of lantern.

## @evidence contracts/development/design.md#principled-representation

A closed union of the literal contact ids the construction builds.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Only lantern and the named producers that call it read this union.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

It names no contact the construction does not build.

# src/props/PracticalLightConstruction.ts#PracticalLightConstruction.lantern

## @evidence contracts/development/common.md#meaningful-documentation

Build a raised-bail lantern with a standing base, grip and hanging hook.

## @evidence contracts/development/implementation.md#principled-implementation

The base supports the burner and globe. The handle and hook share the bail top.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Resolve the saved dimensions and build the parts before returning the contacts.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The documented fount and wire estimates fit the measured body, globe and extended height.

## @evidence contracts/development/implementation.md#efficient-algorithms

Six solids and three contacts.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The named producer and the historical selector share this construction.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Each call hands its model data to the caller and acquires no external resource.

# src/props/PracticalLightConstruction.ts#PracticalLightConstruction.WickKind

## @evidence contracts/development/common.md#meaningful-documentation

Names the admitted values of one place in the signature of wick.

## @evidence contracts/development/design.md#principled-representation

A closed union of the literal values the construction handles.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Only wick and its callers read this union.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

It admits no value the construction does not handle.

# src/props/PracticalLightConstruction.ts#PracticalLightConstruction.WickContact

## @evidence contracts/development/common.md#meaningful-documentation

Names the contact ids in the signature of wick.

## @evidence contracts/development/design.md#principled-representation

A closed union of the literal contact ids the construction builds.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Only wick and the named producers that call it read this union.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

It names no contact the construction does not build.

# src/props/PracticalLightConstruction.ts#PracticalLightConstruction.wick

## @evidence contracts/development/common.md#meaningful-documentation

Build a candle or a fictional torch body with a light frame at the wick or animated tip.

## @evidence contracts/development/implementation.md#principled-implementation

Match the shaft diameter and tip frame to the admitted dimensions. Keep the employed grip below the light.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Resolve the saved dimensions and build the parts before returning the contacts.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The wick and illuminated effect remain renderer bindings. Part colors apply only to the modeled body.

## @evidence contracts/development/implementation.md#efficient-algorithms

At most two solids and two contacts.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The named producer and the historical selector share this construction.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Each call hands its model data to the caller and acquires no external resource.
