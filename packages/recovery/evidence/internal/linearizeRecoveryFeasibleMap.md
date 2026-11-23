# src/internal/linearizeRecoveryFeasibleMap.ts#linearizeRecoveryFeasibleMap

## @evidence contracts/development/implementation.md#principled-implementation

Actual pinhole Jacobians give the soft-L1 gradient J^T*r/hypot(1,norm/scale), weighted original-design blocks and unweighted disk derivative 2*r^T*J/maximumError^2. Seed translation uses actual P_t B of r*normalize(t+Bz); SO3, later additive translation and Euclidean points complete the same chart without normal equations.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

This local derivative owner serves both metric factorization and complete original-coordinate certification; nonlinear qualification and actual retraction stay with the joint owner.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No robust weight changes the hard disk, no missing measurement is dropped, and nonpositive depth or an initially violated disk throws rather than becoming zero residual.

## @evidence contracts/development/common.md#meaningful-documentation

States physical coordinate order, normalized disk units, loss derivative and fixed measurement population.

## @evidence contracts/development/implementation.md#efficient-algorithms

E observations and C camera coordinates cost O(E*C+L) and retain O(E*C+L+C) entries; hard rows touch at most six camera and three point coordinates. The caller admits arrays plus64 fixed chart scratch and prepays512 extra visits for the seed differential before traversal.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Each projection supplies residual, objective gradient, disk derivative and both weighted Jacobian blocks in the same pass.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Owned blocks and rows transfer for one model lifetime; borrowed fixed intrinsics and measurements are not mutated or cached, and no external resource is acquired.
