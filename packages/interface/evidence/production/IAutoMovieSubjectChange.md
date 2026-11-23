# src/production/IAutoMovieSubjectChange.ts#IAutoMovieSubjectChange

## @evidence contracts/development/design.md#principled-representation

Stable subject identity pairs before and after descriptions; addition has only after, removal only before, and common placement or shape changes retain both alongside independently derived fanout counts.

## @evidence contracts/development/design.md#minimal-and-owned-surface

One change record serves all structural categories while the containing diff defines the category, avoiding a dense per-instance change array for prototype consequences.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A common subject can appear in both moved and reshaped categories when both responsibilities changed; null is reserved for absence rather than failed measurement disguised as deletion.

## @evidence contracts/development/common.md#meaningful-documentation

Defines stable id and kind, addition/removal null semantics and aggregate placement/selection consequences.
