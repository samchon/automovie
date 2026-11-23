# src/architecture/IAutoMovieAssemblyHost.ts#IAutoMovieAssemblyHost

## @evidence contracts/development/design.md#principled-representation

Carries nominal host depth for comparison with summed layer thickness under a fixed absolute `1e-9` m tolerance. This is the contract's accepted discrepancy, not a scale-independent proof that every floating-point summation error is covered or every physical mismatch is rejected.

## @evidence contracts/development/design.md#minimal-and-owned-surface

A record rather than a bare number, so the optional `host` argument of the validator and the resolver says which dimension it carries, and omitting it is the single switch that skips the comparison.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The `1e-9` m slack is one named constant in `validateAutoMovieMaterialAssembly` applied to every assembly alike, and a non-finite or non-positive host depth is reported as a violation instead of being clamped.

## @evidence contracts/development/common.md#meaningful-documentation

States the two functions that read it, the equality it imposes and its tolerance, that an invalid host depth is itself a violation, that omitting `host` skips the check, and that the value is metres along the stacking axis.
