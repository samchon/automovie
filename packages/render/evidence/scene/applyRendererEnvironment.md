# src/scene/applyRendererEnvironment.ts#applyRendererEnvironment

## @evidence contracts/development/implementation.md#principled-implementation

Resolves supported shadow policy before assignment and realizes beauty scene policy before delivery fallback; structural passes select no tone mapping, unit exposure and disabled shadows. Admitted scene exposure/curve/filter are premises, while unsupported delivery curve values currently map to no tone mapping through the closed-union helper.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Owns reversible renderer fields only; scene image/fog state and texture acquisition are separate owners, and one local prior snapshot supplies independent restore operations.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Policy precedence and structural neutralization are explicit pass contracts, not host-brand exceptions; no renderer method/global is replaced, and setup/rollback failures retain both causes rather than pretending success.

## @evidence contracts/development/common.md#meaningful-documentation

Documents scene/delivery/host precedence and structural bypass; restoration captures curve, exposure and shadow enabled/type exactly rather than restoring a presumed default.

## @evidence contracts/development/implementation.md#efficient-algorithms

Reads/writes four fixed renderer fields and at most four independent restore operations, constant CPU/storage irrespective of scene or shadow-map dimensions; subsequent native shader/map costs belong to rendering.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Captures one prior snapshot per install and successful repeated restore is a no-op; failed restore is retried on a later request, so it is not a memoized failed completion or proof of physical GPU retirement.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Borrows renderer and retains four prior scalar values in the returned closure until the handle is released; no GPU handle is acquired, all restoration fields are attempted independently and setup failure invokes restore before propagating causes.
