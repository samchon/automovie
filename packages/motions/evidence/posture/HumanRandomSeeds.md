# src/posture/HumanRandomSeeds.ts#HumanRandomSeeds.IState

## @evidence contracts/development/common.md#meaningful-documentation

words: the engine's 24 words (__x_). carry: its carry (__c_). index: the next word's index (__i_).

## @evidence contracts/development/design.md#principled-representation

Exactly the state of the C++ standard's subtract_with_carry_engine as libc++ holds it, owned by the caller instead of OMPL's process-wide singleton.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: posture/HumanArmConnect.ts (connect).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Nothing derived or cached; a draw only advances it.

# src/posture/HumanRandomSeeds.ts#HumanRandomSeeds.create

## @evidence contracts/development/common.md#meaningful-documentation

States the first seed and the generator.

## @evidence contracts/development/implementation.md#principled-implementation

OMPL's RNGSeedGenerator::setSeed seeds a std::ranlux24_base (RandomNumbers.cpp lines 51-112 at 340bd214, BSD-3-Clause); its seed() is ported from libc++ subtract_with_carry_engine.h (llvm-project @93b1f81e03ef, Apache-2.0 WITH LLVM-exception): a linear_congruential_engine<uint_fast32_t, 40014, 0, 2147483563> seeded with the value draws the 24 words, each masked to 24 bits; the carry is set where the last word is 0. The first seed is the engine's default_seed, 19780503.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One loop of 24 draws.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The engine's and its seeding engine's constants only.

## @evidence contracts/development/implementation.md#efficient-algorithms

24 steps.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each call builds a new generator.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The caller owns the state.

# src/posture/HumanRandomSeeds.ts#HumanRandomSeeds.next

## @evidence contracts/development/common.md#meaningful-documentation

States the generator and the local seed.

## @evidence contracts/development/implementation.md#principled-implementation

RNGSeedGenerator::nextSeed: std::uniform_int_distribution<>(1, 1000000000) over the engine, its draw libc++'s uniform_int_distribution::operator() over __independent_bits_engine (uniform_int_distribution.h at the same commit), the engine step libc++'s subtract_with_carry_engine::operator().

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The range's bit count, then independent-bits draws rejected above the range, each a private port.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The library's constants only.

## @evidence contracts/development/implementation.md#efficient-algorithms

A few engine steps per seed on average.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Nothing to share.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Advances the caller's state.
