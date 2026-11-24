# src/sound/masterProductionSound.ts#masterProductionSound

## @evidence contracts/development/common.md#meaningful-documentation

The comment states where the targets come from, the static gain, the limiter and its settings, why the gain is solved, the 0.01 LU stop and its origin, the four-correction bound, the refusal and the unchanged silent mix.

## @evidence contracts/development/implementation.md#principled-implementation

Loudness normalization followed by true-peak limiting. Limiting can only lower loudness, and it does so only where the limiter acts, so the limited loudness is a nondecreasing function of the static gain; adding each miss to the gain is a fixed-point iteration that converges when limiting touches a small share of the gated blocks, the film case. The result is re-measured from its own samples and refused outside the tolerance, so a master whose crest exceeds what the ceiling allows is never delivered silently off target.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Structure: `renderProductionSound` owns placement and dialogue levelling; this function owns the master stage, so mix tests observe placement without a master and the route always masters what it delivers.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The stop of 0.01 LU is a tenth of the 0.1 LU resolution EBU Tech 3341 asks of a meter; the bound of four corrections refuses rather than loops. Neither is tuned to a case.

## @evidence contracts/development/implementation.md#efficient-algorithms

Each attempt is linear in samples: a copy with gain, the limiter's passes and one meter pass. Speech-led mixes converge in one or two attempts; the bound caps the cost at five.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The mix's loudness is measured once; each attempt reuses the one output buffer.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

It allocates one master buffer the size of the mix, returned to the caller, and releases the limiter's and meters' scratch on return or throw.
