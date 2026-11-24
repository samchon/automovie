# src/physics/solveDenseActiveSet.ts#solveDenseActiveSet

## @evidence contracts/development/common.md#meaningful-documentation

States the program's form, the change of variables, why its minimizer is the dense program's, and when it returns null.

## @evidence contracts/development/implementation.md#principled-implementation

IHMC's `ICPControllerQPSolver` hands a dense program to `JavaQuadProgSolver`, Goldfarb and Idnani's dual method. With the Cholesky factor H = L L^T and y = L^T x the objective becomes 1/2 y^T y - (L^-1 h)^T y and each row a x <= b becomes (L^-1 a^T)^T y <= b; the substitution is a bijection, so `solveXpbdDualActiveSet`, the same dual method on an identity objective, returns the same minimizer, and x = L^-T y. A matrix that is not positive definite fails the factorization and returns null.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Factor, substitute the linear term and the rows, solve, substitute back.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No casts; non-null assertions index the factor and the rows within their sizes. No regularization is added: a singular matrix fails.

## @evidence contracts/development/implementation.md#efficient-algorithms

O(n^3) for the factor and O(m n^2) for the rows, n the variables and m the rows; the solve is the dual method's own cost.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each program is new; no warm start is carried.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

It allocates its factor and rows per call and returns a fresh array.

# src/physics/solveDenseActiveSet.ts#solveDenseActiveSet

## @evidence contracts/development/common.md#meaningful-documentation

Documents the program and its rows.

## @evidence contracts/development/design.md#principled-representation

A dense matrix, a linear term and rows a x <= b, as IHMC writes the program.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Owned here; read by the capture-point feedback controller.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No optional members.

# src/physics/solveDenseActiveSet.ts#solveDenseActiveSet.IRow

## @evidence contracts/development/common.md#meaningful-documentation

Documents the coefficients and the bound.

## @evidence contracts/development/design.md#principled-representation

One inequality, one coefficient per variable.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Built by the controller from its support polygon's rows.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Both members required.

# src/physics/solveDenseActiveSet.ts#solveDenseActiveSet.IProblem

## @evidence contracts/development/common.md#meaningful-documentation

Documents the matrix, the linear term's sign and the rows.

## @evidence contracts/development/design.md#principled-representation

The objective 1/2 x^T H x - h^T x and its constraints; positive definiteness is checked at runtime by the factorization.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Built by the controller.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

All members required.
