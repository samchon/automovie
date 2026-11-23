# src/physics/physicalPrincipalAxes.ts#physicalPrincipalAxes

## @evidence contracts/development/common.md#meaningful-documentation

States the method, the scaling, the order of the moments, the handedness of the axes and that the input is consumed.

## @evidence contracts/development/implementation.md#principled-implementation

Cyclic Jacobi rotations (Golub and Van Loan, Matrix Computations, section 8.5) zero each off-diagonal pair in a fixed order; an entry counts as zero against the machine epsilon of its two diagonal neighbours, and 32 sweeps bound the work. A sweep with no rotation leaves every entry unchanged, so all later sweeps would skip the same pairs and may be omitted without changing the result.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The single owner of the engine's inertia diagonalization: aggregate mass properties and hull solids both read it instead of carrying their own solve.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No fixed absolute tolerance enters; the non-null assertions index fixed 3x3 arrays the function itself builds or requires.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work: at most 32 sweeps of three plane rotations over nine entries, stopping after the first sweep that changes nothing instead of rescanning its unchanged entries. Each rotation shares its squared trigonometric factors and coupled off-diagonal term between the two diagonal updates. The initial maximum scans the rows directly without flattened or mapped arrays. Three adjacent index comparisons retain stable ascending finite-diagonal order without a sort array or captured comparator; the sorted axes need no intermediate axis array. Scalar handedness and an exclusively owned axis remove temporary cross/scale records. The three immutable pair records are shared without per-call allocation.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Three immutable pairs define the same cyclic order for every call. Each rotation's repeated factors and mirrored entries are reused without reassociating products. Only a complete sweep that performs no rotation proves later pair tests equivalent; no tensor, diagonalization result or mutable-input cache is retained.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Keeps no caller state between calls; numeric temporaries die with the call. Only the fixed three-pair order lives for the module lifetime.
