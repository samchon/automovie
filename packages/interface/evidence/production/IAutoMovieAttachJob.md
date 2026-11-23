# src/production/IAutoMovieAttachJob.ts#IAutoMovieAttachJob

## @evidence contracts/development/design.md#principled-representation

Pairs the narrowed action with its position in the shot's action list, so the coupling stage can stamp handoff events with the authoring index without searching the list again.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Two fields, the action narrowed to the `attachTo` verb so its parent, bone and optional offset are typed, and its index; the validation outcome is implied by the record's existence rather than carried as a flag.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Jobs exist only for actions that passed the child, parent, rig, bone and optional offset checks, so the baker's lookups of the parent node and skeleton rely on that validation rather than on a fallback.

## @evidence contracts/development/common.md#meaningful-documentation

States the producer and the checks that precede a job, the consumer, and how a child's jobs are ordered including ties.
