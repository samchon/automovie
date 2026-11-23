# src/recovery/computation/IAutoMovieRecoveryMapPointProjectionOperation.ts#IAutoMovieRecoveryMapPointProjectionOperation.Operation

## @evidence contracts/development/common.md#meaningful-documentation

Documents parameter units, callback effects and failed admission for projectRecoveryMapPoint.

## @evidence contracts/development/design.md#principled-representation

Project one point in the pose's reconstruction frame through a row-major 3 by 3 pixel intrinsic matrix.

## @evidence contracts/development/design.md#minimal-and-owned-surface

projectRecoveryMapPoint and its typed callers share this signature and the referenced canonical input and result records.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Numerical qualification and caller budget admission remain required by projectRecoveryMapPoint; the type does not certify input validity.
