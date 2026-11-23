# src/render/IAutoMoviePoseKeypointActor.ts#IAutoMoviePoseKeypointActor

## @evidence contracts/development/design.md#principled-representation

The record keeps resolvePoseKeypoints output including joint order and off-frame flags, plus sceneFogTransmittance at the actor's root camera depth. That binary64 scalar predicts the viewer's fog law; GPU precision, per-joint depth variation, lighting and compositing prevent claiming exact captured-pixel agreement.

## @evidence contracts/development/design.md#minimal-and-owned-surface

One record holds node identity, projected joints and an optional root-sampled atmosphere fraction. Per-joint fog is absent, so depth variation across an actor is an approximation rather than a proven negligible visual difference.

## @evidence contracts/development/design.md#prohibited-design-shortcuts `atmosphere` is omitted rather than written as 1 or null for a scene without fog, so a sidecar of a fogless scene is byte-identical to one written before the field existed, and no consumer is special-cased.

## @evidence contracts/development/common.md#meaningful-documentation

The doc states who writes the record, which performances produce one and in what order, how a consumer reads each member, and each member states its meaning, range and absence.
