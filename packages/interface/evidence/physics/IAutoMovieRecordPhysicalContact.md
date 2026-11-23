# src/physics/IAutoMovieRecordPhysicalContact.ts#IAutoMovieRecordPhysicalContact.IInput

## @evidence contracts/development/common.md#meaningful-documentation

One measured solver contribution and the mutable episode collections it updates.

## @evidence contracts/development/design.md#principled-representation

seconds is the completed native instant, dt its positive duration in seconds, impulse N s, point world metres and separation signed metres.

## @evidence contracts/development/design.md#minimal-and-owned-surface

recordPhysicalContact mutates contacts, active, found and any active receipt in place, returning that shared receipt. It copies new endpoint identifiers and points and canonicalizes pair order.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The caller supplies admitted positive measured impulses and consistent times; the recorder does not validate them. Multiple contributions at the same instant merge and use an impulse-weighted point.
