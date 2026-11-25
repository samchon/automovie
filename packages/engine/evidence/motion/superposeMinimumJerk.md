# src/motion/superposeMinimumJerk.ts#superposeMinimumJerk

## @evidence contracts/development/implementation.md#principled-implementation

Both reads linearly superpose the same closed-form minimum-jerk units (Flash and Henis 1991), keeping origin cloning, unit order, normalized-time expression and each position[k]+=displacement[k]*s operation. Full state keeps original first/second derivative scalings and accumulation; position selects the exact same share from minimumJerk.share.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One private loop owns unit admission, profile selection and XYZ accumulation for the two actual output demands. The original complete reader returns its three-vector state; position returns the actual wrist/strike consumer's requested point, without a second path formula or callback hook.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Every unit still checks duration>0, without adding a finite-duration condition, and its original normalized time reaches the same finite-time refusal before clipping. Units with zero current share are not skipped, preserving signed-zero/nonfinite multiplication effects. Empty units keep the old lack of a time check; no sample reduction, tolerance, derivative approximation or result cache is introduced.

## @evidence contracts/development/implementation.md#efficient-algorithms

Both reads are O(U) for U units and inspect every unit/XYZ contribution. Complete state retains its original three output vectors, wrapper and per-unit derivative profiles. Position-only work omits two derivative polynomials per unit, derivative arithmetic, velocity/acceleration vectors and state wrapper. One private three-name constant also removes the per-unit component-array allocation. Runtime improvement is unmeasured.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Full and position readers share this exact loop and the minimumJerk scalar/profile owner; every requested time and current unit input is actually evaluated. Only fixed XYZ order is module-owned, with no origin, path, unit or time answer cached across calls.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Complete output owns three vectors and a state wrapper; position output owns one fresh origin clone, including empty input. Per-unit profiles exist only for full reads and are call-local. The module retains only one fixed three-name component tuple, with no input/output history, growing collection, handle or task.

## @evidence contracts/development/common.md#meaningful-documentation

Cites redirection evidence, states SI units/continuity, complete versus position-only output, per-unit duration/time admission and empty-list no-time-admission behavior.
