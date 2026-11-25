# src/furniture/BedConstruction.ts#BedConstruction.PlatformKind

## @evidence contracts/development/common.md#meaningful-documentation

Names the admitted values of one place in the signature of platform.

## @evidence contracts/development/design.md#principled-representation

A closed union of the literal values the construction handles.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Only platform and its callers read this union.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

It admits no value the construction does not handle.

# src/furniture/BedConstruction.ts#BedConstruction.PlatformContact

## @evidence contracts/development/common.md#meaningful-documentation

Names the contact ids in the signature of platform.

## @evidence contracts/development/design.md#principled-representation

A closed union of the literal contact ids the construction builds.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Only platform and the named producers that call it read this union.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

It names no contact the construction does not build.

# src/furniture/BedConstruction.ts#BedConstruction.platform

## @evidence contracts/development/common.md#meaningful-documentation

Build a household bed or a mattress laid on the floor.

## @evidence contracts/development/implementation.md#principled-implementation

Use the widths and lengths of the admitted options. Lay the sleep surface and side seats on the mattress boundaries.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Resolve the saved dimensions and build the parts before returning the contacts.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The standalone mattress has no base or headboard. Beds use the same preserved authored proportions.

## @evidence contracts/development/implementation.md#efficient-algorithms

One to three boxes and three contacts.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The named producer and the historical selector share this construction.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Each call hands its model data to the caller and acquires no external resource.

# src/furniture/BedConstruction.ts#BedConstruction.HospitalContact

## @evidence contracts/development/common.md#meaningful-documentation

Names the contact ids in the signature of hospital.

## @evidence contracts/development/design.md#principled-representation

A closed union of the literal contact ids the construction builds.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Only hospital and the named producers that call it read this union.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

It names no contact the construction does not build.

# src/furniture/BedConstruction.ts#BedConstruction.hospital

## @evidence contracts/development/common.md#meaningful-documentation

Build a wheeled hospital bed with its patient surface, side seats, and siderails.

## @evidence contracts/development/implementation.md#principled-implementation

Place the litter, mattress and bars at their admitted heights. The caster wheels carry the base.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Resolve the saved dimensions and build the parts before returning the contacts.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Uses the existing flat patient surface and documented bands.

## @evidence contracts/development/implementation.md#efficient-algorithms

Eight solids and five contacts.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The named producer and the historical selector share this construction.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Each call hands its model data to the caller and acquires no external resource.

# src/furniture/BedConstruction.ts#BedConstruction.GurneyContact

## @evidence contracts/development/common.md#meaningful-documentation

Names the contact ids in the signature of gurney.

## @evidence contracts/development/design.md#principled-representation

A closed union of the literal contact ids the construction builds.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Only gurney and the named producers that call it read this union.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

It names no contact the construction does not build.

# src/furniture/BedConstruction.ts#BedConstruction.gurney

## @evidence contracts/development/common.md#meaningful-documentation

Build a stretcher on casters with a supported patient surface.

## @evidence contracts/development/implementation.md#principled-implementation

Place the litter top at its admitted height and the side seats at the mattress edges.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Resolve the saved dimensions and build the parts before returning the contacts.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Uses the existing measured patient support geometry and cascaded heights.

## @evidence contracts/development/implementation.md#efficient-algorithms

The fixed caster, litter and pad assembly.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The named producer and the historical selector share this construction.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Each call hands its model data to the caller and acquires no external resource.

# src/furniture/BedConstruction.ts#BedConstruction.CribContact

## @evidence contracts/development/common.md#meaningful-documentation

Names the contact ids in the signature of crib.

## @evidence contracts/development/design.md#principled-representation

A closed union of the literal contact ids the construction builds.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Only crib and the named producers that call it read this union.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

It names no contact the construction does not build.

# src/furniture/BedConstruction.ts#BedConstruction.crib

## @evidence contracts/development/common.md#meaningful-documentation

Build a crib with a mattress and graspable top rails.

## @evidence contracts/development/implementation.md#principled-implementation

Spans divide the interior into a series of individually modeled slats up to the rails.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Resolve the saved dimensions and build the parts before returning the contacts.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Keeps the measured crib dimensions and original slat spacing rule.

## @evidence contracts/development/implementation.md#efficient-algorithms

Work follows the number of slats required along the four rails.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The named producer and the historical selector share this construction.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Each call hands its model data to the caller and acquires no external resource.

# src/furniture/BedConstruction.ts#BedConstruction.BunkContact

## @evidence contracts/development/common.md#meaningful-documentation

Names the contact ids in the signature of bunk.

## @evidence contracts/development/design.md#principled-representation

A closed union of the literal contact ids the construction builds.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Only bunk and the named producers that call it read this union.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

It names no contact the construction does not build.

# src/furniture/BedConstruction.ts#BedConstruction.bunk

## @evidence contracts/development/common.md#meaningful-documentation

Build a bunk bed with two sleep surfaces and a graspable guard rail.

## @evidence contracts/development/implementation.md#principled-implementation

Pine posts support two mattresses. The lower mattress exposes side seats and the upper mattress has a rail.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Resolve the saved dimensions and build the parts before returning the contacts.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Uses the documented pine contact pair and existing fitted mattress sizes.

## @evidence contracts/development/implementation.md#efficient-algorithms

A constant number of supports, mattresses and rails.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The named producer and the historical selector share this construction.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Each call hands its model data to the caller and acquires no external resource.
