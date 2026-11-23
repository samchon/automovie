# src/index.ts#autoMovieRenderTargetSettingsOfShot

## @evidence contracts/development/implementation.md#principled-implementation

Scene environment values supply tone mapping, exposure and shadow policy; disabled shadows map to shadowType none. Without an environment this helper chooses exposure one and disabled shadows, which match live settings only under the caller's neutral-host premise, since applyRendererEnvironment preserves existing exposure/shadows on that branch.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

This boundary projects compiled scene policy into target settings while the engine target sealer owns runtime admission of dimensions and setting values.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No shot is special-cased; absent-environment defaults are explicit projected assumptions, not observed host state. A previously configured host can differ, and this helper does not compensate for or detect that mismatch.

## @evidence contracts/development/common.md#meaningful-documentation

The comment names environment precedence and shadow invariants, and input members specify drawing-buffer pixels, device pixel ratio and delivery tone mapping.

## @evidence contracts/development/implementation.md#efficient-algorithms

The projection reads one environment and allocates one settings record, performing constant work irrespective of shot geometry or frame count.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Compiled environment policy is read directly without rebuilding scene state or resealing assets; each invocation reflects its supplied dimensions and pixel ratio.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The settings record contains only scalar values, so no compiled geometry, GPU allocation or host session is retained.
