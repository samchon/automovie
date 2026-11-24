# src/ensemble/manoeuvreSteered.ts#manoeuvreSteered

## @evidence contracts/development/common.md#meaningful-documentation

States its inputs, the steering pass's span and sampling, and the ways it returns.

## @evidence contracts/development/implementation.md#principled-implementation

The members walk from where they stand at the word to their slots through the crowd's own steering pass (`HumanCrowd.steer`), run for `HumanManoeuvre.SPAN` times the longest straight way's time at the slowest member's Froude walking speed, and each course is kept every `HumanManoeuvre.STEERED` seconds and ends on its slot.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One responsibility: the steered ways of a re-form, apart from the straight ways and the wheel.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The span and the kept step are the manoeuvre's named constants; the crowd pass is the shipped steering owner, unchanged.

## @evidence contracts/development/implementation.md#efficient-algorithms

One crowd steering pass over the members for the span; the kept samples are one filter per course.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses the crowd's steering owner; nothing is cached.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing after return or throw.
