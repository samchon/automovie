# src/core/math/IAutoMovieQrDesignReduction.ts#IAutoMovieQrDesignReduction

## @evidence contracts/development/design.md#principled-representation

The upper original design and transformed right side retain the variable objective while the orthogonal residual is independent of x; no normal matrix or inverse represents the result.

## @evidence contracts/development/design.md#minimal-and-owned-surface

One named generic result carries the actual numerical output and separate work diagnostic consumed by original-design solvers.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

An upper triangle, tiny diagonal or finite residual is not a rank, covariance or physical-observability certificate.

## @evidence contracts/development/common.md#meaningful-documentation

Members define orientation, unchanged coordinate units, constant residual and actual transformed-cell count.
