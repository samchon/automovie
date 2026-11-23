# src/audit/AutoMovieMotionHumanAuditTiming.ts#AutoMovieMotionHumanAuditTiming.faults

## @evidence contracts/development/common.md#meaningful-documentation

States the input's order and the line format.

## @evidence contracts/development/implementation.md#principled-implementation

A positive finite duration; start, entry and end in order and within the plan's length; no action entered before the one before it ends; event shares in [0, 1] under unique names; windows with `0 <= from <= to <= 1`; a decisive or feigned instant inside the action, never both.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

A flat list of rules over each span.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Comparisons are written so that a value that is not a number fails them.

## @evidence contracts/development/implementation.md#efficient-algorithms

One pass; names are checked through a set.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure reading.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/audit/AutoMovieMotionHumanAuditTiming.ts#AutoMovieMotionHumanAuditTiming.instant

## @evidence contracts/development/common.md#meaningful-documentation

States the unit and the failure.

## @evidence contracts/development/implementation.md#principled-implementation

A share is of the plan's duration from the action's own start.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One lookup and one product.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A missing event throws; no default instant stands in.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

A linear search of a handful of events.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure reading.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/audit/AutoMovieMotionHumanAuditTiming.ts#AutoMovieMotionHumanAuditTiming.order

## @evidence contracts/development/common.md#meaningful-documentation

States the inputs, the line per fault and how equal instants are read.

## @evidence contracts/development/implementation.md#principled-implementation

Consecutive shares are compared, which orders the whole list.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One pass that remembers the last found event.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A missing event is a fault, not skipped.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

A handful of events.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure reading.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/audit/AutoMovieMotionHumanAuditTiming.ts#AutoMovieMotionHumanAuditTiming.shared

## @evidence contracts/development/common.md#meaningful-documentation

States the property with examples, the unit and the failure.

## @evidence contracts/development/implementation.md#principled-implementation

Both instants are read in film seconds, the one clock two people share.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Two instants and their difference.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No tolerance here; the caller's limit judges.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reads each instant through `instant`.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Two lookups.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.
