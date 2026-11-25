# src/sport/scoreWaterPoloGoal.ts#scoreWaterPoloGoal

## @evidence contracts/development/common.md#meaningful-documentation

States the shot family, coordinate frames, authoritative end conditions, and output order.

## @evidence contracts/development/implementation.md#principled-implementation

A horizontal goal normal gives constant downrange speed on the drag-free engine flight. Solve for the entire sphere to clear the front plane, then read its centre through the engine.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Admit the fixed mouth once and check each live launch against it.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Never credit an aim point, reversed crossing, an undersized opening, or a crossing after actual capture or contact.

## @evidence contracts/development/implementation.md#efficient-algorithms

One calculation per resolved launch and one flight sample for a candidate crossing.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Uses the performance's existing flight, custody, collision and placement readers without another sweep.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Only the output cues leave the query.
