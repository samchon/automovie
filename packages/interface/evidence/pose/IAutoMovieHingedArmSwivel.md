# src/pose/IAutoMovieHingedArmSwivel.ts#IAutoMovieHingedArmSwivel.IStop

## @evidence contracts/development/common.md#meaningful-documentation

Defines the allowed hinge angle and unsigned radial shortfall.

## @evidence contracts/development/design.md#principled-representation

theta is radians and shortfall nonnegative metres between attained span and requested radius; legal reachable branches report zero.

## @evidence contracts/development/design.md#minimal-and-owned-surface

hingedArmSwivel.branches returns these stops for hinge-limit and geometric-shell selection.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A zero shortfall concerns radial geometry only and does not certify all joints' ROM or effector orientation.

# src/pose/IAutoMovieHingedArmSwivel.ts#IAutoMovieHingedArmSwivel.IPoseResult

## @evidence contracts/development/common.md#meaningful-documentation

Describes degree swivel input, bone-local output and shared lower quaternion ownership.

## @evidence contracts/development/design.md#principled-representation

For a fixed radian hinge branch, any degree swivel preserves effector radius; unit quaternions express root and mid articulations in their respective rest frames.

## @evidence contracts/development/design.md#minimal-and-owned-surface

hingedArmSwivel.pose returns this closure, retaining its precomputed aim and lower rotation for repeated candidate scoring.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The reader makes a fresh upper quaternion but shares lower, so it promises no deep copy of each sample.

# src/pose/IAutoMovieHingedArmSwivel.ts#IAutoMovieHingedArmSwivel.IPrepared

## @evidence contracts/development/common.md#meaningful-documentation

Defines unchanged borrowed source geometry, model-metre target points and per-target range ownership.

## @evidence contracts/development/design.md#principled-representation

The source fixes span coefficients and inverse root frame; a target fixes its reach distance and local aim goal independently of the swivel and bend branch.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The hinged articulation consumes branches and a branch poser; source workspaces need only target construction, with no score, seed or search policy exposed.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Every target computes its actual roots and every branch computes its actual aim; no candidate, target history, callback result or approximate key is retained.

# src/pose/IAutoMovieHingedArmSwivel.ts#IAutoMovieHingedArmSwivel.IPreparedTarget

## @evidence contracts/development/common.md#meaningful-documentation

States ordered branch roots and degree swivel posing, plus optional algebraic upper half-angle coefficients with fixed lower articulation.

## @evidence contracts/development/design.md#principled-representation

The target's local aim direction is shared by its two bend branches, while their lower rotations and swivel axes remain distinct.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Ordinary articulation consumes ordered stops/poser; explicit orientation-root continuation uses only the same branch's harmonic coefficients. No score or target result cache is exposed.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Degenerate branches return null under the same thresholds; the poser does not clamp, score or change a requested target.

# src/pose/IAutoMovieHingedArmSwivel.ts#IAutoMovieHingedArmSwivel.IHarmonic

## @evidence contracts/development/common.md#meaningful-documentation

upper(psi)=cosine*cos(psi/2)+sine*sin(psi/2) uses degree swivels after radians conversion; lower is the fixed hinge articulation.

## @evidence contracts/development/design.md#principled-representation

Fixed aim times the unit-axis quaternion gives its two half-angle coefficients; the hinge lower rotation is independent of swivel.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Only the explicit two-axis orientation-root dispatcher needs these three numeric quaternion records and their same-branch poser factory; no score, curve state or fitted answer is exposed.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Coefficients come from the known geometric rotation law, not sampled equality or a solved pose. Actual constraints/FK/goals remain the consumer's admission responsibility.
