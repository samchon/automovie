# src/fluid/IAutoMovieValidateFluidDomain.ts#IAutoMovieValidateFluidDomain.IProps

## @evidence contracts/development/common.md#meaningful-documentation

Identifies checked field groups, unchanged inputs, violation ownership and the limits of typed-object and Courant admission.

## @evidence contracts/development/design.md#principled-representation

Reuses the domain's metre grid and second-based solver fields; the number types do not replace validateFluidDomain's range, count and cross-field checks.

## @evidence contracts/development/design.md#minimal-and-owned-surface

One canonical domain is the complete request for validateFluidDomain, used by fluid lowering and binding validation.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Accepts a typed record rather than claiming unknown-object parsing or universal numerical stability; no corrective defaults are encoded.
