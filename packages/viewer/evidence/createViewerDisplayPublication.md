# src/createViewerDisplayPublication.ts#createViewerDisplayPublication

## @evidence contracts/development/implementation.md#principled-implementation

Separates successful original bitmap copy from admitted session/generation and subsequent start; failed copy leaves prior identity/preparation intact, while disposal closes authority before releasing pending work. Caller supplies valid identity and transactional copy behavior; start failure occurs after identity commit and is not rolled back.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One small publication state machine owns preparation/commit/change authority while caller ports own actual pixels, encoding/upload and pending bitmap release.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Admission is actual copy success rather than a quiet watcher or fixture generation; closed/precommit branches follow lifecycle meaning, with no replacement native methods or fabricated persisted-frame success.

## @evidence contracts/development/common.md#meaningful-documentation

Distinguishes original staging, identity commitment, start side effects, active availability and completed filesystem IO; disposal and failed-copy obligations are explicit.

## @evidence contracts/development/implementation.md#efficient-algorithms

Coordinator uses constant scalar state and one optional identity record; real copy/start costs remain accounted by the supplied ports and are not reduced by this wrapper.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

A successful prepare is reused by the next commit without another copy, while changed copies real current pixels under the committed identity; effectful repeated changes are not cached by identity alone.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Holds one identity and prepared/closed flags while the caller owns one pending bitmap; dispose marks closed and invokes release once. A release throw is not retried or memoized as a repeated failure by this primitive, so native bitmap release uncertainty remains with its caller port.
