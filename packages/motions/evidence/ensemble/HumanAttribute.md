# src/ensemble/HumanAttribute.ts#HumanAttribute.stream

## @evidence contracts/development/common.md#meaningful-documentation

States the key and what may be drawn.

## @evidence contracts/development/implementation.md#principled-implementation

A counter-based stream (Philox through `createAutoMovieRandom`) on a seed derived from stable ids, so streams are independent by construction.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One key derivation and one stream.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The index is an identity, never an order consumed.

## @evidence contracts/development/implementation.md#efficient-algorithms

One hash of the key.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function of its key.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/ensemble/HumanAttribute.ts#HumanAttribute.draw

## @evidence contracts/development/common.md#meaningful-documentation

States the shapes, the clip and the refusals.

## @evidence contracts/development/implementation.md#principled-implementation

A normal by Box-Muller (`HumanSkill.normal`), or a uniform of half-width sqrt(3) times the spread so its standard deviation is the spread; clipped to the attribute's range.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Validate, draw, clip.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The clip is the range's own, stated on the distribution; a spread of 0 returns the mean exactly.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant time, two stream reads.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function of its key.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/ensemble/HumanAttribute.ts#HumanAttribute.effect

## @evidence contracts/development/common.md#meaningful-documentation

States the reading and the absent case.

## @evidence contracts/development/implementation.md#principled-implementation

Linear interpolation between the two stated ends, the simplest reading two ends fix.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One expression.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The neutral value is the caller's, named at its reading.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant time.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.
