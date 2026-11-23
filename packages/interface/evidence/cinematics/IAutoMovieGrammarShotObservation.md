# src/cinematics/IAutoMovieGrammarShotObservation.ts#IAutoMovieGrammarShotObservation

## @evidence contracts/development/design.md#principled-representation

Every check reads only these observations: shot size from the primary subject's projected occupancy at both boundaries, cuts from the outgoing end and incoming start, and the action-axis side from the sign of the horizontal cross product; subjects are sorted and axis endpoints ordered by id before any check, so enumeration order cannot change the result.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Holds both boundary cameras, the subjects and the three editorial claims the checks compare against, so the analyzer never reads a scene, clip or contract and stays a pure function of this data.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A missing claim is stated as null and disables only the checks that need it, rather than being filled with a default framing, subject or axis.

## @evidence contracts/development/common.md#meaningful-documentation

States the producer and its sampling instants, the failure effect of each malformed field, the units, which checks each nullable field disables, and that subject and axis order carry no meaning.
