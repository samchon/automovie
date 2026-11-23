# src/soft/IAutoMovieSoftContact.ts#IAutoMovieSoftContact

## @evidence contracts/development/design.md#principled-representation

A radius in metres and a dimensionless Coulomb coefficient.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The two quantities self-contact and friction read; a domain without it keeps the frictionless, self-contact-free solve.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

One coefficient rather than separate static and kinetic ones, the model the cited friction uses with both equal; positivity is the engine validator's to enforce.

## @evidence contracts/development/common.md#meaningful-documentation

States the units, what each member governs and the friction model's source.
