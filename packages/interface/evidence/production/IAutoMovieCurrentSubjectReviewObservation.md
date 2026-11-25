# src/production/IAutoMovieCurrentSubjectReviewObservation.ts#IAutoMovieCurrentSubjectReviewObservation

## @evidence contracts/development/design.md#principled-representation

An intersection of the persisted observation and the verification context, the TypeScript idiom for a record that satisfies both shapes; it relies on the shared members having identical types, which both declarations keep.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Composes the two owning declarations instead of restating `target` and `verdict`, so each member has one declaration and the engine's coverage fold reads one projection that production builds.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The type carries the verified shape, so the fold reads its declared fields with no runtime type check; it checks only non-blank identities and the target's subject, and no producer or fixture is special-cased.

## @evidence contracts/development/common.md#meaningful-documentation

States who creates the projection and after which checks, which member the context adds over the observation, and which values the fold checks before counting a record.
