# src/core/ArchetypeFractureEnergy.ts#ArchetypeFractureEnergy

## @evidence contracts/development/common.md#meaningful-documentation

Derives the kinetic-energy constraint, states SI units, exact numeric comparison, refusal result and unsupported-energy meaning.

## @evidence contracts/development/implementation.md#principled-implementation

Cauchy-Schwarz makes a common velocity the minimum-energy momentum allocation. IEEE-754 binary64 significands and exponents exactly represent each nonnegative product in ||p||² <= 2ME; positive finite encodings are ordered integers, so bisection returns an admissible lower endpoint.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Admit numeric premises, return the zero-momentum bound without allocation, decompose nonzero inputs once, compare energy and search its representable lower bound only on refusal.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No energy margin, momentum cap, rescaling or missing dissipation model changes the input; this necessary bound does not model fracture work, a striker or a remainder's dynamics.

## @evidence contracts/development/implementation.md#efficient-algorithms

Three momentum squares and one budget product have a bit width bounded by binary64's exponent and significand ranges. A successful call does one exact comparison; a refusal adds one maximum-budget check and at most 63 bisection comparisons, independent of scene or fragment count.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

ArchetypeBinary64 shares the encoding owner with mass arithmetic. Nonzero momentum squares and mass are reused by every budget comparison; zero axes never enlarge the exact alignment span. One call-local view also serves bisection; no body or cross-call result is cached.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

One eight-byte view and fixed-count bounded integer terms are call-local; only the result's boolean and optional scalar escape, with no handle, task or retained input.
