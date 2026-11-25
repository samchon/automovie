# src/math/EllipticFunctions.ts#EllipticFunctions.firstKind

## @evidence contracts/development/common.md#meaningful-documentation

States the integral, the complementary parameter it takes, as `ellpk` does, and the refused domain.

## @evidence contracts/development/implementation.md#principled-implementation

Ported line for line from the Cephes Math Library as scipy ships it (`scipy/special/cephes/ellpk.c`, `ellpe.c`, `ellpj.c`, `polevl.h` at tag v1.11.4, BSD-3-Clause, "Cephes Math Library, Copyright 1984, 1987, 1989, 2000 by Stephen L. Moshier", scipy's changes "Copyright (c) 2001-2002 Enthought, Inc. 2003-2023, SciPy Developers"): the Hastings polynomial and logarithm approximation with its coefficients, the reciprocal transformation above 1 and the logarithmic limit at the singular end.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One branch per domain region, the coefficients as module constants.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A negative complementary parameter throws instead of returning a value; the limits are Cephes's own.

## @evidence contracts/development/implementation.md#efficient-algorithms

Two polynomials of eleven terms by Horner's rule; constant work.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function of one number; nothing is shared across calls.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.
# src/math/EllipticFunctions.ts#EllipticFunctions.secondKind

## @evidence contracts/development/common.md#meaningful-documentation

States the integral and the refused domain.

## @evidence contracts/development/implementation.md#principled-implementation

Ported line for line from the Cephes Math Library as scipy ships it (`scipy/special/cephes/ellpk.c`, `ellpe.c`, `ellpj.c`, `polevl.h` at tag v1.11.4, BSD-3-Clause, "Cephes Math Library, Copyright 1984, 1987, 1989, 2000 by Stephen L. Moshier", scipy's changes "Copyright (c) 2001-2002 Enthought, Inc. 2003-2023, SciPy Developers"): the polynomial and logarithm approximation of `ellpe` with its coefficients, and its transformation for a negative parameter.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One branch per domain region.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A parameter above 1 throws instead of returning a value.

## @evidence contracts/development/implementation.md#efficient-algorithms

Two polynomials by Horner's rule; constant work.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function of one number; nothing is shared across calls.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.
# src/math/EllipticFunctions.ts#EllipticFunctions.jacobi

## @evidence contracts/development/common.md#meaningful-documentation

States the four functions, the parameter's domain and the two failures `ellpj` reports.

## @evidence contracts/development/implementation.md#principled-implementation

Ported line for line from the Cephes Math Library as scipy ships it (`scipy/special/cephes/ellpk.c`, `ellpe.c`, `ellpj.c`, `polevl.h` at tag v1.11.4, BSD-3-Clause, "Cephes Math Library, Copyright 1984, 1987, 1989, 2000 by Stephen L. Moshier", scipy's changes "Copyright (c) 2001-2002 Enthought, Inc. 2003-2023, SciPy Developers"): the arithmetic-geometric mean and its backward recurrence (DLMF 22.20(ii)), the small and near-unit parameter expansions, and the `dn` guard after DLMF 22.20.5.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The two expansions, then the mean's forward pass and the backward recurrence.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A parameter outside 0 to 1 and a mean that does not converge in its nine terms throw, as `ellpj` reports them, instead of returning a value.

## @evidence contracts/development/implementation.md#efficient-algorithms

At most nine mean steps and as many recurrence steps; constant work.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function of two numbers; nothing is shared across calls.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Holds two arrays of at most nine numbers for the call; retains nothing.
# src/math/EllipticFunctions.ts#EllipticFunctions.IJacobi

## @evidence contracts/development/common.md#meaningful-documentation

States each of the four values ellpj returns.

## @evidence contracts/development/design.md#principled-representation

The four outputs of ellpj (sn, cn, dn, ph) as one record, named as DLMF names them.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Exactly the values the port computes; owned by EllipticFunctions.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No optional member and no derived value; each field is the function's own output.