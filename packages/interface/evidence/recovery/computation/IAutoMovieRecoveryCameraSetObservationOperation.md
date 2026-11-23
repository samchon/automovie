# src/recovery/computation/IAutoMovieRecoveryCameraSetObservationOperation.ts#IAutoMovieRecoveryCameraSetObservationOperation.Operation

## @evidence contracts/development/common.md#meaningful-documentation

Documents parameter units, callback effects and failed admission for observeRecoveryCameraSet.

## @evidence contracts/development/design.md#principled-representation

Once-per-image Harris observations and bidirectional descriptor matches for supplied calibrated RGB views.

## @evidence contracts/development/design.md#minimal-and-owned-surface

observeRecoveryCameraSet and its typed callers share this signature and the referenced canonical input and result records.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Numerical qualification and caller budget admission remain required by observeRecoveryCameraSet; the type does not certify input validity.
