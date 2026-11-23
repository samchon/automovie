# src/fluid/fluidDomainBudget.ts#fluidDomainBudget

## @evidence contracts/development/implementation.md#principled-implementation

Closed-form counts over the lattice and emitters: cells as `columns·rows`, faces from the Arakawa C staggering of one extra face along each crossed axis, bytes as eight per stored real, worst-case updates as cells times the step budget, and the Courant number from the shared `fluidCourantNumber`.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

A pure derivation into the interface's flat budget record, leaving refusal thresholds to the validator, so the report and the gate share inputs without sharing a policy.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Counts declared dimensions and caps without fixture tables or measured-runtime claims; the byte and update estimates deliberately omit overhead, scratch and repeated-call work as documented.

## @evidence contracts/development/common.md#meaningful-documentation

States admission ownership, the actual render-report fields consumed, omitted storage/work and the unvalidated-arithmetic limitation.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant arithmetic plus one pass over the declared spray emitters, at most `FLUID_MAX_SPRAYS` on a validated domain; no array of the lattice is read.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

One derivation per call; the render measurement asks once per bound water body.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns a fresh fixed-size record and retains nothing.
