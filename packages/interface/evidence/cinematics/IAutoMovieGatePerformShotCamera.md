# src/cinematics/IAutoMovieGatePerformShotCamera.ts#IAutoMovieGatePerformShotCamera.IProps

## @evidence contracts/development/design.md#principled-representation

Null denotes no elected live camera, and arrays retain authored action/coverage order. gatePerformShotCamera appends id, target, vocabulary and camera-domain failures to the context collector; its returned jobs alone do not establish admission.

## @evidence contracts/development/design.md#minimal-and-owned-surface

performShot supplies its already gathered frame jobs and blocking coverage; staged tables and diagnostics stay in the separate shared gate context.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The first staged camera is the explicit fallback only when no action elected one; no second live camera is synthesized for coverage.

## @evidence contracts/development/common.md#meaningful-documentation

States null/empty meanings, fallback order, camera-domain checks and collector-based failure handling.

# src/cinematics/IAutoMovieGatePerformShotCamera.ts#IAutoMovieGatePerformShotCamera.IResult

## @evidence contracts/development/design.md#principled-representation

Null liveCamera records that no elected or fallback camera exists; a non-null id or nonempty jobs array is not a success discriminant. Numerical camera validity remains in the separate collector.

## @evidence contracts/development/design.md#minimal-and-owned-surface

These are the two values performShot forwards after checking the collector; coverage jobs reuse canonical intent/camera records instead of copying scene state.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Partial results are explicit and are never documented as a certificate of camera validity; rejected duplicate or unresolved coverage entries do not receive substitutes.

## @evidence contracts/development/common.md#meaningful-documentation

Defines partial-result semantics, the caller's failure check and shallow ownership of returned jobs.
