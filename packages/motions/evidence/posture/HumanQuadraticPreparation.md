# src/posture/HumanQuadraticPreparation.ts#HumanQuadraticPreparation.scaled

## @evidence contracts/development/implementation.md#principled-implementation

Uses modified Ruiz equilibration from Stellato et al. 2020, algorithm 2, with the existing ten passes and scaling limits; exact zero omission preserves the finite real quadratic program.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Owns admission, compression and numeric preparation once for the public quadratic solver; banded algebra remains in HumanQuadraticBand.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Uses exact comparisons and exact zero omission, preserving small coefficients, duplicate entries, row order, penalties and solver tolerances.

## @evidence contracts/development/implementation.md#efficient-algorithms

Admission and exact comparison take O(S+R+n+m), including supplied trailing curvature storage; misses add preparation's documented scaling cost, while hits allocate three row-sized bound and weight arrays.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Full P/q/A equality with the owner's last preparation, built on the same scaling, shares its complete scaled core. Misses may share its proved raw groups/topology, but run every scaling pass; final finite scans compare the new scaled P/A pair exactly and may share only that pair's identity. Current q, scales and residual metadata remain independent.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The owner retains one numeric preparation, O(S+n*w+Z+n+m), including inverse scales, until its next preparation replaces it or the owner is dropped; nothing is kept by this module. Fresh solve wrappers borrow raw rows, fixed models replace that loan with copies, and neither enters the retained core. A miss consumes fresh lo as scale scratch before overwriting it.

## @evidence contracts/development/common.md#meaningful-documentation

States the scaling source, zero and duplicate semantics, validation failures, caller ownership, exact reuse dependencies and retained-data lifetime.

# src/posture/HumanQuadraticPreparation.ts#HumanQuadraticPreparation.factor

## @evidence contracts/development/implementation.md#principled-implementation

Factors the reduced system Pbar plus sigma I plus Abar transpose diag(rho) Abar, the OSQP indirect system.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Validates the parameters, factors once and admits the factor's entries; adaptive rho updates and active-set polishing keep their existing banded-algebra calls.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Validates the complete rho vector and sigma and preserves every current solver parameter and convergence check.

## @evidence contracts/development/implementation.md#efficient-algorithms

Validates m step sizes, then Band.factor's O(n*w+sum(k_r*k_r)+n*w*w) canonical-band assembly and factorization; original supplied padding is already admitted.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The factor's reuse is its caller's: a fixed model keeps it in its memory while its rho is unchanged; current q, unit scales, bounds, weights and iterates do not enter this reduced matrix.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing; the returned factor is the caller's.

## @evidence contracts/development/common.md#meaningful-documentation

Defines the matrix, factor invalidation, read-only consumption and failure cases.

# src/posture/HumanQuadraticPreparation.ts#HumanQuadraticPreparation.IScaling

## @evidence contracts/development/design.md#principled-representation

The variables' scales D (one positive number a variable, the unit of x = D x-bar) and the cost's scale c, the two parts of Ruiz equilibration that depend on the variables and not on the rows.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Made by `HumanQuadraticInterior` from its first solve of a session and read by `scaled`; the rows' scales are each program's own.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No row, bound, weight or solution is carried; a length unlike the program's is not used.

## @evidence contracts/development/common.md#meaningful-documentation

States the two scales, their units and why reusing them leaves the solution.

# src/posture/HumanQuadraticPreparation.ts#HumanQuadraticPreparation.IOwner

## @evidence contracts/development/design.md#principled-representation

One optional preparation, the only state a caller lends `scaled`.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Held by `HumanQuadraticInteriorSession.ISession`; written and read by `scaled` alone.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No module-level map: the caller's lifetime bounds the preparation's.

## @evidence contracts/development/common.md#meaningful-documentation

States who holds the record and what `scaled` does with it.

# src/posture/HumanQuadraticPreparation.ts#HumanQuadraticPreparation.IPrepared

## @evidence contracts/development/design.md#principled-representation

Stores admitted original-unit P/q and ordered nonzero A beside their equilibrated core and the scaling it was built on, plus two distinct disposable n-entry scaling buffers whose complete overwrite is factory-owned; numeric snapshots enforce compatible dimensions and finite storage.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Supplies retained matrices, Admission's exact dependency snapshots and the equilibration's shape-matched scaling work through one caller-held record; work never enters public scaled data or state.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Holds no original problem, body, plan or result reference; copied dependencies and the copied scaling prove equivalence rather than trusting mutable source identity or an approximate numeric key.

## @evidence contracts/development/common.md#meaningful-documentation

Defines the copied raw snapshots, the recorded scaling, their ordered CSR correspondence and the internal admission consumer.
