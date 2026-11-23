# src/render/IAutoMovieResolveShadowProfile.ts#IAutoMovieResolveShadowProfile.IProps

## @evidence contracts/development/design.md#principled-representation

Light id/type/castShadow facts and optional scene shadow policy produce either source-path violations or normalized caster face/filter counts.

## @evidence contracts/development/design.md#minimal-and-owned-surface

resolveAutoMovieShadowProfile reuses existing light and scene policy fields without native light or texture handles.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Enabled point VSM refuses; disabled/area/noncasting lights add no shadow work and no camera culling lowers the bound.

## @evidence contracts/development/common.md#meaningful-documentation

Documents legacy PCF default, pcfSoft normalization, result discriminant and caster-count units.

# src/render/IAutoMovieResolveShadowProfile.ts#IAutoMovieResolveShadowProfile.IResult

## @evidence contracts/development/design.md#principled-representation

Light id/type/castShadow facts and optional scene shadow policy produce either source-path violations or normalized caster face/filter counts.

## @evidence contracts/development/design.md#minimal-and-owned-surface

resolveAutoMovieShadowProfile reuses existing light and scene policy fields without native light or texture handles.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Enabled point VSM refuses; disabled/area/noncasting lights add no shadow work and no camera culling lowers the bound.

## @evidence contracts/development/common.md#meaningful-documentation

Documents legacy PCF default, pcfSoft normalization, result discriminant and caster-count units.
