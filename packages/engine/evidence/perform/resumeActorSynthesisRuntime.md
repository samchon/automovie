# src/perform/resumeActorSynthesisRuntime.ts#resumeActorSynthesisRuntime

## @evidence contracts/development/implementation.md#principled-implementation

Indexes prior actors by node, updates known actor contexts, and replaces only already staged placement entries; the verified beat premise supplies matching poses and finite simulation quantities.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Beat continuation is separate from verb dispatch so every positional target and actor reads the same resumed snapshot.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The 1e-6 m/s threshold is the existing rest-speed policy; prior actors never create unstaged node entries, and duplicate prior ids use their final entry.

## @evidence contracts/development/common.md#meaningful-documentation

States the verified snapshot premise, carried pose/facing/root/speed/phase, rest-speed threshold, existing-id updates and borrowed nested data.

## @evidence contracts/development/implementation.md#efficient-algorithms

For A contexts, N placements and P prior actors, one action costs O(A+N+P) time and O(A+N+P) temporary entries; maps are rebuilt for each call because callers may mutate the supplied maps or prior state.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

One returned snapshot serves all reads within its action; cross-action caching is absent because mutable maps and previous-state objects provide no revision contract.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returned maps belong to the invocation and are released with it; only nested context, pose and translation references are shared, and there are no external resources.
