# src/motion/composition/IAutoMovieChain.ts#IAutoMovieChain

## @evidence contracts/development/common.md#meaningful-documentation

Explains shared-node ownership, subclass-preserving results and deferred schedule admission.

## @evidence contracts/development/design.md#principled-representation

A readonly node reference and polymorphic combinators express persistent composition building without asserting deep immutability.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Interface owns the public chain view implemented by AutoMovieChain; construction and protected derivation remain implementation details.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Sequence and parallel building consume the existing Part union and add no action vocabulary or implementation dependency.
