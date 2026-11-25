# src/physics/IAutoMovieAuditPhysicalOutcomes.ts#IAutoMovieAuditPhysicalOutcomes.IAction

## @evidence contracts/development/common.md#meaningful-documentation

An authored contact or miss to compare with measured shape-pair episodes.

## @evidence contracts/development/design.md#principled-representation

The finite nonnegative film second and tolerance define an inclusive timing window; shape lists are nonempty and names are nonblank.

## @evidence contracts/development/design.md#minimal-and-owned-surface

auditPhysicalOutcomes borrows this promise and requires matching body, shape and observation-source identities.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

admitPhysicalOutcomes checks the promise; a solver promise additionally needs a positive measured impulse at contact, so a geometric overlap alone cannot satisfy it.

# src/physics/IAutoMovieAuditPhysicalOutcomes.ts#IAutoMovieAuditPhysicalOutcomes.IFinding

## @evidence contracts/development/common.md#meaningful-documentation

One unsatisfied contact, miss or fall promise, or an unplanned measured episode.

## @evidence contracts/development/design.md#principled-representation

kind selects the failure meaning; seconds uses the film clock and missDistance uses metres or null for a fall.

## @evidence contracts/development/design.md#minimal-and-owned-surface

auditPhysicalOutcomes allocates mutable findings for its caller; actionId links a promise or the unexpected receipt.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A finding reports evidence rather than changing the performance; an empty findings array means only the supplied promises and receipts passed.

# src/physics/IAutoMovieAuditPhysicalOutcomes.ts#IAutoMovieAuditPhysicalOutcomes.IInput

## @evidence contracts/development/common.md#meaningful-documentation

Authored outcome promises and independent observations for a synchronous audit.

## @evidence contracts/development/design.md#principled-representation

All event times use the same nonnegative film-second clock; an absent observedFalls entry means that body has no observed fall.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The audit borrows arrays and calls missDistance only for a missing contact and allowUnplanned only for unused receipts; callback errors propagate and callbacks are not retained.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

admitPhysicalOutcomes validates windows, identities and receipt authority; missDistance must return a finite value. Empty populations are allowed and do not prove an unobserved performance.
