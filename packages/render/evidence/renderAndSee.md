# src/index.ts#renderAndSee

## @evidence contracts/development/implementation.md#principled-implementation

The wrapper executes renderVideo with the supplied spec and seconds, then attaches the requested duration and a shallow spec copy; nested spec objects remain shared with the caller.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Clip execution stays in renderVideo while this entry owns the inspectable artifact envelope used by a host or agent.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The wrapper neither invents capture paths nor suppresses adapter errors, and the returned frames are those the delegated capture loop received.

## @evidence contracts/development/common.md#meaningful-documentation

Request members identify seconds, output paths and adapter ownership; the result documents the spec snapshot, whose nested values callers must keep stable while rendering.

## @evidence contracts/development/implementation.md#efficient-algorithms

Beyond the delegated O(F) frame capture and metadata work, the wrapper performs a constant-size shallow spec copy and object merge.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

This wrapper performs one effectful render per invocation; the returned artifact can be retained by its caller but an equal spec does not authorize sharing host I/O.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The returned artifact owns its metadata arrays while host adapters own written files and running work; failures propagate from renderVideo without acquiring additional resources.
