# src/sport/MartialArtStanceForms.ts#MartialArtStanceForms.Kind

## @evidence contracts/development/common.md#meaningful-documentation

Names the linked phrases the stance phrase authors.

## @evidence contracts/development/design.md#principled-representation

The interface's martial-art kinds less the three single-pose kinds the martial-art law plans elsewhere.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by `MartialArtStancePhrase` only; the martial-art kind is the interface's.

## @evidenceExclude contracts/development/design.md#prohibited-design-shortcuts

A subset of the interface's literal union; no shape of its own.

# src/sport/MartialArtStanceForms.ts#MartialArtStanceForms.IForm

## @evidence contracts/development/common.md#meaningful-documentation

Each member states its quantity and unit.

## @evidence contracts/development/design.md#principled-representation

Strides and lifts in statures, knee bends and turns in degrees, durations in seconds before manner scaling, weight shares as fractions of the stance span; every value is provisional blocking.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by `MartialArtStancePhrase` only; the martial-art kind is the interface's.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The two optional members default as their docs state (a 0.025 stature lift, a step along the line); no combination of them is meaningless.

# src/sport/MartialArtStanceForms.ts#MartialArtStanceForms.Carriage

## @evidence contracts/development/common.md#meaningful-documentation

Names each form's arm carriage.

## @evidence contracts/development/design.md#principled-representation

Karate's chamber, tai chi's open palms, or a held guard.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by `MartialArtStancePhrase` only; the martial-art kind is the interface's.

## @evidenceExclude contracts/development/design.md#prohibited-design-shortcuts

A closed literal union of the carriages the phrase implements.

# src/sport/MartialArtStanceForms.ts#MartialArtStanceForms.GuardCarriage

## @evidence contracts/development/common.md#meaningful-documentation

Names the held fighting guards.

## @evidence contracts/development/design.md#principled-representation

The high, low and centreline guards whose hand sites `GUARDS` holds.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by `MartialArtStancePhrase` only; the martial-art kind is the interface's.

## @evidenceExclude contracts/development/design.md#prohibited-design-shortcuts

A closed literal union keyed by `GUARDS`.

# src/sport/MartialArtStanceForms.ts#MartialArtStanceForms.IGuardSite

## @evidence contracts/development/common.md#meaningful-documentation

Each member states its unit and reference.

## @evidence contracts/development/design.md#principled-representation

A hand's site in its shoulder's frame: inward in shoulder half widths, up in upper-arm lengths, forward in whole-arm lengths.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by `MartialArtStancePhrase` only; the martial-art kind is the interface's.

## @evidenceExclude contracts/development/design.md#prohibited-design-shortcuts

Three required scalars; no optional combination arises.

# src/sport/MartialArtStanceForms.ts#MartialArtStanceForms.IGuard

## @evidence contracts/development/common.md#meaningful-documentation

Each member states which hand it places.

## @evidence contracts/development/design.md#principled-representation

The lead and rear hands' sites of one held guard.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by `MartialArtStancePhrase` only; the martial-art kind is the interface's.

## @evidenceExclude contracts/development/design.md#prohibited-design-shortcuts

Two required sites; no optional combination arises.
