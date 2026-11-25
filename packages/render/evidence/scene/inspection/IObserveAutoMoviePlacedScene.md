# src/scene/inspection/IObserveAutoMoviePlacedScene.ts#IObserveAutoMoviePlacedScene.IProps

## @evidence contracts/development/common.md#meaningful-documentation

Defines the point after placement, optional physical state, source checks and the time used to admit an optional touch witness.

## @evidence contracts/development/design.md#principled-representation

A native Scene and delivery Camera reference the original placement. An optional physical snapshot stays separate from native presentation objects.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Uses the same inputs in Viewer, capture and delivery, with no render or visit-history dependency.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The observer does not seek, resolve a motion or infer optional source times.

# src/scene/inspection/IObserveAutoMoviePlacedScene.ts#IObserveAutoMoviePlacedScene.INativeSupport

## @evidence contracts/development/common.md#meaningful-documentation

The named socket origin is the observed contacting point. The expected point is expressed in the support's rigid metre frame.

## @evidence contracts/development/design.md#principled-representation

Keeps the observation, support basis and declared target as three distinct facts.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Uses the existing support limits and a real placed socket without resampling model bones.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The selected socket can change with the rolling phase. A missing native reference cannot imply successful support.

# src/scene/inspection/IObserveAutoMoviePlacedScene.ts#IObserveAutoMoviePlacedScene.INativeGrip

## @evidence contracts/development/common.md#meaningful-documentation

Defines the two actual frames and independent target in hand-local metres.

## @evidence contracts/development/design.md#principled-representation

Retains the actual displayed hand and prop separate from the expected closure and in-hand motion.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Reuses canonical grip limits and existing native references.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The owner supplies the expected grip. Non-rigid frame bases leave this measurement unsupported.

# src/scene/inspection/IObserveAutoMoviePlacedScene.ts#IObserveAutoMoviePlacedScene.ICheck

## @evidence contracts/development/common.md#meaningful-documentation

Defines the key, ordered source paths, required policy and optional separately timed touch evidence.

## @evidence contracts/development/design.md#principled-representation

Canonical source facts, native contact references and raw track results share the report envelope, with need and evidence declared independently.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Source-specific poses and track buffers are not retained in a diagnostic. The observer can consume source-validation results prepared once.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Actual receipt evidence supplements a measured gap, never becomes its expected target. Track admission remains a source operation, not a frame scan.
