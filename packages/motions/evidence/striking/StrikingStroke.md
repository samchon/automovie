# src/striking/StrikingStroke.ts#StrikingStroke.impactShare

## @evidence contracts/development/common.md#meaningful-documentation

States the derivation, the domain, the range and the refusal.

## @evidence contracts/development/implementation.md#principled-implementation

The minimum-jerk speed profile solved in closed form for the later root of `u(1-u)` at the given share of the peak.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One validation and one closed form.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A share outside its domain throws; the discriminant is floored at zero only against rounding at a share of 1.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant time.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function of its input.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/striking/StrikingStroke.ts#StrikingStroke.delivery

## @evidence contracts/development/common.md#meaningful-documentation

States the units produced and the refusal.

## @evidence contracts/development/implementation.md#principled-implementation

A via unit to the chamber, a delivery unit aimed through the contact so the measured share of peak speed remains at it, and a correcting unit over the same span that lands the joint exactly on the contact point. With a peak speed, the unit lasts as long as a minimum-jerk unit over its length takes to peak at that speed (its peak is 1.875 times its mean speed), ending at the contact share, so the joint's own movement is as fast as measured while the delivery keeps its measured length; a delivery shorter than that unit keeps its whole span, and its peak then exceeds the given one.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Via, delivery and correction in order.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A non-positive span throws; a correction under 1e-12 m is omitted as rounding.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant time.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function of its input.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/striking/StrikingStroke.ts#StrikingStroke.create

## @evidence contracts/development/common.md#meaningful-documentation

States the causality kept and the memo.

## @evidence contracts/development/implementation.md#principled-implementation

Superposed minimum-jerk units for the paths, a recoil through the optional re-chamber on two overlapping units (Flash and Hogan's via-point fit), and a causal scan for the stop when none is resolved.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The recoil, the free path and the stop as closures, composed into the shown path.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

None; a nested read during a scan sees the free path, as documented in its comment.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the original ordered units per evaluation; every original duration/normalized-time admission remains, including inactive units. Actual path readers request position only, omitting unused derivative polynomials and velocity/acceleration/state records; the unchanged scan spends its samples once and speedup is unmeasured.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The scan's progress and found second retain their original memo policy. Each current tracker query's readonly units are spread directly into the path's own mutable combined list, avoiding a second intermediate copy without retaining or mutating the producer's units.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The closures hold the input and original scan state until stroke release. Current correction arrays are borrowed only while constructing operation-owned unit lists; no producer array, new time history or mutable scratch list is retained.
