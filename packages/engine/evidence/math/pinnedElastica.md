# src/math/pinnedElastica.ts#pinnedElastica.chord

## @evidence contracts/development/common.md#meaningful-documentation

States the closed form and the parameter's range.

## @evidence contracts/development/implementation.md#principled-implementation

Timoshenko and Gere 1961, Theory of Elastic Stability, §2.7, and Love 1927, §263: the first-mode elastica of a rod pinned at both ends: the chord''s share of the arc is `2 E(m) / K(m) - 1`, the integrals by `EllipticFunctions`.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One closed form.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No clamp; the integrals throw outside their domain.

## @evidence contracts/development/implementation.md#efficient-algorithms

Two integrals; constant work.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function of one number.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.
# src/math/pinnedElastica.ts#pinnedElastica.parameter

## @evidence contracts/development/common.md#meaningful-documentation

States the inverse, its bracket, the straight case and the refusal.

## @evidence contracts/development/implementation.md#principled-implementation

Timoshenko and Gere 1961, Theory of Elastic Stability, §2.7, and Love 1927, §263: the first-mode elastica of a rod pinned at both ends: the chord''s share falls monotonically from 1 as `m` grows, so its inverse is the one root of `chord(m) - ratio` in the bracket, found by the engine''s `bracketedRoot` (Dowell and Jarratt''s Illinois rule).

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The straight case, the reachable bound, one bracketed root.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A share no shape reaches below `HIGHEST` throws instead of returning the bracket's end.

## @evidence contracts/development/implementation.md#efficient-algorithms

One bracketed root at superlinear order, each step two integrals.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function of one number; it reuses `bracketedRoot` rather than a second root finder.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.
# src/math/pinnedElastica.ts#pinnedElastica.slope

## @evidence contracts/development/common.md#meaningful-documentation

States the closed form, its sign and the straight case.

## @evidence contracts/development/implementation.md#principled-implementation

Timoshenko and Gere 1961, Theory of Elastic Stability, §2.7, and Love 1927, §263: the first-mode elastica of a rod pinned at both ends: the tangent''s angle from the chord is `2 arcsin(k sn(K (1 - 2 s / L) | m))`.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One closed form.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The straight rod reads zero; no other case is special.

## @evidence contracts/development/implementation.md#efficient-algorithms

One integral and one Jacobian elliptic function; constant work.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function of two numbers.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.
# src/math/pinnedElastica.ts#pinnedElastica.curvature

## @evidence contracts/development/common.md#meaningful-documentation

States the closed form and where it holds.

## @evidence contracts/development/implementation.md#principled-implementation

Timoshenko and Gere 1961, Theory of Elastic Stability, §2.7, and Love 1927, §263: the first-mode elastica of a rod pinned at both ends: the curvature, the slope's derivative along the arc, is `(4 k K / L) cn(K (1 - 2 s / L) | m)`, greatest at the middle where `cn` is 1.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One closed form.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No clamp.

## @evidence contracts/development/implementation.md#efficient-algorithms

One integral; constant work.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function of two numbers.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.