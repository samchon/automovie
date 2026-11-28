# src/recovery/IAutoMovieRecoveryCameraPairEstimate.ts#IAutoMovieRecoveryCameraPairEstimate

## @evidence contracts/development/common.md#meaningful-documentation

The contract tells callers to read the qualification status before accessing a pose. It declares the accepted gauge, conditional correspondence and unknown physical scale.

## @evidence contracts/development/design.md#principled-representation

Recovery publishes acceptance after its final gate has a pose and no recorded refusal reason. A refused record keeps the attempted observations with a nonempty reason list and null pose. The variants use the already published status tags.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The result keeps the policy and observed counts that support the decision. The source RGB8 buffers stay with the caller.

# src/recovery/IAutoMovieRecoveryCameraPairEstimate.ts#IAutoMovieRecoveryCameraPairEstimate.IObservations

## @evidence contracts/development/common.md#meaningful-documentation

The common record explains source categories and order, the qualification policy, declared limits and tentative matches.

## @evidence contracts/development/design.md#principled-representation

The producer records feature counts in source order. Each match links two feature ordinals and stores flags set by the fitted support populations.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The common record carries policy, provenance, feature counts and match measurements into each outcome. Pose and consensus availability belong to the qualification variants.

# src/recovery/IAutoMovieRecoveryCameraPairEstimate.ts#IAutoMovieRecoveryCameraPairEstimate.IAccepted

## @evidence contracts/development/common.md#meaningful-documentation

The accepted variant describes the empty refusal list, measured consensus and transform in the first camera's frame.

## @evidence contracts/development/design.md#principled-representation

Recovery records acceptance only when every attempted qualification passes and there is a pose. Translation direction and unit-baseline gauge are explicit in the pose record.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The accepted variant adds the fixed status, empty reason list, measured consensus and owned pose to the shared observations. Sensor pixels stay with the caller.

# src/recovery/IAutoMovieRecoveryCameraPairEstimate.ts#IAutoMovieRecoveryCameraPairEstimate.IRefused

## @evidence contracts/development/common.md#meaningful-documentation

The refused variant requires at least one failed qualification, allows null consensus when the population is too small and promises a null pose.

## @evidence contracts/development/design.md#principled-representation

Fewer than eight matches give the appearance-match reason and no attempted consensus. Failed gates after fitting retain the measured consensus and reasons with a null pose.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The variant preserves observations already measured for diagnosis. It adds a nonempty list of reasons and a nullable consensus report.

# src/recovery/IAutoMovieRecoveryCameraPairEstimate.ts#IAutoMovieRecoveryCameraPairEstimate.IObservations.schema

## @evidence contracts/development/common.md#meaningful-documentation

Identifies the v1 camera-pair evidence format.

# src/recovery/IAutoMovieRecoveryCameraPairEstimate.ts#IAutoMovieRecoveryCameraPairEstimate.IObservations.objectId

## @evidence contracts/development/common.md#meaningful-documentation

Carries the fixed-scene identity supplied by the acquisition caller.

# src/recovery/IAutoMovieRecoveryCameraPairEstimate.ts#IAutoMovieRecoveryCameraPairEstimate.IObservations.cohort

## @evidence contracts/development/common.md#meaningful-documentation

Carries the declared source category and leaves its provenance with the caller.

# src/recovery/IAutoMovieRecoveryCameraPairEstimate.ts#IAutoMovieRecoveryCameraPairEstimate.IObservations.policy

## @evidence contracts/development/common.md#meaningful-documentation

Copies the admitted qualification policy used by the feature and consensus stages.

# src/recovery/IAutoMovieRecoveryCameraPairEstimate.ts#IAutoMovieRecoveryCameraPairEstimate.IObservations.budget

## @evidence contracts/development/common.md#meaningful-documentation

Copies the admitted work limits. The feature and consensus records give actual counts.

# src/recovery/IAutoMovieRecoveryCameraPairEstimate.ts#IAutoMovieRecoveryCameraPairEstimate.IObservations.sources

## @evidence contracts/development/common.md#meaningful-documentation

Carries the caller's source identities and calibration assertions. The producer snapshots camera tuples.

# src/recovery/IAutoMovieRecoveryCameraPairEstimate.ts#IAutoMovieRecoveryCameraPairEstimate.IObservations.features

## @evidence contracts/development/common.md#meaningful-documentation

Stores the measured feature populations in source order with their view IDs.

# src/recovery/IAutoMovieRecoveryCameraPairEstimate.ts#IAutoMovieRecoveryCameraPairEstimate.IObservations.matches

## @evidence contracts/development/common.md#meaningful-documentation

Stores tentative appearance correspondences and membership in the measured geometrical support sets.

# src/recovery/IAutoMovieRecoveryCameraPairEstimate.ts#IAutoMovieRecoveryCameraPairEstimate.IAccepted.status

## @evidence contracts/development/common.md#meaningful-documentation

Identifies observations that qualified the returned pose.

# src/recovery/IAutoMovieRecoveryCameraPairEstimate.ts#IAutoMovieRecoveryCameraPairEstimate.IAccepted.refusalReasons

## @evidence contracts/development/common.md#meaningful-documentation

Declares the empty reason list after all qualification gates passed.

# src/recovery/IAutoMovieRecoveryCameraPairEstimate.ts#IAutoMovieRecoveryCameraPairEstimate.IAccepted.consensus

## @evidence contracts/development/common.md#meaningful-documentation

Stores measured consensus and the final support statistics in the accepted record.

# src/recovery/IAutoMovieRecoveryCameraPairEstimate.ts#IAutoMovieRecoveryCameraPairEstimate.IAccepted.pose

## @evidence contracts/development/common.md#meaningful-documentation

Gives rotation and unit-baseline translation in the first camera's frame.

# src/recovery/IAutoMovieRecoveryCameraPairEstimate.ts#IAutoMovieRecoveryCameraPairEstimate.IRefused.status

## @evidence contracts/development/common.md#meaningful-documentation

Identifies observations that did not qualify a relative transform.

# src/recovery/IAutoMovieRecoveryCameraPairEstimate.ts#IAutoMovieRecoveryCameraPairEstimate.IRefused.refusalReasons

## @evidence contracts/development/common.md#meaningful-documentation

Requires at least one reason and describes the observed gate order.

# src/recovery/IAutoMovieRecoveryCameraPairEstimate.ts#IAutoMovieRecoveryCameraPairEstimate.IRefused.consensus

## @evidence contracts/development/common.md#meaningful-documentation

Declares that an attempted consensus may survive its later qualification failure. Fewer than eight matches leave it null.

# src/recovery/IAutoMovieRecoveryCameraPairEstimate.ts#IAutoMovieRecoveryCameraPairEstimate.IRefused.pose

## @evidence contracts/development/common.md#meaningful-documentation

Declares the null value when no pose passed all qualification checks.
