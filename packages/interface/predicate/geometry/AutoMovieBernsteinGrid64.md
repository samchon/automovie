# src/geometry/AutoMovieBernsteinGrid64.ts#AutoMovieBernsteinGrid64

## @evidence contracts/development/common.md#meaningful-documentation

Tensor Bernstein coefficients arranged by outer longitudinal row and inner cross-course control ordinal.

## @evidence contracts/development/design.md#principled-representation

Grid construction elevates course values and derivative courses to a common inner degree. Outer evaluation blends matching inner ordinals into a full cross-course polynomial.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The grid stores complete coefficient rows. The consuming chart supplies parameter ranges, frame and derivative scale.
