# src/resolve/applyLightOverride.ts#applyLightOverride

## @evidence contracts/development/implementation.md#principled-implementation

Reconstruct each admitted light kind from staged fields plus present overrides, preserving optional shadow policy spelling and the kind's own range/cone/area extent fields.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

An exhaustive discriminator switch owns light shape, while the local transform helper borrows unchanged transform/scale references.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Absent fields preserve staged values rather than zero defaults; directional lights do not gain range and area dimensions remain staged rather than fictional animation axes.

## @evidence contracts/development/common.md#meaningful-documentation

Docs identify whole-record reconstruction, untouched-transform identity and supported animated fields; scalar/channel validity is established by sampling and light admission.

## @evidence contracts/development/implementation.md#efficient-algorithms

A fixed set of light fields requires O(1) work/storage; only animated placement causes an additional transform wrapper.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Unanimated nested values and optional shadow records are borrowed; the shot resolver bypasses this function entirely for untouched lights.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The caller owns the new light/optional transform wrapper and the source owns borrowed fields; no native light, texture or task is acquired.
