# src/weapons/bowLimbs.ts#bowLimbs

## @evidence contracts/development/common.md#meaningful-documentation

States positive geometry, nonnegative triangle-limited travel, the rows' units, zero stroke and explicit numerical refusals.

## @evidence contracts/development/implementation.md#principled-implementation

A tip at `R` from the grip, `R` fixed, and the string's half `S` fixed: with the nock at `n` behind the grip, the tip's reach toward it is `c = (R^2 + n^2 - S^2) / (2 n)`, so the turn is `asin(c / R) - alpha`, `alpha` the braced tip's angle. The triangle requires n-R<=S. Rows bisect until the midpoint's linearly read string half differs from S by at most createBow.STRING; this midpoint criterion is the existing approximation, not a proof of the maximum between rows. Substituting R squared minus S squared equals brace squared gives the dimensionless ratio `(n/R + (brace/n)*(brace/R))/2`, avoiding every raw square and their cancellation without changing the geometric law.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Admit geometry, then evaluate turns and recursively bisect the interpolation table.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Impossible inputs and non-finite geometry are refused rather than clamped into asin or emitted as NaN rows. Stiff limbs and midpoint interpolation remain the declared prototype approximation; no material elasticity is invented.

## @evidence contracts/development/implementation.md#efficient-algorithms

Each accepted interval contributes one row and constant geometric work. Storage is linear in row count plus recursive subdivision depth; the producer's bounded bow dimensions yield a small table. No global finite-input row bound is claimed.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Only the returned table escapes; no input or external resource is retained.
