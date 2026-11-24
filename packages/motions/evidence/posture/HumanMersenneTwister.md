# src/posture/HumanMersenneTwister.ts#HumanMersenneTwister.IState

## @evidence contracts/development/common.md#meaningful-documentation

words: the state vector, mt19937ar.c's `mt`. index: the next word's index, its `mti`.

## @evidence contracts/development/design.md#principled-representation

The two fields are exactly the reference code's state, held by the caller instead of file statics so each planner owns its sequence.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: posture/HumanArmConnect.ts (connect); posture/HumanArmPathSimplify.ts (smooth).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No field is derived or cached; a draw only advances them.

# src/posture/HumanMersenneTwister.ts#HumanMersenneTwister.create

## @evidence contracts/development/common.md#meaningful-documentation

States the seed and the state it returns.

## @evidence contracts/development/implementation.md#principled-implementation

`init_genrand` of Matsumoto and Nishimura's mt19937ar.c (BSD-3-Clause, Copyright (C) 1997 - 2002, Makoto Matsumoto and Takuji Nishimura), line for line: mt[0] = seed, mt[i] = 1812433253 · (mt[i-1] ^ (mt[i-1] >> 30)) + i, modulo 2^32.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One loop over the 624 words.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No value is chosen here: the multiplier and the length are the reference's.

## @evidence contracts/development/implementation.md#efficient-algorithms

624 words, once per generator.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each call builds a new generator; nothing is shared.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The caller owns the returned state.

# src/posture/HumanMersenneTwister.ts#HumanMersenneTwister.next

## @evidence contracts/development/common.md#meaningful-documentation

States the state it advances and the 32-bit word it returns.

## @evidence contracts/development/implementation.md#principled-implementation

`genrand_int32` of mt19937ar.c line for line: the 624-word twist with MATRIX_A, UPPER_MASK and LOWER_MASK when the index runs out, then the tempering by 11, 7 and 0x9d2c5680, 15 and 0xefc60000, 18.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One twist per 624 draws, then one tempering per draw.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The reference's constants only.

## @evidence contracts/development/implementation.md#efficient-algorithms

Amortised O(1) per draw.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A draw reads the caller's state only.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Advances the caller's state in place; allocates nothing.

# src/posture/HumanMersenneTwister.ts#HumanMersenneTwister.uniform01

## @evidence contracts/development/common.md#meaningful-documentation

States the draw's interval and its two outputs.

## @evidence contracts/development/implementation.md#principled-implementation

OMPL's `RNG::uniform01` (src/ompl/util/RandomNumbers.h at commit 340bd214be6e87fe758a75e04203d665429b020f, BSD-3-Clause) is `std::uniform_real_distribution<>(0, 1)` over `std::mt19937`, whose double the C++ standard's `generate_canonical` forms from two 32-bit outputs, the first the low word: (g0 + g1 · 2^32) / 2^64, the largest double under 1 where that rounds to 1.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Two `next` calls and one division.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No tolerance: the clamp is the standard's own guarantee of a half-open interval.

## @evidence contracts/development/implementation.md#efficient-algorithms

O(1).

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Nothing to share.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Allocates nothing.

# src/posture/HumanMersenneTwister.ts#HumanMersenneTwister.uniformReal

## @evidence contracts/development/common.md#meaningful-documentation

States the interval and the draw.

## @evidence contracts/development/implementation.md#principled-implementation

OMPL's `RNG::uniformReal`: (upper - lower) · uniform01 + lower.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One expression.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

None.

## @evidence contracts/development/implementation.md#efficient-algorithms

O(1).

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Nothing to share.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Allocates nothing.

# src/posture/HumanMersenneTwister.ts#HumanMersenneTwister.uniformInt

## @evidence contracts/development/common.md#meaningful-documentation

States the inclusive interval and the draw.

## @evidence contracts/development/implementation.md#principled-implementation

OMPL's `RNG::uniformInt` (RandomNumbers.h lines 79-83): the floor of uniformReal(lower, upper + 1), the upper bound where it rounds above it.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One expression and a clamp, as OMPL's.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

None.

## @evidence contracts/development/implementation.md#efficient-algorithms

O(1).

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Nothing to share.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Allocates nothing.
