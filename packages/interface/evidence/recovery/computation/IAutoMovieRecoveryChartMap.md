# src/recovery/computation/IAutoMovieRecoveryChartMap.ts#IAutoMovieRecoveryChartMap.Input

## @evidence contracts/development/design.md#principled-representation

Source vertex identities and triangle edges define positive harmonic weights; boundary coordinates carry the declared curve correspondence.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The topology owner supplies a chart and the map owner solves only its interior parameters.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Neither disk topology nor material correspondence is inferred from endpoint count or distance.

## @evidence contracts/development/common.md#meaningful-documentation

Records private addresses, normalized coordinates, numerical tolerance and finite work limits.

# src/recovery/computation/IAutoMovieRecoveryChartMap.ts#IAutoMovieRecoveryChartMap.Result

## @evidence contracts/development/design.md#principled-representation

The returned harmonic coordinates retain fixed values and independently computed signed areas for every original chart triangle.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Linear convergence and parameter orientation qualify different properties and remain separate.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Folded or collapsed triangles remain explicit; a converged solve does not certify a valid disk chart or a fitted surface.

## @evidence contracts/development/common.md#meaningful-documentation

States coordinate order, residual meaning, private witnesses and limited qualification.
