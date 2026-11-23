# src/film/classifyGrammarShotSize.ts#classifyGrammarShotSize

## @evidence contracts/development/implementation.md#principled-implementation

Compares `|log(1/occupancy) − log(fraction)|` across the four framings, because framings are a geometric scale of visible subject multiples and the boundary between two neighbours is their geometric mean; the domain check keeps the logarithm defined.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Classification only, separate from `measureGrammarShotSize`, which owns projection and axis choice, and reading the same fraction table the framing solve places cameras with, so a requested size and a measured size share one scale.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No framing is favoured beyond the stated first-listed tie rule, and no occupancy is clamped into range; a non-positive or non-finite one throws.

## @evidence contracts/development/common.md#meaningful-documentation

States the meaning and domain of the occupancy, which axis it comes from and why, the log-scale nearness with its effect on the boundaries, the tie rule, and the throw.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant time, one pass over the four-entry framing table.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure classification of one number that coordinates nothing across calls.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing; it returns one union member.
