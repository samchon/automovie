# src/architecture/IAutoMoviePatternFaceFrame.ts#IAutoMoviePatternFaceFrame

## @evidence contracts/development/design.md#principled-representation

The intended basis is orthonormal, admitted within `1e-6` norm/dot tolerances. A face point maps to `origin + u·U + v·V`; the computed cross product `U × V` supplies the right-handed normal and is only approximately unit for tolerated inputs.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Three vectors are the minimum to place a plane with a handedness; the normal is derived rather than stored, so it cannot disagree with the axes.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Axes outside the stated norm/dot tolerances are refused rather than silently normalized. Axes inside that band remain approximate; the check is not a zero-shear certificate in exact arithmetic.

## @evidence contracts/development/common.md#meaningful-documentation

States the mapping formula, the derived normal and its effect on facing, and each refusal with its tolerance.
