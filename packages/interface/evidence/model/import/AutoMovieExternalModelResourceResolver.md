# src/model/import/AutoMovieExternalModelResourceResolver.ts#AutoMovieExternalModelResourceResolver

## @evidence contracts/development/design.md#principled-representation

One exact URI maps synchronously to resident bytes or explicit absence; byte extent and image presence are admitted by validatePayloadClosure, while stable borrowed storage remains the host's lifetime obligation.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The inspection input and payload gate share this one buffer/image resolution capability; filesystem policy, loading and retained host state remain outside the contract.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The capability declares no fallback bytes, asynchronous completion, URI rewriting or image validity certificate; null preserves unavailable data for the gate's refusal.

## @evidence contracts/development/common.md#meaningful-documentation

States exact URI identity, borrowed lifetime, explicit absence, per-declaration invocation, propagated effects and the consumer's limited payload checks.
