# src/soft/IAutoMovieSoftCompliance.ts#IAutoMovieSoftCompliance

## @evidence contracts/development/design.md#principled-representation

One non-negative compliance per family, in metres per newton, the alpha of XPBD's distance constraints.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The three families the lattice already has, so the record mirrors `IAutoMovieSoftStiffness` member for member.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A physical compliance, not a relaxation weight; non-negativity and finiteness are the engine validator's to enforce.

## @evidence contracts/development/common.md#meaningful-documentation

States the unit, the source, the solver it feeds, why it is iteration-independent and what zero means.
