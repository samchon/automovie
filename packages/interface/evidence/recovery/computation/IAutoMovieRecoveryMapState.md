# src/recovery/computation/IAutoMovieRecoveryMapState.ts#IAutoMovieRecoveryMapState

## @evidence contracts/development/design.md#principled-representation

The ordered poses and landmark observations use the same seed gauge and feature identities throughout the fit.

## @evidence contracts/development/design.md#minimal-and-owned-surface

One internal numerical state passes between retraction, complete evaluation and local linearization.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No observation removal, pose injection or independent translation normalization is represented.

## @evidence contracts/development/common.md#meaningful-documentation

Fields state ordering and immutable population ownership.
